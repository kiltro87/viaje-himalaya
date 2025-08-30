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

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">hotel</span>
                        Alojamientos del Viaje
                    </h2>
                    <div id="accommodations-content"></div>
                </div>
            </div>
        `;

        await this.loadPlanningContent();
    }

    async loadPlanningContent() {
        await this.loadBudgetManager();
        await this.loadPackingList();
        this.loadAgencies();
        this.loadAccommodations();
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

        // PASO 3: Obtener estado desde Firestore (si está disponible) o localStorage
        let saved = {};
        if (packingManager) {
            try {
                saved = packingManager.getItems() || {};
                Logger.debug('🔥 Step 3: Loaded state from Firestore:', Object.keys(saved).length, 'items');
            } catch (error) {
                Logger.warning('Error loading from Firestore, falling back to localStorage');
                saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
            }
        } else {
            saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
            Logger.debug('💾 Step 3: Loaded state from localStorage:', Object.keys(saved).length, 'items');
        }

        // PASO 3.1: Limpiar datos duplicados o malformados
        const cleanedSaved = this.cleanPackingData(saved);
        if (Object.keys(cleanedSaved).length !== Object.keys(saved).length) {
            Logger.debug('🧹 Cleaned packing data:', Object.keys(saved).length, '→', Object.keys(cleanedSaved).length);
            saved = cleanedSaved;
            // Actualizar localStorage con datos limpios
            localStorage.setItem('packingListV2', JSON.stringify(saved));
        }

        // Calcular estadísticas globales
        let totalItems = 0;
        let packedItems = 0;
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                totalItems++;
                const itemKey = `${category}-${item}`;
                if (saved[itemKey]) packedItems++;
            });
        });

        // UI consistente con el estilo de la app (sin gradientes)
        const categoriesHTML = Object.entries(tripConfig.packingListData).map(([category, items]) => {
            const categoryIcon = getPackingCategoryIcon(category);
            const cleanCategoryName = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            
            // Calcular estadísticas de la categoría
            const categoryPacked = items.filter(item => saved[`${category}-${item}`]).length;
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
                                    <p class="text-sm text-slate-600 dark:text-slate-400">${categoryPacked}/${categoryTotal} completados</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">${categoryPercentage}%</div>
                                    <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300" 
                                             style="width: ${categoryPercentage}%"></div>
                                    </div>
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
                                const itemKey = `${category}-${item}`;
                                const isChecked = saved[itemKey] || false;
                                return `
                                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                                        <input type="checkbox" ${isChecked ? 'checked' : ''} 
                                               data-item-key="${itemKey}"
                                               data-category="${category}"
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                                        <span class="flex-1 text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through opacity-60' : ''}">${item}</span>
                                        ${isChecked ? '<span class="material-symbols-outlined text-green-600 text-lg">check</span>' : ''}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <!-- Header consistente con la app -->
            <div class="flex items-center gap-3 mb-6">
                <span class="material-symbols-outlined text-3xl text-teal-600 dark:text-teal-400">luggage</span>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Lista de Equipaje</h2>
                    <p class="text-slate-600 dark:text-slate-400">Organiza todo lo necesario para tu aventura</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="global-progress">${packedItems}/${totalItems}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400">completado</div>
                </div>
            </div>

            <!-- Categorías con desplegables -->
            <div class="space-y-4" id="packing-categories">
                ${categoriesHTML}
            </div>
        `;

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
        const categoryPacked = categoryItems.filter(item => saved[`${category}-${item}`]).length;
        const categoryTotal = categoryItems.length;
        const categoryPercentage = categoryTotal > 0 ? Math.round((categoryPacked / categoryTotal) * 100) : 0;

        // Actualizar estadísticas de la categoría
        const categoryHeader = container.querySelector(`[data-category="${category}"]`);
        if (categoryHeader) {
            const itemsText = categoryHeader.querySelector('p');
            const percentageText = categoryHeader.querySelector('.text-2xl');
            const progressBar = categoryHeader.querySelector('.h-full');
            
            if (itemsText) itemsText.textContent = `${categoryPacked}/${categoryTotal} items completados`;
            if (percentageText) percentageText.textContent = `${categoryPercentage}%`;
            if (progressBar) progressBar.style.width = `${categoryPercentage}%`;
        }
    }

    updateGlobalStats(container) {
        const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
        let totalItems = 0;
        let packedItems = 0;
        
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                totalItems++;
                const itemKey = `${category}-${item}`;
                if (saved[itemKey]) packedItems++;
            });
        });

        const globalProgress = container.querySelector('#global-progress');
        if (globalProgress) globalProgress.textContent = `${packedItems}/${totalItems}`;
    }

    loadAgencies() {
        const agenciesContent = document.getElementById('agencies-content');
        if (!agenciesContent) return;

        const agencies = tripConfig.agenciesData;
        
        agenciesContent.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.weroad.color}">${agencies.weroad.icon}</span>
                        <div>
                            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${agencies.weroad.name}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${agencies.weroad.tour}</p>
                        </div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 mb-4">${agencies.weroad.description}</p>
                    <div class="flex gap-3">
                        <a href="${agencies.weroad.url}" target="_blank" 
                           class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white radius-standard transition-standard text-sm">
                            Ver Paquete
                        </a>
                        <span class="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 radius-standard text-sm font-medium">
                            ${agencies.weroad.price}
                        </span>
                    </div>
                </div>

                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.bhutan.color}">${agencies.bhutan.icon}</span>
                        <div>
                            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${agencies.bhutan.name}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${agencies.bhutan.tour}</p>
                        </div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 mb-4">${agencies.bhutan.description}</p>
                    <div class="flex gap-3">
                        <a href="${agencies.bhutan.url}" target="_blank" 
                           class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white radius-standard transition-standard text-sm">
                            Ver Información
                        </a>
                        <span class="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 radius-standard text-sm font-medium">
                            ${agencies.bhutan.price}
                        </span>
                    </div>
                </div>
            </div>
        `;

        Logger.success('✅ Agencies information rendered');
    }

    loadAccommodations() {
        const accommodationsContent = document.getElementById('accommodations-content');
        if (!accommodationsContent) return;

        // Extraer información de alojamientos del tripConfig
        const accommodationsByLocation = {};
        
        tripConfig.itineraryData.forEach(day => {
            if (day.accommodation && day.accommodation !== 'Vuelo nocturno') {
                const location = this.extractLocationFromDay(day);
                if (!accommodationsByLocation[location]) {
                    accommodationsByLocation[location] = [];
                }
                if (!accommodationsByLocation[location].includes(day.accommodation)) {
                    accommodationsByLocation[location].push(day.accommodation);
                }
            }
        });

        // Crear tarjetas individuales para cada hotel
        let accommodationsHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        
        Object.entries(accommodationsByLocation).forEach(([location, hotels]) => {
            hotels.forEach(hotel => {
                accommodationsHTML += `
                    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl mt-1">hotel</span>
                            <div class="flex-1">
                                <h4 class="font-semibold text-slate-900 dark:text-white text-sm mb-1">${hotel}</h4>
                                <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span class="material-symbols-outlined text-xs">location_on</span>
                                    <span>${location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
        
        accommodationsHTML += '</div>';
        accommodationsContent.innerHTML = accommodationsHTML;

        Logger.success('✅ Accommodations information rendered');
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
