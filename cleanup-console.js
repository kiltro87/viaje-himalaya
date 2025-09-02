// 🧹 SCRIPT DE LIMPIEZA COMPLETA V2
// Elimina claves duplicadas y obsoletas de localStorage y Firestore

console.log('🧹 Iniciando limpieza completa V2...');

// PASO 1: Limpiar gastos fantasma de Firebase
async function cleanFirebaseExpenses() {
    console.log('🔥 PASO 1: Limpiando gastos fantasma de Firebase...');
    
    try {
        // Acceder al BudgetManager desde el StateManager global
        const stateManager = window.stateManager;
        if (!stateManager) {
            console.error('❌ StateManager no encontrado');
            return false;
        }

        const budgetManager = stateManager.get('budgetManager');
        if (!budgetManager) {
            console.error('❌ BudgetManager no encontrado');
            return false;
        }

        const firebaseManager = budgetManager.firebaseManager;
        if (!firebaseManager) {
            console.error('❌ FirebaseManager no encontrado');
            return false;
        }

        // Obtener todos los gastos de Firebase
        const expenses = await firebaseManager.getAllExpenses();
        console.log(`📊 Gastos encontrados en Firebase: ${expenses.length}`);
        
        if (expenses.length === 0) {
            console.log('✅ No hay gastos en Firebase para limpiar');
            return true;
        }

        // Confirmar antes de eliminar
        const confirmDelete = confirm(`⚠️ Se encontraron ${expenses.length} gastos en Firebase.\n¿Deseas eliminarlos todos? Esta acción no se puede deshacer.`);
        
        if (!confirmDelete) {
            console.log('❌ Limpieza de Firebase cancelada por el usuario');
            return false;
        }

        // Eliminar todos los gastos
        let deletedCount = 0;
        for (const expense of expenses) {
            try {
                await firebaseManager.deleteExpense(expense.id);
                deletedCount++;
                console.log(`🗑️ Eliminado gasto: ${expense.id}`);
            } catch (error) {
                console.error(`❌ Error eliminando gasto ${expense.id}:`, error);
            }
        }

        console.log(`✅ Firebase limpio: ${deletedCount}/${expenses.length} gastos eliminados`);
        return true;

    } catch (error) {
        console.error('❌ Error en limpieza de Firebase:', error);
        return false;
    }
}

// PASO 2: Limpiar claves duplicadas de localStorage
function cleanLocalStorageKeys() {
    console.log('💾 PASO 2: Limpiando claves duplicadas de localStorage...');
    
    // Claves obsoletas que deben eliminarse completamente
    const obsoleteKeys = [
        'calzado_botas_trekking',      // Duplicado de calzado_botas_de_trekking
        'ropa_camisetas_manga_larga',  // Formato incorrecto
        'calzado_sandalias_hotel'      // Formato incorrecto
    ];

    let cleanedCount = 0;

    // Obtener todas las claves de packing list actuales
    const allKeys = Object.keys(localStorage).filter(key => 
        key.includes('calzado_') || 
        key.includes('ropa_') || 
        key.includes('equipo_') || 
        key.includes('documentos_')
    );

    console.log(`🔍 Claves de packing list encontradas: ${allKeys.length}`);
    console.log('📋 Claves actuales:', allKeys);

    // Eliminar claves obsoletas
    for (const obsoleteKey of obsoleteKeys) {
        if (localStorage.getItem(obsoleteKey) !== null) {
            const value = localStorage.getItem(obsoleteKey);
            console.log(`🗑️ Eliminando clave obsoleta: ${obsoleteKey} = ${value}`);
            localStorage.removeItem(obsoleteKey);
            cleanedCount++;
        }
    }

    // Mostrar estado final
    const finalKeys = Object.keys(localStorage).filter(key => 
        key.includes('calzado_') || 
        key.includes('ropa_') || 
        key.includes('equipo_') || 
        key.includes('documentos_')
    );

    console.log(`✅ Limpieza localStorage completada:`);
    console.log(`   - Claves obsoletas eliminadas: ${cleanedCount}`);
    console.log(`   - Claves finales: ${finalKeys.length}`);
    console.log('📋 Claves finales:', finalKeys);

    return { cleanedCount, finalKeys };
}

// PASO 3: Limpiar claves duplicadas de Firestore
async function cleanFirestorePackingKeys() {
    console.log('🔥 PASO 3: Limpiando claves duplicadas de Firestore...');
    
    try {
        const stateManager = window.stateManager;
        if (!stateManager) {
            console.error('❌ StateManager no encontrado');
            return false;
        }

        const packingListManager = stateManager.get('packingListManager');
        if (!packingListManager) {
            console.error('❌ PackingListManager no encontrado');
            return false;
        }

        // Obtener datos actuales de Firestore
        const currentData = await packingListManager.loadFromFirebase();
        console.log('📊 Datos actuales en Firestore:', currentData);

        if (!currentData || !currentData.items) {
            console.log('✅ No hay datos de packing list en Firestore');
            return true;
        }

        // Claves obsoletas que deben eliminarse de Firestore
        const obsoleteKeys = [
            'calzado_botas_trekking',
            'ropa_camisetas_manga_larga', 
            'calzado_sandalias_hotel'
        ];

        let cleanedData = { ...currentData };
        let removedCount = 0;

        // Eliminar claves obsoletas
        for (const obsoleteKey of obsoleteKeys) {
            if (cleanedData.items && cleanedData.items[obsoleteKey] !== undefined) {
                console.log(`🗑️ Eliminando de Firestore: ${obsoleteKey} = ${cleanedData.items[obsoleteKey]}`);
                delete cleanedData.items[obsoleteKey];
                removedCount++;
            }
        }

        if (removedCount > 0) {
            // Actualizar Firestore con datos limpios
            await packingListManager.saveToFirebase(cleanedData);
            console.log(`✅ Firestore actualizado: ${removedCount} claves obsoletas eliminadas`);
        } else {
            console.log('✅ No se encontraron claves obsoletas en Firestore');
        }

        return true;

    } catch (error) {
        console.error('❌ Error limpiando Firestore:', error);
        return false;
    }
}

// EJECUTAR LIMPIEZA AUTOMÁTICA V2
async function runCompleteCleanupV2() {
    console.log('🚀 Ejecutando limpieza completa V2...');
    
    // Paso 1: Limpiar Firebase expenses (opcional)
    console.log('⚠️ Saltando limpieza de gastos (ya realizada anteriormente)');
    const firebaseSuccess = true;
    
    // Paso 2: Limpiar localStorage
    const localStorageResult = cleanLocalStorageKeys();
    
    // Paso 3: Limpiar Firestore packing list
    const firestoreSuccess = await cleanFirestorePackingKeys();
    
    // Resumen final
    console.log('\n📊 RESUMEN DE LIMPIEZA V2:');
    console.log(`🔥 Firebase expenses: ✅ Saltado (ya limpio)`);
    console.log(`💾 localStorage: ✅ ${localStorageResult.cleanedCount} claves obsoletas eliminadas`);
    console.log(`🔥 Firestore packing: ${firestoreSuccess ? '✅ Limpio' : '❌ Error'}`);
    console.log('\n🎯 SIGUIENTE PASO: Recarga la página para ver los cambios');
    
    return { firebaseSuccess, localStorageResult, firestoreSuccess };
}

// Ejecutar automáticamente
runCompleteCleanupV2();
