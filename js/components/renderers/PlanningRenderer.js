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

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-teal-600 dark:text-teal-400">inventory_2</span>
                        Lista de Equipaje
                    </h2>
                    <div id="packing-list-content">
                        <p class="text-slate-600 dark:text-slate-400">Cargando lista de equipaje...</p>
                    </div>
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
        Logger.ui('🎒 Rendering packing list');
        const container = document.getElementById('packing-list-content');
        if (!container) {
            Logger.warning('⚠️ Container #packing-list-content not found');
            return;
        }

        // Sistema simple: solo localStorage + tripConfig (NO Firebase)
        const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
        
        // Renderizar usando el sistema exacto de main (que funcionaba)
        const listHTML = Object.entries(tripConfig.packingListData).map(([category, items]) => {
            const categoryIcon = getPackingCategoryIcon(category);
            const categoryColor = 'text-blue-600 dark:text-blue-400';
            // Limpiar el nombre de la categoría eliminando emojis
            const cleanCategoryName = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

            return `
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${categoryColor}">${categoryIcon}</span>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white">${cleanCategoryName}</h3>
                    </div>
                    <div class="space-y-2">
                        ${items.map(item => {
                            const itemKey = `${category}-${item}`;
                            const isChecked = saved[itemKey] || false;
                            return `
                                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                    <input type="checkbox" ${isChecked ? 'checked' : ''} 
                                           data-item-key="${itemKey}"
                                           class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                                    <span class="text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through opacity-50' : ''}">${item}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Calcular estadísticas
        let totalItems = 0;
        let packedItems = 0;
        Object.entries(tripConfig.packingListData).forEach(([category, items]) => {
            items.forEach(item => {
                totalItems++;
                const itemKey = `${category}-${item}`;
                if (saved[itemKey]) packedItems++;
            });
        });

        container.innerHTML = `
            <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-3xl text-teal-600 dark:text-teal-400">luggage</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Lista de Equipaje</h2>
            </div>
            
            <div id="packing-stats" class="mb-6">
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${packedItems}/${totalItems}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400">completado</div>
                </div>
            </div>
            
            <div class="grid gap-6 md:grid-cols-2">
                ${listHTML}
            </div>
        `;
        
        // Event listener exacto de main (que funcionaba)
        container.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.hasAttribute('data-item-key')) {
                const saved = JSON.parse(localStorage.getItem('packingListV2') || '{}');
                const itemKey = e.target.getAttribute('data-item-key');
                if (itemKey) {
                    saved[itemKey] = e.target.checked;
                    localStorage.setItem('packingListV2', JSON.stringify(saved));
                    
                    // Actualizar visual inmediatamente
                    const label = e.target.closest('label');
                    const span = label.querySelector('span');
                    if (span) {
                        if (e.target.checked) {
                            span.classList.add('line-through', 'opacity-50');
                        } else {
                            span.classList.remove('line-through', 'opacity-50');
                        }
                    }
                    
                    // Actualizar estadísticas
                    this.updatePackingStats();
                }
            }
        });

        Logger.success('✅ Packing list rendered');
    }

    updatePackingStats() {
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

        const statsDiv = document.querySelector('#packing-stats .text-2xl');
        if (statsDiv) {
            statsDiv.textContent = `${packedItems}/${totalItems}`;
        }
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
