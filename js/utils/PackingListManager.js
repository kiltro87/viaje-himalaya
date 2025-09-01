/**
 * 🎒 PACKING LIST MANAGER
 * 
 * Gestiona la sincronización de la lista de equipaje con Firebase Firestore.
 * Permite guardar y sincronizar el estado de cada item (empacado/no empacado)
 * entre dispositivos en tiempo real.
 * 
 * Funcionalidades:
 * - Sincronización automática con Firebase
 * - Fallback a localStorage si Firebase no está disponible
 * - Optimistic UI para mejor experiencia de usuario
 * - Real-time updates entre dispositivos
 * - Gestión de conflictos y rollback automático
 * 
 * @author David Ferrer Figueroa
 * @version 3.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { firestoreConfig } from '../config/firebaseConfig.js';
import { weightEstimator } from './WeightEstimator.js';

export class PackingListManager {
    constructor() {
        this.firebaseManager = null;
        this.localStorageKey = 'packingListV2';
        this.firestoreCollection = firestoreConfig.collections.packingList;
        this.documentId = 'global'; // Documento global único para todos los dispositivos
        this.deviceId = this.generateDeviceId(); // Mantenido para tracking
        this.isInitialized = false;
        this.syncInProgress = false;
        this.firebaseSetupComplete = false;
        
        // Cache local para optimistic UI
        this.localCache = this.loadFromLocalStorage();
        
        if (Logger && Logger.info) Logger.info('🎒 PackingListManager initialized');
    }

    /**
     * 🔧 INICIALIZACIÓN: Configurar Firebase y listeners
     */
    async initialize(firebaseManager) {
        try {
            this.firebaseManager = firebaseManager;
            
            // Configurar callback para cuando Firebase se conecte
            if (this.firebaseManager) {
                // Configurar el callback para detectar cuando Firebase esté listo
                const originalCallback = this.firebaseManager.onSyncStatusChanged;
                this.firebaseManager.onSyncStatusChanged = (status) => {
                    // Llamar al callback original si existe
                    if (originalCallback) {
                        originalCallback(status);
                    }
                    
                    // Configurar PackingList cuando Firebase esté conectado
                    if (status === 'connected' && !this.firebaseSetupComplete) {
                        this.setupFirebaseSync();
                        this.firebaseSetupComplete = true;

                    }
                };
                
                // Si ya está conectado, configurar inmediatamente
                if (this.firebaseManager.isConnected) {
                    await this.setupFirebaseSync();
                    this.firebaseSetupComplete = true;
                    if (Logger && Logger.success) Logger.success('🎒 PackingListManager initialized with Firebase');
                } else {
                    if (Logger && Logger.info) Logger.info('🎒 PackingListManager waiting for Firebase connection');
                }
            } else {
                if (Logger && Logger.warning) Logger.warning('🎒 PackingListManager initialized without Firebase (localStorage only)');
            }
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error initializing PackingListManager:', error);
            this.isInitialized = true; // Continuar con localStorage
            return false;
        }
    }

    /**
     * 🔥 FIREBASE SYNC: Configurar listeners en tiempo real
     */
    async setupFirebaseSync() {
        if (!this.firebaseManager) return;

        try {
            // Importar módulos de Firebase dinámicamente
            const { collection, doc, onSnapshot, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const db = this.firebaseManager.db;
            const docRef = doc(db, this.firestoreCollection, this.documentId);
            
            // Cargar datos iniciales de Firebase
            await this.loadInitialData(docRef);
            
            // Listener para cambios en tiempo real
            this.unsubscribe = onSnapshot(docRef, (docSnapshot) => {
                if (docSnapshot.exists() && !this.syncInProgress) {
                    const firebaseData = docSnapshot.data();
                    if (firebaseData.items) {
                        this.handleFirebaseUpdate(firebaseData.items);
                    }
                }
            }, (error) => {
                Logger.error('🎒 Firebase listener error:', error);
            });
            

        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error setting up Firebase sync:', error);
        }
    }

    /**
     * 📥 CARGAR DATOS INICIALES: Cargar datos de Firebase al inicializar
     */
    async loadInitialData(docRef) {
        try {
            const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            if (Logger && Logger.info) Logger.info('🎒 Loading initial data from Firebase...');
            
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
                const firebaseData = docSnapshot.data();
                if (Logger && Logger.info) Logger.info('🎒 Firebase document exists:', firebaseData);
                
                if (firebaseData.items) {
                    const itemCount = Object.keys(firebaseData.items).length;
                    const localCount = Object.keys(this.localCache).length;
                    if (Logger && Logger.info) Logger.info(`🎒 Found ${itemCount} items in Firebase, ${localCount} items locally`);
                    
                    // MERGE INTELIGENTE: Combinar datos locales y remotos
                    const mergedItems = { ...firebaseData.items, ...this.localCache };
                    
                    // Si hay cambios locales, enviarlos a Firebase
                    if (localCount > 0) {
                        this.localCache = mergedItems;
                        this.saveToLocalStorage();
                        await this.syncToFirebase(); // Enviar merge a Firebase
                        if (Logger && Logger.info) Logger.info('🎒 Merged local and Firebase data, synced back');
                    } else {
                        // Solo datos remotos, cargar directamente
                        this.localCache = firebaseData.items;
                        this.saveToLocalStorage();
                        if (Logger && Logger.info) Logger.info('🎒 Loaded Firebase data');
                    }
                    
                    this.updateUI();
                } else {
                    if (Logger && Logger.warning) Logger.warning('🎒 Firebase document exists but has no items');
                }
            } else {
                if (Logger && Logger.info) Logger.info('🎒 No Firebase document found');
                // Si no hay datos en Firebase Y hay datos locales, sincronizar
                if (Object.keys(this.localCache).length > 0) {
                    await this.syncToFirebase();
                    if (Logger && Logger.info) Logger.info('🎒 Local data synced to Firebase');
                } else {
                    if (Logger && Logger.info) Logger.info('🎒 No local or Firebase data - starting fresh');
                }
            }
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error loading initial data:', error);
        }
    }

    /**
     * 📦 TOGGLE ITEM: Cambiar estado de un item (empacado/no empacado)
     */
    async toggleItem(itemKey, isChecked) {
        try {
            // 🚀 OPTIMISTIC UPDATE: Actualizar inmediatamente la UI
            this.localCache[itemKey] = isChecked;
            this.saveToLocalStorage();
            
            // Actualizar UI inmediatamente para mejor UX
            this.updateUI();
            
            // 📡 FIREBASE UPDATE: Sincronizar en background
            if (this.firebaseManager && this.firebaseManager.isConnected) {
                this.syncInProgress = true;
                await this.syncToFirebase();
                this.syncInProgress = false;
            }
            
            if (Logger && Logger.data) Logger.data(`🎒 Item ${itemKey} ${isChecked ? 'packed' : 'unpacked'}`);
            return true;
            
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error toggling item:', error);
            
            // ❌ ROLLBACK: Revertir cambio optimista
            this.localCache[itemKey] = !isChecked;
            this.saveToLocalStorage();
            this.updateUI();
            
            return false;
        }
    }

    /**
     * 📊 GET ITEMS: Obtener estado actual de todos los items
     */
    getItems() {
        return { ...this.localCache };
    }

    /**
     * 📊 GET ITEM STATUS: Obtener estado de un item específico
     */
    getItemStatus(itemKey) {
        return this.localCache[itemKey] || false;
    }

    /**
     * 📊 GET STATS: Obtener estadísticas de empacado con peso
     */
    getPackingStats(totalItems) {
        const packedItems = Object.values(this.localCache).filter(Boolean).length;
        const percentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
        const weightData = weightEstimator.calculateTotalWeight(this.localCache);
        
        return {
            packed: packedItems,
            total: totalItems,
            percentage,
            remaining: totalItems - packedItems,
            weight: weightData
        };
    }

    /**
     * 🧹 CLEAN FIREBASE DATA: Remove invalid keys with [object Object] - DISABLED
     */
    async cleanFirebaseData() {
        // DISABLED: This method was causing data loss on refresh
        if (Logger && Logger.warning) Logger.warning('🧹 cleanFirebaseData() is disabled to prevent data loss');
        return;
    }

    /**
     * 🔄 SYNC TO FIREBASE: Subir datos locales a Firebase
     */
    async syncToFirebase() {
        if (!this.firebaseManager || !this.firebaseManager.isConnected) return;

        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const db = this.firebaseManager.db;
            const docRef = doc(db, this.firestoreCollection, this.documentId);
            
            // Clean data before syncing
            const cleanedCache = {};
            Object.entries(this.localCache).forEach(([key, value]) => {
                if (!key.includes('[object Object]')) {
                    cleanedCache[key] = value;
                } else {
                    Logger.warning('🧹 SYNC: Skipping invalid key:', key);
                }
            });
            
            const dataToSync = {
                items: cleanedCache,
                lastUpdated: serverTimestamp(),
                lastDeviceId: this.deviceId,
                version: '3.0.0'
            };
            
            await setDoc(docRef, dataToSync, { merge: true });
            
            // Update local cache with cleaned data
            this.localCache = cleanedCache;
            this.saveToLocalStorage();
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error syncing to Firebase:', error);
            throw error;
        }
    }

    /**
     * 📥 SYNC FROM FIREBASE: Obtener datos desde Firebase
     */
    async syncFromFirebase() {
        if (!this.firebaseManager || !this.firebaseManager.isConnected) return;
        
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = this.firebaseManager.db;
            const docRef = doc(db, this.firestoreCollection, this.documentId);
            
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const firebaseItems = data.items || {};
                
                // Clean invalid keys before using
                const cleanedItems = {};
                Object.entries(firebaseItems).forEach(([key, value]) => {
                    if (!key.includes('[object Object]')) {
                        cleanedItems[key] = value;
                    }
                });
                
                // Update local cache
                this.localCache = { ...this.localCache, ...cleanedItems };
                this.saveToLocalStorage();
                
                // Force UI update after sync
                this.updateUI();
                
                Logger.debug('🔄 SYNC FROM FIREBASE: Loaded items:', Object.keys(cleanedItems).length);
            }
        } catch (error) {
            Logger.error('🔄 ERROR syncing from Firebase:', error);
        }
    }

    /**
     * 🔧 SETUP FIREBASE LISTENER: Configurar listener para cambios en tiempo real
     */
    setupFirebaseListener() {
        if (!this.firebaseManager || !this.firebaseManager.isConnected) {
            Logger.debug('🔧 Firebase not connected, skipping listener setup');
            return;
        }
        
        try {
            // Import Firebase functions
            import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
                .then(({ doc, onSnapshot }) => {
                    const db = this.firebaseManager.db;
                    const docRef = doc(db, this.firestoreCollection, this.documentId);
                    
                    // Setup real-time listener
                    this.unsubscribe = onSnapshot(docRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            const firebaseItems = data.items || {};
                            this.handleFirebaseUpdate(firebaseItems);
                        }
                    });
                    
                    Logger.success('🔧 Firebase listener configured successfully');
                })
                .catch(error => {
                    Logger.error('🔧 Error setting up Firebase listener:', error);
                });
        } catch (error) {
            Logger.error('🔧 Error in setupFirebaseListener:', error);
        }
    }

    /**
     * 📥 HANDLE FIREBASE UPDATE: Procesar actualizaciones desde Firebase
     */
    handleFirebaseUpdate(firebaseItems) {
        try {
            // Clean invalid keys before processing
            const cleanedItems = {};
            Object.entries(firebaseItems).forEach(([key, value]) => {
                if (!key.includes('[object Object]')) {
                    cleanedItems[key] = value;
                }
            });
            
            // Comparar con cache local para detectar cambios
            const hasChanges = Object.keys(cleanedItems).some(key => 
                this.localCache[key] !== cleanedItems[key]
            );

            if (hasChanges) {
                if (Logger && Logger.init) Logger.init('🎒 Received Firebase update');
                
                // Actualizar cache local
                this.localCache = { ...this.localCache, ...cleanedItems };
                this.saveToLocalStorage();
                
                // Actualizar UI
                this.updateUI();
            }
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error handling Firebase update:', error);
        }
    }

    /**
     * 🔄 UPDATE UI: Actualizar checkboxes en la interfaz
     */
    updateUI() {
        try {
            const cacheKeys = Object.keys(this.localCache);
            
            cacheKeys.forEach(itemKey => {
                const checkbox = document.querySelector(`input[data-item-key="${itemKey}"]`);
                if (checkbox && checkbox.checked !== this.localCache[itemKey]) {
                    checkbox.checked = this.localCache[itemKey];
                    
                    // Trigger visual update (line-through effect)
                    const label = checkbox.nextElementSibling;
                    if (label) {
                        if (this.localCache[itemKey]) {
                            label.classList.add('line-through', 'text-slate-400', 'dark:text-slate-500');
                        } else {
                            label.classList.remove('line-through', 'text-slate-400', 'dark:text-slate-500');
                        }
                    }
                }
            });
            
            // Actualizar estadísticas inmediatamente y con delay de respaldo
            this.updatePackingStats();
            setTimeout(() => {
                this.updatePackingStats();
            }, 100);
            
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error updating UI:', error);
        }
    }

    /**
     * 📊 UPDATE PACKING STATS: Actualizar estadísticas de empacado con peso
     */
    updatePackingStats() {
        // Check if we're in the planning tab first
        const planningTab = document.querySelector('[data-tab="planning"]');
        if (!planningTab || !planningTab.classList.contains('active')) {
            // Not in planning tab, skip stats update
            return;
        }
        
        // Force create stats container if it doesn't exist
        let statsContainer = document.getElementById('packing-stats');
        if (!statsContainer) {
            const packingListContainer = document.getElementById('packing-list-content');
            if (packingListContainer) {
                const statsDiv = document.createElement('div');
                statsDiv.id = 'packing-stats';
                statsDiv.className = 'mb-6';
                packingListContainer.insertBefore(statsDiv, packingListContainer.firstChild);
                statsContainer = statsDiv;
            } else {
                // Container doesn't exist, probably not in planning tab
                Logger.debug('🔥 packing-list-content not found - not in planning tab');
                return;
            }
        }
        
        // Force render stats immediately
        this.renderPackingStats(statsContainer);
    }

    renderPackingStats(statsContainer) {
        try {
            // Calcular desde checkboxes visibles primero
            const checkboxes = document.querySelectorAll('#packing-list-content input[type="checkbox"]');
            const totalItems = checkboxes.length;
            const packedItems = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
            
            Logger.debug('🔥 PACKING STATS UPDATE:', { 
                totalItems, 
                packedItems,
                checkboxesFound: checkboxes.length
            });
            
            // Si no hay checkboxes, calcular desde localCache
            if (checkboxes.length === 0) {
                const totalFromCache = Object.keys(this.localCache).length;
                const packedFromCache = Object.values(this.localCache).filter(Boolean).length;
                
                if (totalFromCache === 0) {
                    setTimeout(() => {
                        this.updatePackingStats();
                    }, 500);
                    return;
                }
                
                // Usar datos del cache
                const stats = {
                    packed: packedFromCache,
                    total: totalFromCache,
                    percentage: totalFromCache > 0 ? Math.round((packedFromCache / totalFromCache) * 100) : 0,
                    remaining: totalFromCache - packedFromCache
                };
                
                this.renderStatsFromCache(stats, statsContainer);
                return;
            }
            
            const stats = {
                packed: packedItems,
                total: totalItems,
                percentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
                remaining: totalItems - packedItems
            };
            
            try {
            // Calcular peso estimado
            const weightData = weightEstimator.calculateTotalWeight(this.localCache);
            const analysis = weightData.analysis;
            
            // Colores según el estado del peso
            const weightColors = {
                excellent: 'text-green-600 dark:text-green-400',
                ok: 'text-blue-600 dark:text-blue-400', 
                caution: 'text-yellow-600 dark:text-yellow-400',
                warning: 'text-orange-600 dark:text-orange-400',
                critical: 'text-red-600 dark:text-red-400'
            };
            
            statsContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- Progreso de Equipaje -->
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Progreso de Equipaje</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white">${stats.percentage}%</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${stats.packed}/${stats.total} completado</p>
                    </div>
                    
                    <!-- Peso Total -->
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Peso Estimado</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white">${analysis.weightKg}kg</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">mochila total</p>
                    </div>
                </div>
            `;
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error updating packing stats:', error);
        }
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error in updatePackingStats:', error);
        }
    }
    
    /**
     * 📊 RENDER STATS FROM CACHE: Renderizar estadísticas desde cache cuando no hay DOM
     */
    renderStatsFromCache(stats, statsContainer) {
        try {
            // Calcular peso estimado desde cache
            const weightData = weightEstimator.calculateTotalWeight(this.localCache);
            const analysis = weightData.analysis;
            
            // Colores según el estado del peso
            const weightColors = {
                excellent: 'text-green-600 dark:text-green-400',
                ok: 'text-blue-600 dark:text-blue-400', 
                caution: 'text-yellow-600 dark:text-yellow-400',
                warning: 'text-orange-600 dark:text-orange-400',
                critical: 'text-red-600 dark:text-red-400'
            };
            
            statsContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- Progreso de Equipaje -->
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Progreso de Equipaje</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white">${stats.percentage}%</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${stats.packed}/${stats.total} completado</p>
                    </div>
                    
                    <!-- Peso Total -->
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Peso Estimado</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white">${analysis.weightKg}kg</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">mochila total</p>
                    </div>
                </div>
            `;
            
            Logger.debug('🔥 PACKING STATS: Rendered from cache successfully', stats);
        } catch (error) {
            Logger.error('🔥 PACKING STATS: Error rendering from cache:', error);
        }
    }

    /**
     * 💾 LOCAL STORAGE: Guardar en localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.localCache));
        } catch (error) {
            Logger.error('🎒 Error saving to localStorage:', error);
        }
    }

    /**
     * 📥 LOCAL STORAGE: Cargar desde localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.localStorageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            Logger.error('🎒 Error loading from localStorage:', error);
            return {};
        }
    }

    /**
     * 🆔 DEVICE ID: Generar ID único del dispositivo
     */
    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * 🧹 CLEANUP: Limpiar listeners y recursos
     */
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        Logger.info('🎒 PackingListManager cleaned up');
    }

    /**
     * 🎯 INITIALIZE: Configurar el manager con Firebase
     */
    async initialize(firebaseManager) {
        try {
            this.firebaseManager = firebaseManager;
            this.loadFromLocalStorage();
            
            if (firebaseManager && firebaseManager.isConnected) {
                // Solo sincronizar desde Firebase, NO limpiar
                await this.syncFromFirebase();
            }
            
            // Force initial UI update regardless of Firebase status
            this.updateUI();
            
            // Configurar listener para cambios en Firebase
            this.setupFirebaseListener();
            
            if (Logger && Logger.info) Logger.info('🎒 PackingListManager initialized');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error initializing PackingListManager:', error);
        }
    }

    /**
     * 🔄 RESET: Resetear todos los items (desmarcar todo)
     */
    async resetAllItems() {
        try {
            this.localCache = {};
            this.saveToLocalStorage();
            
            if (this.firebaseManager && this.firebaseManager.isConnected) {
                await this.syncToFirebase();
            }
            
            this.updateUI();
            Logger.success('🎒 All items reset');
            return true;
        } catch (error) {
            Logger.error('🎒 Error resetting items:', error);
            return false;
        }
    }

    /**
     * ✅ MARK ALL PACKED: Marcar todos los items como empacados
     */
    async markAllPacked() {
        try {
            // Obtener todos los items de tripConfig
            const allItems = Object.entries(window.tripConfig?.packingListData || {})
                .flatMap(([category, items]) => 
                    items.map((item, index) => `${category.replace(/\s+/g, '-')}-${index}`)
                );
            
            // Marcar todos como empacados
            allItems.forEach(itemKey => {
                this.localCache[itemKey] = true;
            });
            
            this.saveToLocalStorage();
            
            if (this.firebaseManager && this.firebaseManager.isConnected) {
                await this.syncToFirebase();
            }
            
            this.updateUI();
            Logger.success('🎒 All items marked as packed');
            return true;
        } catch (error) {
            Logger.error('🎒 Error marking all packed:', error);
            return false;
        }
    }
}

// Class already exported above

// Singleton instance
let packingListManagerInstance = null;

export function getPackingListManager() {
    if (!packingListManagerInstance) {
        packingListManagerInstance = new PackingListManager();
    }
    return packingListManagerInstance;
}
