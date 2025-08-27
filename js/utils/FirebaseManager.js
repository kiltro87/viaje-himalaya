/**
 * FirebaseManager - Gestor de Almacenamiento en la Nube
 * 
 * Maneja toda la integración con Firebase Firestore para almacenar
 * los gastos del viaje en la nube con sincronización automática
 * y soporte offline.
 * 
 * Funcionalidades principales:
 * - Conexión automática a Firebase
 * - Sincronización bidireccional de gastos
 * - Cache offline inteligente
 * - Backup automático en tiempo real
 * - Detección de conflictos y resolución
 * - Migración desde localStorage
 * 
 * @author David Ferrer Figueroa
 * @version 2.1.0
 * @since 2024
 */

import Logger from './Logger.js';
import { firebaseConfig, firestoreConfig, isConfigured } from '../config/firebaseConfig.js';

export class FirebaseManager {
    /**
     * Constructor del FirebaseManager
     * 
     * Inicializa la conexión con Firebase y configura
     * los listeners para sincronización automática.
     * 
     * @constructor
     */
    constructor() {
        // 🚨 PREVENIR MÚLTIPLES INSTANCIAS DE FIREBASE
        if (window.firebaseManagerInstance) {
            Logger.warning('FirebaseManager ya existe, retornando instancia existente');
            return window.firebaseManagerInstance;
        }
        
        this.db = null;
        this.isConnected = false;
        this.isOffline = false;
        this.syncQueue = [];
        this.listeners = new Map();
        
        // Callbacks para eventos
        this.onExpenseAdded = null;
        this.onExpenseUpdated = null;
        this.onExpenseDeleted = null;
        this.onSyncStatusChanged = null;
        
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        Logger.init('FirebaseManager initialized');
        
        // 🚨 ASIGNAR COMO INSTANCIA SINGLETON
        window.firebaseManagerInstance = this;
        
        // Verificar configuración de Firebase
        try {
            Logger.data('Firebase config check:', { 
                apiKey: firebaseConfig?.apiKey || 'undefined',
                isConfigured: isConfigured() 
            });
            
            // Inicializar Firebase si está configurado
            if (isConfigured()) {
                this.initializeFirebase();
            } else {
                Logger.warning('Firebase not configured. Using localStorage only.');
                this.showConfigurationInstructions();
            }
        } catch (error) {
            Logger.error('Error checking Firebase configuration:', error);
            Logger.warning('Firebase not configured. Using localStorage only.');
            this.showConfigurationInstructions();
        }
    }

    /**
     * Inicializa Firebase y Firestore
     * 
     * @private
     */
    async initializeFirebase() {
        try {
            // Importar Firebase dinámicamente
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, initializeFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // ✅ CONFIGURACIÓN SOLO FIRESTORE - Sin Realtime Database
            const configOnlyFirestore = {
                ...firebaseConfig,
                // Remover databaseURL para evitar warnings de Realtime Database
                databaseURL: undefined
            };
            
            // Limpiar configuración de propiedades undefined
            Object.keys(configOnlyFirestore).forEach(key => {
                if (configOnlyFirestore[key] === undefined) {
                    delete configOnlyFirestore[key];
                }
            });

            // Inicializar app SIN Realtime Database
            const app = initializeApp(configOnlyFirestore);
            
            // ✅ NUEVA API: Configurar Firestore con cache settings
            try {
                this.db = initializeFirestore(app, {
                    cache: {
                        // Usar cache persistente con configuración mejorada
                        kind: 'persistent',
                        sizeBytes: firestoreConfig.settings.cacheSizeBytes,
                        // Permitir múltiples tabs con sincronización
                        synchronizeTabs: true
                    }
                });
                Logger.data('Firestore initialized with new cache API');
            } catch (error) {
                // Fallback a getFirestore si initializeFirestore falla
                Logger.warning('Failed to initialize with cache settings, using default Firestore');
                this.db = getFirestore(app);
            }
            
            // Configurar cache offline (ahora simplificado)
            await this.configureOfflineSupport();
            
            // Configurar listeners de conexión
            this.setupConnectionListeners();
            
            // Migrar datos locales si existen
            await this.migrateLocalData();
            
            this.isConnected = true;
            Logger.success('Firebase initialized successfully');
            
            // Notificar cambio de estado
            if (this.onSyncStatusChanged) {
                this.onSyncStatusChanged('connected');
            }
            
        } catch (error) {
            Logger.error('Error initializing Firebase:', error);
            this.handleFirebaseError(error);
        }
    }

    /**
     * Configura soporte offline de Firestore
     * 
     * @private
     */
    async configureOfflineSupport() {
        try {
            // ✅ NUEVA API: Usar FirestoreSettings.cache en lugar de enableIndexedDbPersistence
            const { connectFirestoreEmulator, enableNetwork } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // La persistencia se configura ahora en initializeFirestore con cache settings
            // No necesitamos enableIndexedDbPersistence que está deprecado
            
            // Asegurar que la red esté habilitada
            await enableNetwork(this.db);
            
            Logger.data('Offline persistence configured with new cache API');
            
        } catch (error) {
            if (error.code === 'failed-precondition') {
                Logger.warning('Multiple tabs detected, using memory cache for this tab');
            } else if (error.code === 'unimplemented') {
                Logger.warning('Browser does not support offline persistence, using memory cache');
            } else {
                Logger.error('Error configuring offline support:', error);
            }
        }
    }

    /**
     * Configura listeners de estado de conexión
     * 
     * @private
     */
    setupConnectionListeners() {
        // Detectar estado online/offline
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Estado inicial
        this.isOffline = !navigator.onLine;
    }

    /**
     * Maneja evento de conexión online
     * 
     * @private
     */
    async handleOnline() {
        this.isOffline = false;
        Logger.data('Device back online, enabling Firestore network');
        
        try {
            const { enableNetwork } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await enableNetwork(this.db);
            
            // Procesar cola de sincronización
            await this.processSyncQueue();
            
            if (this.onSyncStatusChanged) {
                this.onSyncStatusChanged('online');
            }
            
        } catch (error) {
            Logger.error('Error enabling network:', error);
        }
    }

    /**
     * Maneja evento de conexión offline
     * 
     * @private
     */
    async handleOffline() {
        this.isOffline = true;
        Logger.data('Device offline, disabling Firestore network');
        
        try {
            const { disableNetwork } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await disableNetwork(this.db);
            
            if (this.onSyncStatusChanged) {
                this.onSyncStatusChanged('offline');
            }
            
        } catch (error) {
            Logger.error('Error disabling network:', error);
        }
    }

    /**
     * Migra datos existentes de localStorage a Firebase
     * 
     * @private
     */
    async migrateLocalData() {
        try {
            const localExpenses = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]');
            
            if (localExpenses.length > 0) {
                Logger.debug('🔥 Checking if migration is needed...');
                
                // Verificar si ya hay datos en Firebase para evitar duplicación
                const existingExpenses = await this.getAllExpenses();
                
                if (existingExpenses.length === 0) {
                    Logger.debug('🔥 No existing Firebase data, proceeding with migration...');
                    Logger.data(`Migrating ${localExpenses.length} expenses from localStorage to Firebase`);
                    
                    for (const expense of localExpenses) {
                        await this.addExpense(expense, false); // No trigger callbacks durante migración
                    }
                    
                    // Crear backup de datos locales
                    localStorage.setItem('tripExpensesV1_backup', JSON.stringify(localExpenses));
                    
                    Logger.success(`Successfully migrated ${localExpenses.length} expenses to Firebase`);
                } else {
                    Logger.debug('🔥 Firebase already has data, skipping migration to avoid duplicates');
                    Logger.data(`Skipping migration - Firebase already has ${existingExpenses.length} expenses`);
                }
            }
            
        } catch (error) {
            Logger.error('Error migrating local data:', error);
        }
    }

    /**
     * Añade un nuevo gasto a Firebase
     * 
     * @param {Object} expense - Datos del gasto
     * @param {boolean} triggerCallbacks - Si debe disparar callbacks
     * @returns {Promise<string>} ID del documento creado
     */
    async addExpense(expense, triggerCallbacks = true) {
        if (!this.isMobile) {
            Logger.debug('🔥 addExpense called', { expense, isConnected: this.isConnected });
        }
        
        if (!this.isConnected) {
            if (!this.isMobile) {
                Logger.debug('🔥 Not connected, using localStorage');
            }
            return this.addExpenseLocal(expense);
        }

        try {
            if (!this.isMobile) {
                Logger.debug('🔥 Importing Firestore modules...');
            }
            const { collection, addDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const expenseData = {
                ...expense,
                id: expense.id || this.generateId(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                deviceId: this.getDeviceId()
            };

            if (!this.isMobile) {
                Logger.debug('🔥 Expense data prepared:', expenseData);
                Logger.debug('🔥 Database reference:', this.db);
                Logger.debug('🔥 Collection name:', firestoreConfig.collections.expenses);
            }

            const docRef = await addDoc(collection(this.db, firestoreConfig.collections.expenses), expenseData);
            
            if (!this.isMobile) {
                Logger.success('🔥 Document added successfully:', docRef.id);
            }
            Logger.data('Expense added to Firebase:', docRef.id);
            
            // Actualizar localStorage como backup
            this.updateLocalStorage();
            
            if (triggerCallbacks && this.onExpenseAdded) {
                this.onExpenseAdded(expenseData);
            }
            
            return docRef.id;
            
        } catch (error) {
            Logger.error('🔥 Error adding expense to Firebase:', error);
            Logger.error('🔥 Error details:', error.message, error.code);
            Logger.error('Error adding expense to Firebase:', error);
            
            // Fallback a localStorage
            return this.addExpenseLocal(expense);
        }
    }

    /**
     * Actualiza un gasto existente en Firebase
     * 
     * @param {string} expenseId - ID del gasto
     * @param {Object} updates - Campos a actualizar
     * @returns {Promise<boolean>} True si se actualizó correctamente
     */
    async updateExpense(expenseId, updates) {
        if (!this.isConnected) {
            return this.updateExpenseLocal(expenseId, updates);
        }

        try {
            const { doc, setDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const docRef = doc(this.db, firestoreConfig.collections.expenses, expenseId);
            
            // 🚀 UPSERT SIMPLE: setDoc con merge:true
            // Si existe → actualiza solo los campos proporcionados
            // Si no existe → crea el documento completo
            
            // Obtener datos completos del localStorage por si necesitamos crear
            const localExpenses = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]');
            const localExpense = localExpenses.find(exp => exp.id === expenseId);
            
            if (!localExpense) {
                throw new Error(`Expense ${expenseId} not found in localStorage`);
            }
            
            // 🚨 PROBLEMA: Necesitamos verificar si YA EXISTE un documento con este ID
            // Firebase permite múltiples docs con mismo campo 'id' pero diferente docId
            
            // 1️⃣ Buscar si ya existe un documento con este ID en el campo 'id'
            const { collection, query, where, getDocs, updateDoc } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const existingQuery = query(
                collection(this.db, firestoreConfig.collections.expenses),
                where('id', '==', expenseId)
            );
            
            const existingSnapshot = await getDocs(existingQuery);
            
            if (!existingSnapshot.empty) {
                // 🔄 YA EXISTE → Actualizar el documento existente
                const existingDoc = existingSnapshot.docs[0];
                Logger.debug('🔄 Documento existente encontrado, actualizando:', existingDoc.id);
                
                const updateData = {
                    ...updates,
                    updatedAt: serverTimestamp(),
                    deviceId: this.getDeviceId()
                };

                await updateDoc(existingDoc.ref, updateData);
                Logger.success('✅ Documento existente actualizado:', existingDoc.id);
                
            } else {
                // 🆕 NO EXISTE → Crear nuevo con el ID como docId
                Logger.debug('🆕 Creando nuevo documento con ID:', expenseId);
                
                const upsertData = {
                    // Datos base del gasto (para crear si no existe)
                    ...localExpense,
                    // Actualizaciones solicitadas
                    ...updates,
                    // Metadatos
                    id: expenseId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    deviceId: this.getDeviceId()
                };

                await setDoc(docRef, upsertData);
                Logger.success('✅ Nuevo documento creado:', expenseId);
            }
            Logger.success('✅ UPSERT completado en Firebase:', expenseId);
            
            Logger.data('Expense updated in Firebase:', expenseId);
            
            // Actualizar localStorage como backup
            this.updateLocalStorage();
            
            if (this.onExpenseUpdated) {
                this.onExpenseUpdated(expenseId, updates);
            }
            
            return true;
            
        } catch (error) {
            Logger.error('Error updating expense in Firebase:', error);
            
            // Fallback a localStorage
            return this.updateExpenseLocal(expenseId, updates);
        }
    }

    /**
     * Elimina un gasto de Firebase
     * 
     * @param {string} expenseId - ID del gasto a eliminar
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    async deleteExpense(expenseId) {
        Logger.debug(`🔥 Firebase deleteExpense called for ID: ${expenseId}`);
        
        if (!this.isConnected) {
            Logger.warning('Not connected to Firebase, using local delete');
            return this.deleteExpenseLocal(expenseId);
        }

        try {
            const { doc, deleteDoc, getDoc, collection, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            Logger.debug(`🔍 DELETE: Collection name: "${firestoreConfig.collections.expenses}"`);
            Logger.debug(`🔍 DELETE: ExpenseId: "${expenseId}"`);
            Logger.debug(`🔍 DELETE: Database:`, this.db);
            
            // CRITICAL TEST: Verificar si existe usando string literal
            Logger.debug(`🧪 DELETE TEST: Using literal 'expenses' collection`);
            const testDocRef = doc(this.db, 'expenses', expenseId);
            const testDocSnap = await getDoc(testDocRef);
            Logger.debug(`🧪 DELETE TEST RESULT: Document exists with literal = ${testDocSnap.exists()}`);
            
            if (testDocSnap.exists()) {
                Logger.debug(`🧪 DOCUMENT DATA:`, testDocSnap.data());
            }
            
            // ADDITIONAL TEST: Buscar documento en toda la colección
            const testCollectionRef = collection(this.db, 'expenses');
            const testCollectionSnap = await getDocs(testCollectionRef);
            Logger.debug(`🧪 DELETE COLLECTION TEST: Found ${testCollectionSnap.size} total documents`);
            
            // CRITICAL: Buscar el documento específico en toda la colección
            let foundDocument = false;
            let allDocumentIds = [];
            let documentsWithIdField = [];
            
            Logger.debug(`🔍 SCANNING ALL ${testCollectionSnap.size} DOCUMENTS:`);
            
            testCollectionSnap.forEach((doc) => {
                const docId = doc.id;
                const docData = doc.data();
                const docIdField = docData.id;
                
                allDocumentIds.push(docId);
                if (docIdField) {
                    documentsWithIdField.push({firebaseId: docId, idField: docIdField});
                }
                
                Logger.debug(`📄 Doc: firebaseId="${docId}", data.id="${docIdField || 'NONE'}", concept="${docData.concept || 'NONE'}"`);
                
                // Buscar tanto por Firebase ID como por campo ID
                if (docId === expenseId || docIdField === expenseId) {
                    foundDocument = true;
                    Logger.success(`🎯 FOUND TARGET! firebaseId="${docId}", data.id="${docIdField}", target="${expenseId}"`);
                    Logger.debug(`🎯 DOCUMENT DATA:`, docData);
                }
            });
            
            Logger.debug(`🔍 ALL FIREBASE IDs: ${allDocumentIds.join(', ')}`);
            Logger.debug(`🔍 ALL ID FIELDS: ${documentsWithIdField.map(d => `${d.firebaseId}→${d.idField}`).join(', ')}`);
            Logger.debug(`🔍 TARGET: "${expenseId}"`);
            
            if (!foundDocument) {
                Logger.error(`🚨 CRITICAL: Target "${expenseId}" NOT FOUND in any document (firebase ID or id field)`);
                return false;
            } else {
                Logger.success(`✅ Document found in collection! Using correct Firebase Document ID.`);
                
                // Buscar el Firebase Document ID correcto
                let correctFirebaseId = null;
                testCollectionSnap.forEach((doc) => {
                    if (doc.data().id === expenseId) {
                        correctFirebaseId = doc.id;
                    }
                });
                
                if (!correctFirebaseId) {
                    Logger.error(`🚨 Could not find Firebase Document ID for data.id: ${expenseId}`);
                    return false;
                }
                
                Logger.success(`🎯 USING CORRECT ID: Firebase Document ID="${correctFirebaseId}" for data.id="${expenseId}"`);
                
                // Usar el Firebase Document ID correcto
                const docRef = doc(this.db, firestoreConfig.collections.expenses, correctFirebaseId);
                Logger.debug(`🔍 DELETE: DocRef created with CORRECT Firebase ID: ${correctFirebaseId}`);
                
                const docSnap = await getDoc(docRef);
                Logger.debug(`🔍 DELETE: getDoc executed with correct ID, exists = ${docSnap.exists()}`);
                
                if (!docSnap.exists()) {
                    Logger.error(`🚨 Even with correct Firebase ID, document not found: ${correctFirebaseId}`);
                    return false;
                }
                
                Logger.debug(`✅ Document ${expenseId} exists, proceeding with delete using Firebase ID: ${correctFirebaseId}`);
            
            // Eliminar el documento usando el ID correcto
            await deleteDoc(docRef);
            
            Logger.data('Expense deleted from Firebase:', expenseId);
            
            // Verificar que efectivamente se eliminó
            const verifySnap = await getDoc(docRef);
            if (verifySnap.exists()) {
                Logger.error(`🚨 DELETE FAILED: Document ${expenseId} still exists after delete operation`);
                return false;
            }
            
            Logger.success(`✅ DELETE VERIFIED: Document ${expenseId} successfully removed from Firebase`);
            
            // Actualizar localStorage como backup
            this.updateLocalStorage();
            
            if (this.onExpenseDeleted) {
                Logger.debug(`🔔 Calling onExpenseDeleted callback for: ${expenseId}`);
                this.onExpenseDeleted(expenseId);
                Logger.debug(`🔔 onExpenseDeleted callback completed`);
            } else {
                Logger.debug(`🔔 No onExpenseDeleted callback registered`);
            }
            
            return true;
            }
            
        } catch (error) {
            Logger.error('Error deleting expense from Firebase:', error);
            
            // Fallback a localStorage
            return this.deleteExpenseLocal(expenseId);
        }
    }

    /**
     * Obtiene todos los gastos de Firebase
     * 
     * @returns {Promise<Array>} Array de gastos
     */
    async getAllExpenses() {
        if (!this.isConnected) {
            return this.getAllExpensesLocal();
        }

        try {
            const { collection, getDocs, orderBy, query } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            Logger.debug(`🔍 Querying Firebase collection: ${firestoreConfig.collections.expenses}`);
            Logger.debug(`🔍 Collection name resolved to: "${firestoreConfig.collections.expenses}"`);
            Logger.debug(`🔍 Database instance:`, this.db);
            Logger.debug(`🔍 Database type:`, typeof this.db);
            
            // CRITICAL TEST: usar string literal directamente
            Logger.debug(`🧪 TESTING: Using literal 'expenses' collection name`);
            let testCollectionRef = collection(this.db, 'expenses');
            let testSnapshot = await getDocs(testCollectionRef);
            Logger.debug(`🧪 TEST RESULT: Found ${testSnapshot.size} documents with literal 'expenses'`);
            
            // Primero intentar consulta simple sin orderBy
            let collectionRef = collection(this.db, firestoreConfig.collections.expenses);
            Logger.debug(`🔍 Collection reference created`);
            
            let querySnapshot = await getDocs(collectionRef);
            Logger.debug(`🔍 Query executed. Size: ${querySnapshot.size} documents`);
            
            const expenses = [];
            
            querySnapshot.forEach((doc) => {
                Logger.debug(`📄 Document found: ${doc.id}`, doc.data());
                expenses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Si hay documentos, intentar ordenar por createdAt (timestamp real de Firebase)
            if (expenses.length > 0) {
                try {
                    const q = query(collectionRef, orderBy('createdAt', 'desc'));
                    const orderedSnapshot = await getDocs(q);
                    expenses.length = 0; // Clear array
                    orderedSnapshot.forEach((doc) => {
                        expenses.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    Logger.debug(`✅ Successfully ordered ${expenses.length} expenses by createdAt`);
                } catch (orderError) {
                    Logger.warning(`⚠️ OrderBy failed, using unordered results: ${orderError.message}`);
                }
            }
            
            Logger.data(`Retrieved ${expenses.length} expenses from Firebase`);
            Logger.debug(`🔍 Expense IDs retrieved: ${expenses.map(e => e.id).join(', ')}`);
            
            // Actualizar localStorage como backup
            localStorage.setItem('tripExpensesV1', JSON.stringify(expenses));
            
            return expenses;
            
        } catch (error) {
            Logger.error('Error getting expenses from Firebase:', error);
            
            // Fallback a localStorage
            return this.getAllExpensesLocal();
        }
    }

    /**
     * Configura listener en tiempo real para gastos
     * 
     * @param {Function} callback - Función a llamar cuando cambien los datos
     * @returns {Function} Función para desuscribirse
     */
    async setupRealtimeListener(callback) {
        const listenerId = 'expenses-listener';
        
        if (!this.isMobile) {
            Logger.debug('🔥 setupRealtimeListener called', { 
                isConnected: this.isConnected,
                existingListeners: this.listeners.size 
            });
        }
        
        // 🚨 PREVENIR LISTENERS DUPLICADOS
        if (this.listeners.has(listenerId)) {
            if (!this.isMobile) {
                Logger.debug('🔥 Listener ya existe, desuscribiendo el anterior...');
            }
            const existingUnsubscribe = this.listeners.get(listenerId);
            existingUnsubscribe();
            this.listeners.delete(listenerId);
        }
        
        if (!this.isConnected) {
            Logger.warning('Firebase not connected, realtime listener not available');
            return () => {};
        }

        try {
            if (!this.isMobile) {
                Logger.debug('🔥 Importing Firestore modules for listener...');
            }
            const { collection, onSnapshot, orderBy, query } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            if (!this.isMobile) {
                Logger.debug('🔥 Creating Firestore query...');
            }
            const q = query(
                collection(this.db, firestoreConfig.collections.expenses),
                orderBy('createdAt', 'desc')
            );
            
            if (!this.isMobile) {
                Logger.debug('🔥 Setting up onSnapshot listener...');
            }
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const expenses = [];
                
                querySnapshot.forEach((doc) => {
                    expenses.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                if (!this.isMobile) {
                    Logger.debug('🔥 Realtime update received:', expenses.length, 'expenses');
                }
                Logger.data(`Realtime update: ${expenses.length} expenses`);
                
                // Actualizar localStorage como backup
                localStorage.setItem('tripExpensesV1', JSON.stringify(expenses));
                
                callback(expenses);
            }, (error) => {
                Logger.error('🔥 Realtime listener error:', error);
                Logger.error('Realtime listener error:', error);
            });
            
            // 🚨 REGISTRAR LISTENER PARA EVITAR DUPLICADOS
            this.listeners.set(listenerId, unsubscribe);
            
            if (!this.isMobile) {
                Logger.success('🔥 Realtime listener configured successfully');
            }
            
            // Retornar función que desuscribe Y elimina del registro
            return () => {
                unsubscribe();
                this.listeners.delete(listenerId);
            };
            
        } catch (error) {
            Logger.error('🔥 Error setting up realtime listener:', error);
            Logger.error('Error setting up realtime listener:', error);
            return () => {};
        }
    }

    // ============================================================================
    // MÉTODOS FALLBACK PARA LOCALSTORAGE
    // ============================================================================

    /**
     * Añade gasto a localStorage (fallback)
     * 
     * @private
     */
    addExpenseLocal(expense) {
        const expenses = this.getAllExpensesLocal();
        const newExpense = {
            ...expense,
            id: expense.id || this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expenses.unshift(newExpense);
        localStorage.setItem('tripExpensesV1', JSON.stringify(expenses));
        
        // Añadir a cola de sincronización
        this.addToSyncQueue('add', newExpense);
        
        Logger.data('Expense added to localStorage (will sync when online)');
        return newExpense.id;
    }

    /**
     * Actualiza gasto en localStorage (fallback)
     * 
     * @private
     */
    updateExpenseLocal(expenseId, updates) {
        const expenses = this.getAllExpensesLocal();
        const index = expenses.findIndex(exp => exp.id === expenseId);
        
        if (index !== -1) {
            expenses[index] = {
                ...expenses[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('tripExpensesV1', JSON.stringify(expenses));
            
            // Añadir a cola de sincronización
            this.addToSyncQueue('update', { id: expenseId, ...updates });
            
            Logger.data('Expense updated in localStorage (will sync when online)');
            return true;
        }
        
        return false;
    }

    /**
     * Elimina gasto de localStorage (fallback)
     * 
     * @private
     */
    deleteExpenseLocal(expenseId) {
        const expenses = this.getAllExpensesLocal();
        const filteredExpenses = expenses.filter(exp => exp.id !== expenseId);
        
        if (filteredExpenses.length !== expenses.length) {
            localStorage.setItem('tripExpensesV1', JSON.stringify(filteredExpenses));
            
            // Añadir a cola de sincronización
            this.addToSyncQueue('delete', { id: expenseId });
            
            Logger.data('Expense deleted from localStorage (will sync when online)');
            return true;
        }
        
        return false;
    }

    /**
     * Obtiene gastos de localStorage (fallback)
     * 
     * @private
     */
    getAllExpensesLocal() {
        return JSON.parse(localStorage.getItem('tripExpensesV1') || '[]');
    }

    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================

    /**
     * Añade operación a la cola de sincronización
     * 
     * @private
     */
    addToSyncQueue(operation, data) {
        this.syncQueue.push({
            operation,
            data,
            timestamp: Date.now()
        });
        
        // Guardar cola en localStorage
        localStorage.setItem('firebaseSyncQueue', JSON.stringify(this.syncQueue));
    }

    /**
     * Procesa la cola de sincronización cuando hay conexión
     * 
     * @private
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;
        
        Logger.data(`Processing ${this.syncQueue.length} pending operations`);
        
        const processedOperations = [];
        
        for (const operation of this.syncQueue) {
            try {
                switch (operation.operation) {
                    case 'add':
                        await this.addExpense(operation.data, false);
                        break;
                    case 'update':
                        await this.updateExpense(operation.data.id, operation.data);
                        break;
                    case 'delete':
                        await this.deleteExpense(operation.data.id);
                        break;
                }
                
                processedOperations.push(operation);
                
            } catch (error) {
                Logger.error('Error processing sync operation:', error);
            }
        }
        
        // Remover operaciones procesadas
        this.syncQueue = this.syncQueue.filter(op => !processedOperations.includes(op));
        localStorage.setItem('firebaseSyncQueue', JSON.stringify(this.syncQueue));
        
        Logger.success(`Processed ${processedOperations.length} sync operations`);
    }

    /**
     * Actualiza localStorage desde Firebase
     * 
     * @private
     */
    async updateLocalStorage() {
        try {
            const expenses = await this.getAllExpenses();
            localStorage.setItem('tripExpensesV1', JSON.stringify(expenses));
        } catch (error) {
            Logger.error('Error updating localStorage:', error);
        }
    }

    /**
     * Genera ID único para gastos
     * 
     * @private
     */
    generateId() {
        return 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtiene ID único del dispositivo
     * 
     * @private
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * Maneja errores de Firebase
     * 
     * @private
     */
    handleFirebaseError(error) {
        Logger.error('Firebase error:', error);
        
        // Mostrar notificación al usuario
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Error de Conexión', {
                    body: 'No se pudo conectar a la nube. Los datos se guardan localmente.',
                    icon: '/assets/icon-192x192.png',
                    tag: 'firebase-error'
                });
            });
        }
    }

    /**
     * Muestra instrucciones de configuración
     * 
     * @private
     */
    showConfigurationInstructions() {
        Logger.warning(`
🔥 FIREBASE NO CONFIGURADO

Para habilitar almacenamiento en la nube:

1. Ve a: https://console.firebase.google.com/
2. Crea proyecto: "viaje-himalaya"
3. Habilita Firestore Database
4. Copia configuración a js/config/firebaseConfig.js

Mientras tanto, los datos se guardan solo localmente.
        `);
    }

    /**
     * Obtiene estadísticas de sincronización
     * 
     * @returns {Object} Estadísticas del sistema
     */
    getStats() {
        return {
            isConnected: this.isConnected,
            isOffline: this.isOffline,
            pendingSyncOperations: this.syncQueue.length,
            localExpenses: this.getAllExpensesLocal().length,
            deviceId: this.getDeviceId()
        };
    }

    /**
     * Limpieza de recursos
     */
    destroy() {
        // Limpiar listeners
        this.listeners.forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.listeners.clear();
        
        Logger.data('FirebaseManager destroyed');
    }
}
