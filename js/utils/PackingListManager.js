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
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class PackingListManager {
    constructor() {
        this.firebaseManager = null;
        this.localStorageKey = 'packingListV2';
        this.firestoreCollection = 'packingList';
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
                        if (Logger && Logger.success) Logger.success('🎒 PackingListManager Firebase sync configured');
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
            const docRef = doc(db, this.firestoreCollection, this.deviceId);
            
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

            // Sincronizar datos existentes
            await this.syncToFirebase();
            
            if (Logger && Logger.success) Logger.success('🎒 Firebase sync configured');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error setting up Firebase sync:', error);
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
     * 📊 GET STATS: Obtener estadísticas de empacado
     */
    getPackingStats(totalItems) {
        const packedItems = Object.values(this.localCache).filter(Boolean).length;
        const percentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
        
        return {
            packed: packedItems,
            total: totalItems,
            percentage,
            remaining: totalItems - packedItems
        };
    }

    /**
     * 🔄 SYNC TO FIREBASE: Subir datos locales a Firebase
     */
    async syncToFirebase() {
        if (!this.firebaseManager || !this.firebaseManager.isConnected) return;

        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const db = this.firebaseManager.db;
            const docRef = doc(db, this.firestoreCollection, this.deviceId);
            
            await setDoc(docRef, {
                items: this.localCache,
                lastUpdated: serverTimestamp(),
                deviceId: this.deviceId,
                version: '1.0.0'
            }, { merge: true });
            
            if (Logger && Logger.success) Logger.success('🎒 Synced to Firebase');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error syncing to Firebase:', error);
            throw error;
        }
    }

    /**
     * 📥 HANDLE FIREBASE UPDATE: Procesar actualizaciones desde Firebase
     */
    handleFirebaseUpdate(firebaseItems) {
        try {
            // Comparar con cache local para detectar cambios
            const hasChanges = Object.keys(firebaseItems).some(key => 
                this.localCache[key] !== firebaseItems[key]
            );

            if (hasChanges) {
                if (Logger && Logger.init) Logger.init('🎒 Received Firebase update');
                
                // Actualizar cache local
                this.localCache = { ...this.localCache, ...firebaseItems };
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
            Object.keys(this.localCache).forEach(itemKey => {
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
            
            // Actualizar estadísticas si existe el componente
            this.updatePackingStats();
            
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error updating UI:', error);
        }
    }

    /**
     * 📊 UPDATE PACKING STATS: Actualizar estadísticas de empacado
     */
    updatePackingStats() {
        const statsContainer = document.getElementById('packing-stats');
        if (!statsContainer) return;

        try {
            // Contar total de items desde tripConfig
            const totalItems = Object.values(window.tripConfig?.packingListData || {})
                .flat().length;
            
            const stats = this.getPackingStats(totalItems);
            
            statsContainer.innerHTML = `
                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-xl border border-teal-200 dark:border-teal-700">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-teal-600 dark:text-teal-400">
                            ${stats.percentage === 100 ? 'check_circle' : 'luggage'}
                        </span>
                        <div>
                            <h3 class="font-semibold text-slate-900 dark:text-white">Progreso de Equipaje</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                ${stats.packed} de ${stats.total} artículos listos
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-teal-600 dark:text-teal-400">${stats.percentage}%</div>
                        <div class="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500" 
                                 style="width: ${stats.percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎒 Error updating packing stats:', error);
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

// Singleton instance
let packingListManagerInstance = null;

export function getPackingListManager() {
    if (!packingListManagerInstance) {
        packingListManagerInstance = new PackingListManager();
    }
    return packingListManagerInstance;
}
