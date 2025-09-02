/**
 * Script para limpiar y unificar las claves de localStorage
 * Ejecutar en la consola del navegador
 */

function fixPackingListKeys() {
    console.log('🔧 Iniciando limpieza de claves localStorage...');
    
    // Obtener datos actuales
    const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
    console.log('📊 Claves encontradas:', Object.keys(saved).length);
    
    // Crear mapeo limpio basado en tripConfig
    const cleanData = {};
    
    // Datos de prueba limpios que coinciden con tripConfig
    const testItems = [
        'ropa_camisetas_manga_larga',
        'calzado_botas_trekking', 
        'calzado_zapatillas_deportivas',
        'calzado_sandalias_hotel',
        'equipo_mochila_pequena',
        'equipo_power_bank',
        'documentos_pasaporte'
    ];
    
    // Marcar items de prueba
    testItems.forEach(key => {
        cleanData[key] = true;
    });
    
    console.log('✅ Datos limpios creados:', cleanData);
    
    // Guardar datos limpios
    localStorage.setItem('packingListV2', JSON.stringify(cleanData));
    
    console.log('🎯 localStorage limpiado y unificado');
    console.log('🔄 Recarga la página para ver los cambios');
    
    return cleanData;
}

// 🧹 SCRIPT COMPLETO: Limpiar localStorage Y Firestore
// Ejecutar en la consola de localhost:8000

async function cleanDuplicateKeysComplete() {
    console.log('🧹 Iniciando limpieza completa de claves duplicadas...');
    
    // Claves duplicadas a eliminar
    const duplicateKeys = [
        'calzado_botas_trekking',
        'ropa_camisetas_manga_larga', 
        'calzado_sandalias_hotel'
    ];

    let localRemovedCount = 0;
    let firestoreRemovedCount = 0;

    // PASO 1: Limpiar localStorage
    console.log('💾 PASO 1: Limpiando localStorage...');
    duplicateKeys.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            const value = localStorage.getItem(key);
            localStorage.removeItem(key);
            console.log(`🗑️ localStorage eliminado: ${key} = ${value}`);
            localRemovedCount++;
        } else {
            console.log(`ℹ️ localStorage no encontrado: ${key}`);
        }
    });

    // PASO 2: Limpiar Firestore
    console.log('🔥 PASO 2: Limpiando Firestore...');
    try {
        // Acceder al PackingListManager
        const packingListManager = window.stateManager?.get('packingListManager');
        
        if (!packingListManager) {
            console.error('❌ PackingListManager no encontrado');
            console.log('⚠️ Solo se limpió localStorage. Firestore requiere acceso al manager.');
            return;
        }

        // Obtener datos actuales de Firestore
        const currentData = await packingListManager.loadFromFirebase();
        console.log('📊 Datos actuales de Firestore:', currentData);

        if (currentData && currentData.items) {
            let cleanedData = { ...currentData };
            
            duplicateKeys.forEach(key => {
                if (cleanedData.items[key] !== undefined) {
                    const value = cleanedData.items[key];
                    delete cleanedData.items[key];
                    console.log(`🗑️ Firestore eliminado: ${key} = ${value}`);
                    firestoreRemovedCount++;
                } else {
                    console.log(`ℹ️ Firestore no encontrado: ${key}`);
                }
            });

            if (firestoreRemovedCount > 0) {
                await packingListManager.saveToFirebase(cleanedData);
                console.log(`✅ Firestore actualizado: ${firestoreRemovedCount} claves eliminadas`);
            } else {
                console.log('ℹ️ No había claves duplicadas en Firestore');
            }
        } else {
            console.log('ℹ️ No hay datos de packing list en Firestore');
        }

    } catch (error) {
        console.error('❌ Error limpiando Firestore:', error);
        console.log('⚠️ localStorage limpiado, pero Firestore falló');
    }

    // PASO 3: Mostrar resultado final
    console.log('\n📊 RESUMEN DE LIMPIEZA:');
    console.log(`💾 localStorage: ${localRemovedCount} claves eliminadas`);
    console.log(`🔥 Firestore: ${firestoreRemovedCount} claves eliminadas`);

    // Mostrar claves restantes
    const remainingKeys = Object.keys(localStorage).filter(key => 
        key.includes('calzado_') || 
        key.includes('ropa_') || 
        key.includes('equipo_') || 
        key.includes('documentos_')
    );

    console.log(`\n📋 Claves finales en localStorage: ${remainingKeys.length}`);
    remainingKeys.forEach(key => {
        console.log(`   ✅ ${key} = ${localStorage.getItem(key)}`);
    });

    console.log('\n🎯 SIGUIENTE PASO: Recarga la página para ver los cambios');
    
    return {
        localStorageCleared: localRemovedCount,
        firestoreCleared: firestoreRemovedCount,
        remainingKeys: remainingKeys.length
    };
}

// Ejecutar automáticamente
fixPackingListKeys();
cleanDuplicateKeysComplete();
