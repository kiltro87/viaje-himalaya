/**
 * Script para debuggear las claves de localStorage vs tripConfig
 * Se ejecuta automáticamente al cargar la página
 */

// DISABLED - Run manually in console if needed
// window.addEventListener('load', function() {
//     setTimeout(debugPackingKeys, 1000);
// });

function debugPackingKeys() {
    console.log('🔍 DEBUGGING PACKING LIST KEYS');
    console.log('================================');
    
    // 1. Ver qué hay en localStorage
    const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
    console.log('📦 localStorage keys:', Object.keys(saved));
    console.log('📦 localStorage values:', saved);
    
    // 2. Ver qué items existen en tripConfig
    console.log('\n🎯 tripConfig.packingListData categories:');
    Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
        console.log(`\n📂 ${category} (${items.length} items):`);
        items.forEach((item, index) => {
            const itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
            const newKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
            const oldKey = `${category}-${itemText}`;
            
            const isInLocalStorage = saved[newKey] || saved[oldKey];
            const status = isInLocalStorage ? '✅' : '❌';
            
            console.log(`  ${status} ${index + 1}. "${itemText}"`);
            console.log(`      newKey: ${newKey}`);
            console.log(`      oldKey: ${oldKey}`);
            console.log(`      saved: ${saved[newKey] || saved[oldKey] || 'false'}`);
        });
    });
    
    // 3. Buscar claves huérfanas en localStorage
    console.log('\n🚨 ORPHANED KEYS in localStorage (not matching any tripConfig item):');
    Object.keys(saved).forEach(key => {
        let found = false;
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                const itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
                const newKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
                const oldKey = `${category}-${itemText}`;
                
                if (key === newKey || key === oldKey) {
                    found = true;
                }
            });
        });
        
        if (!found) {
            console.log(`🚨 ORPHANED: "${key}" = ${saved[key]}`);
        }
    });
    
    return {
        localStorage: saved,
        tripConfig: tripConfig.packingListData
    };
}

// DISABLED - Uncomment to run manually
// debugPackingKeys();
