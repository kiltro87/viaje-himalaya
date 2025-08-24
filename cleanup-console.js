/**
 * 🧹 SCRIPT DE LIMPIEZA FIREBASE - CONSOLA DEL NAVEGADOR
 * 
 * INSTRUCCIONES:
 * 1. Abre https://kiltro87.github.io/viaje-himalaya/ en el navegador
 * 2. Abre la consola del navegador (F12)
 * 3. Copia y pega este código completo
 * 4. Presiona Enter y sigue las instrucciones
 * 
 * @author David Ferrer Figueroa
 */

console.log('🧹 INICIANDO LIMPIEZA DE FIREBASE...');

async function cleanupFirebaseFromConsole() {
    try {
        console.log('🔥 Importando Firebase...');
        
        // Importar configuración
        const { firebaseConfig } = await import('./js/config/firebaseConfig.js');
        
        // Importar Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        console.log('🔥 Conectando a Firebase...');
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        console.log('📊 Obteniendo gastos...');
        const querySnapshot = await getDocs(collection(db, 'expenses'));
        
        const expenseCount = querySnapshot.size;
        console.log(`📊 Encontrados ${expenseCount} gastos en Firebase`);
        
        if (expenseCount === 0) {
            console.log('✅ Firebase ya está limpio - no hay gastos para eliminar');
            return;
        }
        
        // Confirmar eliminación
        const confirmDelete = confirm(`¿Eliminar TODOS los ${expenseCount} gastos de Firebase?\n\nEsto solucionará el bucle infinito.`);
        if (!confirmDelete) {
            console.log('❌ Operación cancelada por el usuario');
            return;
        }
        
        console.log(`🗑️ Eliminando ${expenseCount} gastos...`);
        
        // Eliminar todos los documentos
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        
        console.log(`✅ Eliminados ${expenseCount} gastos de Firebase`);
        
        // Limpiar localStorage
        localStorage.removeItem('tripExpensesV1');
        localStorage.removeItem('tripPackingList');
        localStorage.removeItem('tripExpenses');
        console.log('🧹 localStorage limpiado');
        
        // Verificar que está limpio
        const verifySnapshot = await getDocs(collection(db, 'expenses'));
        console.log(`✅ Verificación: ${verifySnapshot.size} gastos restantes en Firebase`);
        
        console.log('🎉 LIMPIEZA COMPLETADA - Firebase está limpio');
        console.log('🔄 Recarga la página para ver los cambios');
        
        // Opcional: recargar automáticamente
        if (confirm('¿Recargar la página automáticamente?')) {
            window.location.reload();
        }
        
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        console.error('❌ Stack trace:', error.stack);
        
        // Instrucciones de respaldo
        console.log('\n🔧 MÉTODO ALTERNATIVO:');
        console.log('1. Ve a https://console.firebase.google.com/');
        console.log('2. Selecciona proyecto "viaje-himalaya"');
        console.log('3. Ve a Firestore Database');
        console.log('4. Elimina la colección "expenses" manualmente');
    }
}

// Ejecutar automáticamente
cleanupFirebaseFromConsole();
