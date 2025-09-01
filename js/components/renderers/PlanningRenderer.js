import Logger from '../../utils/Logger.js';
import { getPackingCategoryIcon } from '../../utils/CategoryUtils.js';
import { tripConfig } from '../../config/tripConfig.js';
import stateManager from '../../utils/StateManager.js';

export class PlanningRenderer {
    constructor() {
        Logger.ui('🎨 PlanningRenderer initialized');
    }

    async renderPlanning() {
        Logger.ui('🎯 Rendering PLANNING view (budget + packing + tools)');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-indigo-600 dark:text-indigo-400">checklist</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Planificación</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Gestiona tu presupuesto, packing y preparativos del viaje</p>
                        </div>
                    </div>
                </div>

                <div id="budget-section" class="mb-12">
                    <div id="budget-container"></div>
                </div>

                <div id="packing-list-content">
                    <p class="text-slate-600 dark:text-slate-400">Cargando lista de equipaje...</p>
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">business</span>
                        Agencias de Viaje
                    </h2>
                    <div id="agencies-content"></div>
                </div>

                <div id="hotels-content">
                    <p class="text-slate-600 dark:text-slate-400">Cargando información de hoteles...</p>
                </div>
            </div>
        `;

        await this.loadPlanningContent();
    }

    async loadPlanningContent() {
        await this.loadBudgetManager();
        await this.loadPackingList();
        await this.loadHotels();
        this.loadAgencies();
        await this.loadAccommodations();
    }

    async loadBudgetManager() {
        try {
            const budgetContainer = document.getElementById('budget-container');
            if (!budgetContainer) {
                Logger.warning('⚠️ Budget container not found');
                return;
            }

            let budgetManager = stateManager.getState('instances.budgetManager');
            if (!budgetManager) {
                const { BudgetManager } = await import('../BudgetManager.js');
                budgetManager = new BudgetManager();
                stateManager.updateState('instances.budgetManager', budgetManager);
            }

            await budgetManager.render(budgetContainer);
            Logger.success('✅ Budget manager loaded in planning view');
        } catch (error) {
            Logger.error('❌ Error loading budget manager:', error);
        }
    }

    async loadPackingList() {
        Logger.ui('🎒 Rendering packing list with Firebase integration');
        const container = document.getElementById('packing-list-content');
        if (!container) {
            Logger.warning('⚠️ Container #packing-list-content not found');
            return;
        }

        // PASO 1: Cargar datos estáticos desde tripConfig
        Logger.debug('📦 Step 1: Loading static data from tripConfig');
        
        // PASO 2: Inicializar PackingListManager para Firestore
        let packingManager = stateManager.getPackingListManager();
        if (!packingManager) {
            try {
                const { getPackingListManager } = await import('../../utils/PackingListManager.js');
                packingManager = getPackingListManager();
                stateManager.setPackingListManager(packingManager);
                
                const firebaseManager = stateManager.getFirebaseManager();
                if (firebaseManager) {
                    await packingManager.initialize(firebaseManager);
                    Logger.debug('🔥 Step 2: Firebase initialized for PackingList');
                }
            } catch (error) {
                Logger.warning('PackingListManager not available, using localStorage only');
                packingManager = null;
            }
        }

        // PASO 3: Priorizar localStorage para carga inmediata de checkboxes
        let saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
        Logger.debug('💾 Step 3: Loaded from localStorage:', Object.keys(saved).length, 'items');
        
        // Crear datos de prueba si localStorage está vacío
        if (Object.keys(saved).length === 0) {
            Logger.warning('🚨 No saved data, creating test data');
            // Crear claves de prueba basadas en el tripConfig real
            const testData = {};
            let count = 0;
            Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
                items.slice(0, 2).forEach(item => { // Solo los primeros 2 items de cada categoría
                    let itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
                    const itemKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
                    testData[itemKey] = true;
                    count++;
                });
            });
            saved = testData;
            localStorage.setItem('packingListV2', JSON.stringify(saved));
            console.log('🚨 Created test data with keys:', Object.keys(saved));
        }
        
        // Merge con Firestore si está disponible
        if (packingManager) {
            try {
                const firestoreItems = packingManager.getItems() || {};
                if (Object.keys(firestoreItems).length > 0) {
                    saved = { ...saved, ...firestoreItems };
                    Logger.debug('🔥 Merged with Firestore data');
                }
            } catch (error) {
                Logger.warning('Error loading from Firestore');
            }
        }

        Logger.debug('🎯 Step 4: Starting packing list rendering...');
        Logger.debug('📦 Categories to render:', Object.keys(tripConfig.packingListData).length);
        Logger.debug('💾 Saved items loaded:', Object.keys(saved).length);
        

        // PASO 3.1: Mantener todos los formatos de clave existentes

        // Calcular estadísticas globales probando TODOS los formatos de clave
        let totalItems = 0;
        let packedItems = 0;
        
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                totalItems++;
                // Probar TODOS los formatos de clave posibles
                let itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
                
                // Formato nuevo
                const newKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
                // Formato viejo
                const oldKey = `${category}-${itemText}`;
                
                if (saved[newKey] || saved[oldKey]) {
                    packedItems++;
                }
            });
        });

        // UI consistente con el estilo de la app (sin gradientes)
        const categoriesHTML = Object.entries(tripConfig.packingListData).map(([category, items]) => {
            const categoryIcon = getPackingCategoryIcon(category);
            const cleanCategoryName = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            
            // Calcular estadísticas de la categoría usando el formato correcto
            const categoryPacked = items.filter(item => {
                let itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
                const itemKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
                return saved[itemKey];
            }).length;
            const categoryTotal = items.length;
            const categoryPercentage = categoryTotal > 0 ? Math.round((categoryPacked / categoryTotal) * 100) : 0;
            
            // Debug: verificar duplicados
            Logger.debug(`🔍 Category: ${category}, Items: ${items.length}`, items.map(item => `${category}-${item}`));
            
            return `
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div class="category-header p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" 
                         data-category="${category}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">${categoryIcon}</span>
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${cleanCategoryName}</h3>
                                    <p class="text-sm text-slate-600 dark:text-slate-400 category-items-count">${categoryPacked}/${categoryTotal} completados</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 category-progress-bar" 
                                             style="width: ${categoryPercentage}%"></div>
                                    </div>
                                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 category-percentage">${categoryPercentage}%</div>
                                </div>
                                <span class="material-symbols-outlined text-slate-400 transform transition-transform category-chevron">
                                    expand_more
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="category-content hidden border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700/30">
                        <div class="space-y-2">
                            ${items.map(item => {
                                // Usar formato de clave consistente con PackingListManager
                                let itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
                                const itemKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
                                const isChecked = saved[itemKey] || false;
                                return `
                                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                                        <input type="checkbox" ${isChecked ? 'checked' : ''} 
                                               data-item-key="${itemKey}"
                                               data-category="${category}"
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                                        <span class="flex-1 text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through opacity-60' : ''}">${itemText}</span>
                                        ${isChecked ? '<span class="material-symbols-outlined text-green-600 text-lg">check</span>' : ''}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Envolver todo en una tarjeta como las demás secciones
        const packingCard = document.createElement('div');
        packingCard.className = 'bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-12';
        
        const globalPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
        
        
        packingCard.innerHTML = `
            <!-- Header dentro de la tarjeta -->
            <div class="flex items-center gap-3 mb-6">
                <span class="material-symbols-outlined text-3xl text-teal-600 dark:text-teal-400">luggage</span>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Lista de Equipaje</h2>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="global-progress">${packedItems}/${totalItems}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400">${globalPercentage}% completado</div>
                </div>
            </div>

            <!-- TARJETAS DE PROGRESO Y PESO -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">inventory</span>
                        <div>
                            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100" id="packed-count">${packedItems}/${totalItems}</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Items empacados</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">trending_up</span>
                        <div>
                            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100" id="progress-percent">${globalPercentage}%</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Progreso total</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">scale</span>
                        <div>
                            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100" id="total-weight">${Math.round(packedItems * 0.15)}kg</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Peso estimado</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Categorías con desplegables en grid 2x2 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="packing-categories">
                ${categoriesHTML}
            </div>
        `;
        
        container.innerHTML = '';
        container.appendChild(packingCard);

        // Event listeners para desplegables
        container.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const chevron = header.querySelector('.category-chevron');
                
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    chevron.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.add('hidden');
                    chevron.style.transform = 'rotate(0deg)';
                }
            });
        });

        // Event listener para checkboxes con sincronización Firebase + localStorage
        container.addEventListener('change', async (e) => {
            if (e.target.type === 'checkbox' && e.target.hasAttribute('data-item-key')) {
                const itemKey = e.target.getAttribute('data-item-key');
                const category = e.target.getAttribute('data-category');
                const isChecked = e.target.checked;
                
                Logger.debug(`🎒 Toggling item: ${itemKey} = ${isChecked}`);
                
                // PASO 4: Actualización bidireccional
                try {
                    // Actualizar localStorage inmediatamente (optimistic UI)
                    const localSaved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
                    localSaved[itemKey] = isChecked;
                    localStorage.setItem('packingListV2', JSON.stringify(localSaved));
                    
                    // Actualizar Firestore si está disponible
                    if (packingManager) {
                        await packingManager.toggleItem(itemKey, isChecked);
                        Logger.debug('🔥 Item synced to Firestore');
                    }
                    
                    // Actualizar UI inmediatamente
                    this.updateItemVisual(e.target, isChecked);
                    this.updateCategoryStats(category, container);
                    this.updateGlobalStats(container);
                    
                } catch (error) {
                    Logger.error('Error syncing item:', error);
                    // Revertir checkbox en caso de error
                    e.target.checked = !isChecked;
                }
            }
        });

        Logger.success('✅ Packing list rendered with Firebase integration');
    }

    async loadHotels() {
        const hotelsContent = document.getElementById('hotels-content');
        if (!hotelsContent) {
            Logger.error('hotels-content div not found');
            return;
        }

        let hotelManager = stateManager.getHotelManager();
        
        // If HotelManager is not available, try to get it from dependency container
        if (!hotelManager) {
            try {
                const dependencyContainer = await import('../../core/DependencyContainer.js');
                hotelManager = await dependencyContainer.default.resolve('hotelManager');
                stateManager.setHotelManager(hotelManager);
                
                // Initialize with available managers
                const firebaseManager = stateManager.getFirebaseManager();
                const budgetManager = stateManager.getBudgetManager();
                if (firebaseManager || budgetManager) {
                    await hotelManager.initialize(firebaseManager, budgetManager);
                }
            } catch (error) {
                if (Logger && Logger.error) {
                    Logger.error('Failed to resolve HotelManager:', error);
                }
            }
        }
        
        if (!hotelManager) {
            Logger.warning('HotelManager not available - showing fallback content');
            hotelsContent.innerHTML = `
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-12">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">hotel</span>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Alojamientos</h2>
                        </div>
                    </div>
                    <p class="text-slate-600 dark:text-slate-400">HotelManager no está disponible. Inicializando...</p>
                </div>
            `;
            return;
        }

        const reservations = hotelManager.getAllReservations();
        const stats = hotelManager.getHotelStats();

        const hotelsHTML = `
            <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-12">
                <!-- Header -->
                <div class="flex items-center gap-3 mb-6">
                    <span class="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">hotel</span>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Alojamientos</h2>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${stats.totalReservations}</div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">reservas</div>
                    </div>
                </div>

                <!-- Estadísticas -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">hotel</span>
                            <div>
                                <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">${stats.totalNights}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">Noches totales</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">payments</span>
                            <div>
                                <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">$${stats.totalCost}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">Costo total</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">calculate</span>
                            <div>
                                <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">$${stats.avgCostPerNight}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">Promedio/noche</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lista de reservas -->
                <div class="space-y-4">
                    ${reservations.map(reservation => {
                        const hotel = hotelManager.getHotel(reservation.hotelId);
                        if (!hotel) return '';
                        
                        return `
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                                <div class="flex items-start gap-4">
                                    <img src="${hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                                         alt="${hotel.name}" 
                                         class="w-16 h-16 rounded-lg object-cover">
                                    <div class="flex-1">
                                        <div class="flex items-start justify-between">
                                            <div>
                                                <h3 class="font-semibold text-slate-900 dark:text-white">${hotel.name}</h3>
                                                <p class="text-sm text-slate-600 dark:text-slate-400">${hotel.location}, ${hotel.country}</p>
                                                <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">${hotel.description}</p>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-lg font-bold text-slate-900 dark:text-white">$${reservation.totalCost}</div>
                                                <div class="text-sm text-slate-600 dark:text-slate-400">${reservation.nights} noches</div>
                                            </div>
                                        </div>
                                        <div class="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-sm">calendar_today</span>
                                                ${new Date(reservation.checkInDate).toLocaleDateString('es-ES')} - ${new Date(reservation.checkOutDate).toLocaleDateString('es-ES')}
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-sm">confirmation_number</span>
                                                ${reservation.confirmationCode}
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-sm">bed</span>
                                                ${reservation.roomType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        hotelsContent.innerHTML = hotelsHTML;
        Logger.success('✅ Hotels information rendered');
        
        // Debug logging
        if (Logger && Logger.info) {
            Logger.info(`Hotels loaded: ${reservations.length} reservations found`);
            Logger.info('Hotel stats:', stats);
        }
    }

    cleanPackingData(saved) {
        const validItems = {};
        const validKeys = new Set();
        
        // Crear conjunto de claves válidas desde tripConfig
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                validKeys.add(`${category}-${item}`);
            });
        });
        
        // Filtrar solo items válidos
        Object.entries(saved).forEach(([key, value]) => {
            if (validKeys.has(key)) {
                validItems[key] = value;
            } else {
                Logger.debug('🗑️ Removing invalid/duplicate item:', key);
            }
        });
        
        return validItems;
    }

    updateItemVisual(checkbox, isChecked) {
        const label = checkbox.closest('label');
        const span = label.querySelector('span');
        const checkIcon = label.querySelector('.material-symbols-outlined');
        
        if (isChecked) {
            if (span) span.classList.add('line-through', 'opacity-60');
            if (!checkIcon) {
                label.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined text-green-600 text-lg">check</span>');
            }
        } else {
            if (span) span.classList.remove('line-through', 'opacity-60');
            if (checkIcon) checkIcon.remove();
        }
    }

    updateCategoryStats(category, container) {
        const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
        const categoryItems = tripConfig.packingListData[category] || [];
        
        // Usar el mismo formato de clave que en el renderizado
        const categoryPacked = categoryItems.filter(item => {
            let itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
            const itemKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
            return saved[itemKey];
        }).length;
        
        const categoryTotal = categoryItems.length;
        const categoryPercentage = categoryTotal > 0 ? Math.round((categoryPacked / categoryTotal) * 100) : 0;

        // Actualizar estadísticas de la categoría usando las nuevas clases
        const categoryHeader = container.querySelector(`[data-category="${category}"]`);
        if (categoryHeader) {
            const itemsCount = categoryHeader.querySelector('.category-items-count');
            const percentageText = categoryHeader.querySelector('.category-percentage');
            const progressBar = categoryHeader.querySelector('.category-progress-bar');
            
            if (itemsCount) itemsCount.textContent = `${categoryPacked}/${categoryTotal} completados`;
            if (percentageText) percentageText.textContent = `${categoryPercentage}%`;
            if (progressBar) progressBar.style.width = `${categoryPercentage}%`;
            
            Logger.debug(`📊 Updated category ${category}: ${categoryPacked}/${categoryTotal} (${categoryPercentage}%)`);
        }
    }

    updateGlobalStats(container) {
        const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
        let totalItems = 0;
        let packedItems = 0;
        
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                totalItems++;
                // Usar el mismo formato de clave que en el renderizado
                let itemText = typeof item === 'object' ? String(item.item || item.name || 'Item desconocido') : String(item);
                const itemKey = `${category.toLowerCase().replace(/\s+/g, '_')}_${itemText.toLowerCase().replace(/\s+/g, '_')}`;
                if (saved[itemKey]) packedItems++;
            });
        });

        const globalProgress = container.querySelector('#global-progress');
        if (globalProgress) globalProgress.textContent = `${packedItems}/${totalItems}`;
        
        // Actualizar tarjetas de progreso si existen
        const packedCount = container.querySelector('#packed-count');
        const progressPercent = container.querySelector('#progress-percent');
        const globalPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
        
        if (packedCount) packedCount.textContent = `${packedItems}/${totalItems}`;
        if (progressPercent) progressPercent.textContent = `${globalPercentage}%`;
    }

    loadAgencies() {
        const agenciesContent = document.getElementById('agencies-content');
        if (!agenciesContent) return;

        const agencies = tripConfig.agenciesData;
        
        // Generate cards dynamically based on available agencies
        const agencyCards = [];
        
        // Process each agency type
        Object.entries(agencies).forEach(([key, agency]) => {
            if (!agency) return;
            
            let cardHTML = '';
            
            if (key === 'emergency') {
                // Special layout for emergency information
                cardHTML = `
                    <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600 md:col-span-2">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="material-symbols-outlined text-2xl ${agency.color}">${agency.icon}</span>
                            <div>
                                <h3 class="font-bold text-lg text-slate-900 dark:text-white">${agency.name}</h3>
                            </div>
                        </div>
                        <div class="grid md:grid-cols-3 gap-4 text-sm text-slate-700 dark:text-slate-300">
                            ${agency.embassy ? `<div><strong>Embajada:</strong><br>${agency.embassy}</div>` : ''}
                            ${agency.hospital ? `<div><strong>Hospital:</strong><br>${agency.hospital}</div>` : ''}
                            ${agency.timezone ? `<div><strong>Zona Horaria:</strong><br>${agency.timezone}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                // Standard agency card layout
                cardHTML = `
                    <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="material-symbols-outlined text-2xl ${agency.color}">${agency.icon}</span>
                            <div>
                                <h3 class="font-bold text-lg text-slate-900 dark:text-white">${agency.name}</h3>
                                ${agency.tour ? `<p class="text-sm text-slate-600 dark:text-slate-400">${agency.tour}</p>` : ''}
                                ${agency.status ? `<p class="text-sm text-slate-600 dark:text-slate-400">${agency.status}</p>` : ''}
                            </div>
                        </div>
                        <p class="text-slate-700 dark:text-slate-300 mb-4">${agency.description}</p>
                        ${agency.url || agency.price ? `
                            <div class="flex gap-3">
                                ${agency.url ? `
                                    <a href="${agency.url}" target="_blank" 
                                       class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white radius-standard transition-standard text-sm">
                                        Ver Información
                                    </a>
                                ` : ''}
                                ${agency.price ? `
                                    <span class="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 radius-standard text-sm font-medium">
                                        ${agency.price}
                                    </span>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            agencyCards.push(cardHTML);
        });
        
        // Determine grid layout based on number of cards
        const cardCount = agencyCards.length;
        let gridClass = 'grid gap-6';
        
        if (cardCount === 1) {
            gridClass = 'grid gap-6';
        } else if (cardCount === 2) {
            gridClass = 'grid md:grid-cols-2 gap-6';
        } else if (cardCount >= 3) {
            gridClass = 'grid md:grid-cols-2 lg:grid-cols-3 gap-6';
        }
        
        agenciesContent.innerHTML = `
            <div class="${gridClass}">
                ${agencyCards.join('')}
            </div>
        `;

        Logger.success(`✅ ${cardCount} agency cards rendered dynamically`);
    }

    loadAccommodations() {
        const accommodationsContent = document.getElementById('accommodations-content');
        if (!accommodationsContent) return;

        // Use reservations data for detailed hotel information
        const reservations = tripConfig.reservationsData || [];
        const hotels = tripConfig.hotelsData || [];
        
        let accommodationsHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        
        reservations.forEach(reservation => {
            // Find hotel details
            const hotel = hotels.find(h => h.id === reservation.hotelId);
            const hotelName = hotel ? hotel.name : 'Hotel desconocido';
            const location = hotel ? hotel.location : 'Ubicación desconocida';
            
            // Format dates
            const checkIn = new Date(reservation.checkInDate).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit'
            });
            const checkOut = new Date(reservation.checkOutDate).toLocaleDateString('es-ES', {
                day: '2-digit', 
                month: '2-digit'
            });
            
            accommodationsHTML += `
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hotel-card" 
                     style="cursor: pointer !important;"
                     onclick="window.openHotelModal('${reservation.id}')"
                     data-reservation='${JSON.stringify(reservation)}' data-hotel='${JSON.stringify(hotel)}'>
                    <div class="flex items-start gap-4">
                        <img src="${hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'}" 
                             alt="${hotelName}" 
                             class="w-16 h-16 rounded-lg object-cover">
                        <div class="flex-1">
                            <h4 class="font-bold text-slate-900 dark:text-white text-lg mb-1">${hotelName}</h4>
                            <div class="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                <span class="material-symbols-outlined text-sm">location_on</span>
                                <span>${location}</span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div class="text-slate-500 dark:text-slate-400">Fechas</div>
                                    <div class="font-medium text-slate-900 dark:text-white">${checkIn} - ${checkOut}</div>
                                    <div class="text-xs text-slate-500">${reservation.nights} noche${reservation.nights > 1 ? 's' : ''}</div>
                                </div>
                                <div>
                                    <div class="text-slate-500 dark:text-slate-400">Costo</div>
                                    <div class="font-bold text-lg text-slate-900 dark:text-white">
                                        ${reservation.myCost || reservation.totalCost}€
                                    </div>
                                    ${reservation.shared ? `<div class="text-xs text-slate-500">Total: ${reservation.totalCost}€</div>` : ''}
                                </div>
                            </div>
                            
                            <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm text-slate-500 dark:text-slate-400">
                                        Click para ver detalles completos
                                    </div>
                                    <span class="material-symbols-outlined text-slate-400">chevron_right</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        accommodationsHTML += '</div>';
        accommodationsContent.innerHTML = accommodationsHTML;

        // Create global function for onclick handlers
        window.openHotelModal = (reservationId) => {
            const reservation = reservations.find(r => r.id === reservationId);
            const hotel = hotels.find(h => h.id === reservation?.hotelId);
            if (reservation && hotel) {
                this.showHotelModal(reservation, hotel);
            }
        };

        // Also add event listeners as backup
        this.addHotelCardListeners();

        Logger.success(`✅ ${reservations.length} hotel reservations rendered with onclick handlers`);
    }

    addHotelCardListeners() {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            const hotelCards = document.querySelectorAll('.hotel-card');
            Logger.info(`Found ${hotelCards.length} hotel cards to add listeners to`);
            
            hotelCards.forEach((card, index) => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                        const reservation = JSON.parse(card.dataset.reservation);
                        const hotel = JSON.parse(card.dataset.hotel);
                        Logger.info(`Opening modal for hotel card ${index + 1}`);
                        this.showHotelModal(reservation, hotel);
                    } catch (error) {
                        Logger.error('Error opening hotel modal:', error);
                    }
                });
                
                // Add visual feedback
                card.style.cursor = 'pointer';
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-2px)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                });
            });
        }, 100);
    }

    showHotelModal(reservation, hotel) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('hotel-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'hotel-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
            document.body.appendChild(modal);
        }

        // Format dates with full info
        const checkInDate = new Date(reservation.checkInDate);
        const checkOutDate = new Date(reservation.checkOutDate);
        const checkInFull = checkInDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const checkOutFull = checkOutDate.toLocaleDateString('es-ES', {
            weekday: 'long', 
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="relative">
                    <img src="${hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                         alt="${hotel?.name || 'Hotel'}" 
                         class="w-full h-48 object-cover rounded-t-2xl">
                    <button class="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all" 
                            onclick="document.getElementById('hotel-modal').classList.add('hidden')">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">${hotel?.name || 'Hotel'}</h2>
                    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-6">
                        <span class="material-symbols-outlined">location_on</span>
                        <span>${hotel?.location || 'Ubicación'}, ${hotel?.country || ''}</span>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <div class="space-y-4">
                            <div>
                                <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Fechas de Estadía</h3>
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                    <div class="text-sm text-slate-600 dark:text-slate-400">Check-in</div>
                                    <div class="font-medium text-slate-900 dark:text-white">${checkInFull}</div>
                                    <div class="text-sm text-slate-600 dark:text-slate-400 mt-2">Check-out</div>
                                    <div class="font-medium text-slate-900 dark:text-white">${checkOutFull}</div>
                                    <div class="text-xs text-slate-500 mt-2">${reservation.nights} noche${reservation.nights > 1 ? 's' : ''}</div>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Habitación</h3>
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                    <div class="font-medium text-slate-900 dark:text-white">${reservation.roomType}</div>
                                    <div class="text-sm text-slate-600 dark:text-slate-400">${reservation.guestNames?.[0] || '2 Adults'}</div>
                                    ${reservation.specialRequests ? `<div class="text-xs text-slate-500 mt-1">${reservation.specialRequests}</div>` : ''}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Información de Reserva</h3>
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
                                    <div>
                                        <div class="text-sm text-slate-600 dark:text-slate-400">Código de Confirmación</div>
                                        <div class="font-mono text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-600 px-2 py-1 rounded border">
                                            ${reservation.confirmationCode}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-slate-600 dark:text-slate-400">PIN</div>
                                        <div class="font-mono text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-600 px-2 py-1 rounded border">
                                            ${reservation.pinCode || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-slate-600 dark:text-slate-400">Estado</div>
                                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                            ${reservation.status === 'confirmed' ? 'Confirmada' : reservation.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Costo</h3>
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                    ${reservation.shared ? `
                                        <div class="text-sm text-slate-600 dark:text-slate-400">Costo Total</div>
                                        <div class="font-medium text-slate-900 dark:text-white">${reservation.totalCost}€</div>
                                        <div class="text-sm text-slate-600 dark:text-slate-400 mt-2">Mi Parte</div>
                                        <div class="font-bold text-xl text-slate-900 dark:text-white">${reservation.myCost}€</div>
                                        <div class="text-xs text-slate-500 mt-1">Dividido entre ${reservation.splitBetween} personas</div>
                                    ` : `
                                        <div class="text-sm text-slate-600 dark:text-slate-400">Costo Total</div>
                                        <div class="font-bold text-xl text-slate-900 dark:text-white">${reservation.totalCost}€</div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>

                    ${hotel?.contact ? `
                        <div class="border-t border-slate-200 dark:border-slate-600 pt-4">
                            <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Contacto del Hotel</h3>
                            <div class="grid md:grid-cols-2 gap-4 text-sm">
                                ${hotel.contact.phone ? `
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-slate-500">phone</span>
                                        <span class="text-slate-700 dark:text-slate-300">${hotel.contact.phone}</span>
                                    </div>
                                ` : ''}
                                ${hotel.contact.email ? `
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-slate-500">email</span>
                                        <span class="text-slate-700 dark:text-slate-300 text-xs">${hotel.contact.email}</span>
                                    </div>
                                ` : ''}
                            </div>
                            ${hotel.URL ? `
                                <div class="mt-4">
                                    <a href="${hotel.URL}" target="_blank" 
                                       class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                                        <span class="material-symbols-outlined text-sm">open_in_new</span>
                                        Ver en Booking.com
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Show modal
        modal.classList.remove('hidden');

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    extractLocationFromDay(dayData) {
        if (!dayData) return 'Ubicación desconocida';
        if (dayData.location) return dayData.location;
        
        // Verificar que existe title antes de usar toLowerCase
        if (!dayData.title) return 'Ubicación desconocida';
        
        // Extraer ubicación del título
        const title = dayData.title.toLowerCase();
        if (title.includes('katmandú') || title.includes('kathmandu')) return 'Katmandú';
        if (title.includes('pokhara')) return 'Pokhara';
        if (title.includes('chitwan')) return 'Chitwan';
        if (title.includes('thimphu')) return 'Thimphu';
        if (title.includes('paro')) return 'Paro';
        if (title.includes('punakha')) return 'Punakha';
        
        return dayData.country === 'Bután' ? 'Thimphu' : 'Katmandú';
    }
}

export const planningRenderer = new PlanningRenderer();
