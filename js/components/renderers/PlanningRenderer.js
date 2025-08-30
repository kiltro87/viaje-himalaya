/**
 * PlanningRenderer - Renderizador Especializado de Vista PLANNING
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * relacionada con la vista de planificación del viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from UIRenderer.js
 */

import { tripConfig } from '../../config/tripConfig.js';
import Logger from '../../utils/Logger.js';
import stateManager from '../../utils/StateManager.js';
import { BudgetManager } from '../BudgetManager.js';
import { getPackingCategoryIcon } from '../../utils/CategoryUtils.js';

export class PlanningRenderer {
    
    constructor() {
        Logger.ui('PlanningRenderer initialized');
    }

    /**
     * 🎯 RENDERIZAR VISTA PLANNING COMPLETA
     */
    renderPlanning() {
        Logger.ui('🎯 Rendering PLANNING view (budget + packing + tools)');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            Logger.error('❌ Main content container not found');
            return;
        }

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-purple-600 dark:text-purple-400">assignment</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Planificación</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Organiza tu viaje al detalle</p>
                        </div>
                    </div>
                </div>

                <div id="budget-section" class="mb-12">
                    <div id="budget-container">
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-green-600 dark:text-green-400">inventory_2</span>
                        Lista de Equipaje
                    </h2>
                    <div id="packing-list-content">
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">business</span>
                        Agencias de Viaje
                    </h2>
                    <div id="agencies-content">
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">hotel</span>
                        Alojamientos
                    </h2>
                    <div id="accommodations-content">
                    </div>
                </div>
            </div>
        `;

        this.loadPlanningContent();
    }

    loadPlanningContent() {
        this.loadBudgetManager();
        this.loadPackingList();
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

        let packingManager = stateManager.getPackingListManager();
        if (!packingManager) {
            try {
                const { getPackingListManager } = await import('../../utils/PackingListManager.js');
                packingManager = getPackingListManager();
                stateManager.setPackingListManager(packingManager);
                
                const firebaseManager = stateManager.getFirebaseManager();
                if (firebaseManager) {
                    await packingManager.initialize(firebaseManager);
                }
            } catch (error) {
                Logger.warning('PackingListManager not available, using simple implementation');
                packingManager = null;
            }
        }

        const saved = packingManager ? packingManager.getItems() : {};
        
        if (!tripConfig.packingListData || tripConfig.packingListData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-600 mb-4 block">inventory_2</span>
                    <p class="text-slate-500 dark:text-slate-400">No hay datos de equipaje disponibles</p>
                </div>
            `;
            return;
        }

        const totalItems = Object.values(tripConfig.packingListData).reduce((total, items) => total + items.length, 0);
        const checkedItems = Object.values(saved).filter(Boolean).length;
        const completionPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

        let html = `
            <div id="packing-stats" class="mb-6">
                <div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Progreso del equipaje</span>
                        <span class="text-sm font-bold text-slate-900 dark:text-white">${checkedItems}/${totalItems} items</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full transition-standard" style="width: ${completionPercentage}%"></div>
                    </div>
                    <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">${completionPercentage}% completado</div>
                </div>
            </div>
        `;

        Object.entries(tripConfig.packingListData).forEach(([categoryName, categoryItems]) => {
            const categoryChecked = categoryItems.filter(item => saved[item]).length;
            
            html += `
                <div class="mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-xl text-blue-600 dark:text-blue-400">${this.getCategoryIcon(categoryName)}</span>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${categoryName}</h3>
                        <span class="text-sm text-slate-500 dark:text-slate-400">(${categoryChecked}/${categoryItems.length})</span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            `;
            
            categoryItems.forEach(item => {
                const isChecked = saved[item] || false;
                const checkboxId = `packing-${item.replace(/\s+/g, '-').toLowerCase()}`;
                
                html += `
                    <label for="${checkboxId}" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-standard ${isChecked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}">
                        <input 
                            type="checkbox" 
                            id="${checkboxId}"
                            class="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                            ${isChecked ? 'checked' : ''}
                            onchange="window.packingListManager?.toggleItem('${item}', this.checked)"
                        >
                        <span class="text-sm text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through opacity-75' : ''}">${item}</span>
                    </label>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        Logger.success('✅ Packing list rendered');
    }

    getCategoryIcon(category) {
        return getPackingCategoryIcon(category);
    }

    loadAgencies() {
        Logger.ui('🏢 Rendering agencies information');
        const agenciesContent = document.getElementById('agencies-content');
        if (!agenciesContent) {
            Logger.warning('⚠️ Agencies content container not found');
            return;
        }

        // Usar datos reales de tripConfig
        const agencies = tripConfig.agenciesData;
        
        agenciesContent.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.weroad.color}">${agencies.weroad.icon}</span>
                        <div>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${agencies.weroad.name}</h3>
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
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${agencies.bhutan.name}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${agencies.bhutan.tour}</p>
                        </div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 mb-4">${agencies.bhutan.description}</p>
                    <div class="flex gap-3">
                        <a href="${agencies.bhutan.url}" target="_blank" 
                           class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white radius-standard transition-standard text-sm">
                            Ver Tour
                        </a>
                        <span class="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 radius-standard text-sm font-medium">
                            ${agencies.bhutan.price}
                        </span>
                    </div>
                </div>
            </div>

            <div class="mt-8 bg-red-50 dark:bg-red-900/20 radius-card p-6 border border-red-200 dark:border-red-800">
                <h3 class="font-bold text-lg text-red-800 dark:text-red-200 mb-4 flex items-center gap-3">
                    <span class="material-symbols-outlined">emergency</span>
                    Información de Emergencia
                </h3>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-red-700 dark:text-red-300 mb-2">Contactos de Emergencia:</h4>
                        <ul class="space-y-1 text-red-600 dark:text-red-400">
                            <li>• Embajada España Nepal: +977 1 4371695</li>
                            <li>• Emergencias Nepal: 100 / 102</li>
                            <li>• WeRoad Emergencias: +39 02 87 22 88 00</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold text-red-700 dark:text-red-300 mb-2">Seguros Contratados:</h4>
                        <ul class="space-y-1 text-red-600 dark:text-red-400">
                            <li>• Seguro médico internacional</li>
                            <li>• Cobertura trekking hasta 5,500m</li>
                            <li>• Evacuación de emergencia incluida</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        Logger.success('✅ Agencies information rendered');
    }

    loadAccommodations() {
        Logger.ui('🏨 Rendering accommodations information');
        const accommodationsContent = document.getElementById('accommodations-content');
        if (!accommodationsContent) {
            Logger.warning('⚠️ Accommodations content container not found');
            return;
        }

        // Extraer información de alojamientos del tripConfig (sin inventar datos)
        const accommodationsByLocation = {};
        
        tripConfig.itineraryData.forEach(day => {
            if (day.accommodation && day.accommodation !== 'Vuelo nocturno') {
                const location = day.location || 'Ubicación no especificada';
                if (!accommodationsByLocation[location]) {
                    accommodationsByLocation[location] = [];
                }
                if (!accommodationsByLocation[location].includes(day.accommodation)) {
                    accommodationsByLocation[location].push(day.accommodation);
                }
            }
        });

        let accommodationsHTML = '<div class="space-y-4">';
        
        if (Object.keys(accommodationsByLocation).length === 0) {
            accommodationsHTML += `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-600 mb-4 block">hotel</span>
                    <p class="text-slate-500 dark:text-slate-400">Información de alojamientos incluida en el paquete de viaje</p>
                </div>
            `;
        } else {
            Object.entries(accommodationsByLocation).forEach(([location, hotels]) => {
                accommodationsHTML += `
                    <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                        <h4 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">location_on</span>
                            ${location}
                        </h4>
                        <div class="space-y-2">
                            ${hotels.map(hotel => `
                                <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <span class="material-symbols-outlined text-sm text-slate-500">hotel</span>
                                    <span>${hotel}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }
        
        accommodationsHTML += '</div>';
        accommodationsContent.innerHTML = accommodationsHTML;

        Logger.success('✅ Accommodations information rendered');
    }
}

export const planningRenderer = new PlanningRenderer();
