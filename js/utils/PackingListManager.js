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

class PackingListManager {
    constructor() {
        this.firebaseManager = null;
        this.localStorageKey = 'packingListV2';
        this.firestoreCollection = firestoreConfig.collections.packingList;
        this.documentId = 'global';
        this.deviceId = this.generateDeviceId();
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
     * 📥 CARGAR DATOS: Cargar datos de Firebase para sincronización
     */
    async loadData() {
        try {
            if (!this.firebaseManager || !this.firebaseSetupComplete) {
                Logger.debug('🔥 Firebase not ready, returning empty data');
                return {};
            }

            const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const docRef = this.firebaseManager.getDocumentReference(this.firestoreCollection, this.documentId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                Logger.debug('🔥 Firestore data loaded:', data);
                return data || {};
            } else {
                Logger.debug('🔥 No Firestore document found');
                return {};
            }
        } catch (error) {
            Logger.error('Error loading Firestore data:', error);
            return {};
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
                
                if (firebaseData.items && Object.keys(firebaseData.items).length > 0) {
                    // FIRESTORE TIENE PRIORIDAD: Usar datos de Firebase
                    this.localCache = firebaseData.items;
                    this.saveToLocalStorage();
                    if (Logger && Logger.info) Logger.info('🎒 Loaded Firebase data (Firestore priority)');
                    this.updateUI();
                } else {
                    // Firebase vacío: Limpiar localStorage también
                    if (Logger && Logger.info) Logger.info('🎒 Firebase is empty, clearing localStorage');
                    this.localCache = {};
                    this.saveToLocalStorage();
                    this.updateUI();
                }
            } else {
                // No existe documento: Limpiar localStorage
                if (Logger && Logger.info) Logger.info('🎒 No Firebase document found, clearing localStorage');
                this.localCache = {};
                this.saveToLocalStorage();
                this.updateUI();
                if (Logger && Logger.info) Logger.info('🎒 No local or Firebase data - starting fresh');
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
            // 🚀 OPTIMISTIC UPDATE: Actualizar inmediatamente
            this.localCache[itemKey] = isChecked;
            this.saveToLocalStorage();
            
            // 📡 FIREBASE UPDATE: Sincronizar en background
            if (this.firebaseManager && this.firebaseManager.isConnected) {
                this.syncInProgress = true;
                await this.syncToFirebase();
                this.syncInProgress = false;
            }
            
            // Actualizar UI después de cambios
            this.updateUI();
            
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
        console.log(`📊 PackingListManager.getPackingStats called with totalItems: ${totalItems}`);
        console.log(`📊 Current localCache:`, this.localCache);
        
        const packedItems = Object.values(this.localCache).filter(Boolean).length;
        const percentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
        
        console.log(`📊 Packed items: ${packedItems}, Total: ${totalItems}, Percentage: ${percentage}%`);
        console.log(`📊 About to call weightEstimator.calculateTotalWeight with:`, this.localCache);
        
        // Asegurar que weightEstimator está disponible
        const estimator = window.weightEstimator || weightEstimator;
        if (!estimator) {
            console.error('❌ WeightEstimator not available');
            return {
                packed: packedItems,
                total: totalItems,
                percentage,
                remaining: totalItems - packedItems,
                weight: { totalGrams: 0, totalKg: "0.0", totalFormatted: "0kg" }
            };
        }
        
        const weightData = estimator.calculateTotalWeight(this.localCache);
        
        console.log(`📊 Weight calculation result:`, weightData);
        
        const result = {
            packed: packedItems,
            total: totalItems,
            percentage,
            remaining: totalItems - packedItems,
            weight: weightData
        };
        
        console.log(`📊 Final getPackingStats result:`, result);
        return result;
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
     * 🔄 UPDATE UI: Actualizar interfaz de usuario
     */
    updateUI() {
        // Actualizar métricas dinámicamente sin re-renderizar
        this.updateMetricsOnly();
        
        // También emitir evento para compatibilidad
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('packingListUpdated', {
                detail: { items: this.localCache }
            }));
        }
    }

    /**
     * 📊 UPDATE METRICS ONLY: Actualizar solo las métricas sin re-renderizar
     */
    updateMetricsOnly() {
        console.log('🔧 PackingListManager.updateMetricsOnly called');
        const container = document.querySelector('#packing-list-content');
        if (!container) {
            console.log('❌ No planning-content container found');
            return;
        }

        // Calcular estadísticas actualizadas - usar el total correcto
        const totalItems = Object.keys(this.localCache).length;
        console.log('🔧 Total items from localCache keys:', totalItems);
        console.log('🔧 Current localCache:', this.localCache);
        
        const stats = this.getPackingStats(totalItems);
        console.log('🔧 Calculated stats:', stats);

        // Actualizar elementos de métricas
        const packedCount = container.querySelector('#packed-count');
        const progressPercent = container.querySelector('#progress-percent');
        const totalWeight = container.querySelector('#total-weight');

        console.log('🔧 DOM elements found:', {
            packedCount: !!packedCount,
            progressPercent: !!progressPercent,
            totalWeight: !!totalWeight
        });

        if (packedCount) packedCount.textContent = `${stats.packed}/${stats.total}`;
        if (progressPercent) progressPercent.textContent = `${stats.percentage}%`;
        if (totalWeight) {
            const weightText = stats.weight.totalGrams ? (stats.weight.totalGrams / 1000).toFixed(1) : '0.0';
            console.log('🔧 Setting weight to:', `${weightText}kg`);
            totalWeight.textContent = `${weightText}kg`;
        }
    }

    /**
     * 💾 SAVE TO LOCALSTORAGE: Guardar cache en localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.localCache));
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error saving to localStorage:', error);
        }
    }

    /**
     * 📥 LOAD FROM LOCALSTORAGE: Cargar datos desde localStorage
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error loading from localStorage:', error);
            return {};
        }
    }

    /**
     * 🔧 GENERATE DEVICE ID: Generar ID único del dispositivo
     */
    generateDeviceId() {
        const stored = localStorage.getItem('deviceId');
        if (stored) return stored;
        
        const deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
        return deviceId;
    }

    /**
     * 🧹 CLEAN DUPLICATE KEYS: Limpiar claves duplicadas
     */
    async cleanDuplicateKeys() {
        try {
            const keysToRemove = [
                'calzado_botas_trekking',
                'ropa_camisetas_manga_larga', 
                'calzado_sandalias_hotel'
            ];
            
            // Limpiar localStorage
            const localData = JSON.parse(localStorage.getItem('packingListV2') || '{}');
            keysToRemove.forEach(key => delete localData[key]);
            localStorage.setItem('packingListV2', JSON.stringify(localData));
            
            // Limpiar Firestore
            if (this.firebaseManager && this.firebaseManager.isConnected) {
                const { doc, updateDoc, deleteField } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const docRef = doc(this.firebaseManager.db, this.firestoreCollection, this.documentId);
                
                const updates = {};
                keysToRemove.forEach(key => {
                    updates[`items.${key}`] = deleteField();
                });
                
                await updateDoc(docRef, updates);
            }
            
            // Actualizar cache local
            keysToRemove.forEach(key => delete this.localCache[key]);
            
            Logger.success('🧹 Duplicate keys cleaned successfully');
            return true;
        } catch (error) {
            Logger.error('🧹 Error cleaning duplicate keys:', error);
            return false;
        }
    }
}

// Export the class as default
export default PackingListManager;

// Singleton instance
let packingListManagerInstance = null;

export function getPackingListManager() {
    if (!packingListManagerInstance) {
        packingListManagerInstance = new PackingListManager();
    }
    return packingListManagerInstance;
}
