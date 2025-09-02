import Logger from '../../utils/Logger.js';
import { getPackingCategoryIcon } from '../../utils/CategoryUtils.js';
import { tripConfig } from '../../config/tripConfig.js';
import { CARD_STYLES } from '../../config/DesignTokens.js';
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
                
                <div id="planning-content" style="display: none;">
                    <!-- Container for packing list metrics updates -->
                </div>

                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 p-6 mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">business</span>
                        Agencias de Viaje
                    </h2>
                    <div id="agencies-content"></div>
                </div>

                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">hotel</span>
                        Alojamientos
                    </h2>
                    <div id="accommodations-content">
                        <p class="text-slate-600 dark:text-slate-400">Cargando información de alojamientos...</p>
                    </div>
                </div>
            </div>
        `;

        await this.loadPlanningContent();
    }

    async loadPlanningContent() {
        await this.loadBudgetManager();
        await this.loadPackingList();
        this.loadServices();
        await this.loadAccommodations();
    }

    async loadBudgetManager() {
        try {
            const budgetContainer = document.getElementById('budget-container');
            if (!budgetContainer) {
                Logger.warning('⚠️ Budget container not found');
                return;
            }

            // Get or create BudgetManager instance and force render
            const { BudgetManager } = await import('../BudgetManager.js');
            const budgetManager = new BudgetManager(budgetContainer);
            
            Logger.debug('💰 BudgetManager instance obtained for rendering');
            Logger.debug('💰 About to call budgetManager.render()');
            
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
                Logger.error('PackingListManager not available');
                return;
            }
        }

        // Cargar datos usando solo PackingListManager
        await packingManager.initialize(stateManager.getFirebaseManager());
        const saved = packingManager.getItems();
        
        Logger.debug('🎯 Starting packing list rendering...');
        Logger.debug('📦 Categories to render:', Object.keys(tripConfig.packingListData).length);
        Logger.debug('💾 Saved items loaded:', Object.keys(saved).length);

        // Calcular estadísticas usando PackingListManager
        const totalItems = Object.values(tripConfig.packingListData).reduce((sum, items) => sum + items.length, 0);
        const stats = packingManager.getPackingStats(totalItems);

        // UI consistente con el estilo de la app (sin gradientes)
        const categoriesHTML = Object.entries(tripConfig.packingListData).map(([category, items]) => {
            const categoryIcon = getPackingCategoryIcon(category);
            const cleanCategoryName = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            
            // Calcular estadísticas de la categoría usando solo tripConfig.key
            const categoryPacked = items.filter(item => {
                const itemKey = item.key;
                return saved[itemKey] || false;
            }).length;
            const categoryTotal = items.length;
            const categoryPercentage = categoryTotal > 0 ? Math.round((categoryPacked / categoryTotal) * 100) : 0;
            
            
            return `
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                    <div class="category-header p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" 
                         data-category="${category}">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">${categoryIcon}</span>
                            <div class="flex-1">
                                <div class="text-xl font-bold text-slate-900 dark:text-slate-100 category-percentage">${categoryPercentage}%</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">${cleanCategoryName}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="text-right">
                                    <div class="text-sm text-slate-600 dark:text-slate-400 category-items-count">${categoryPacked}/${categoryTotal}</div>
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
                                const itemText = item.item || item.name || 'Item desconocido';
                                const itemKey = item.key;
                                const isChecked = saved[itemKey] || false;
                                
                                return `
                                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                                        <input type="checkbox" ${isChecked ? 'checked' : ''} 
                                               data-item-key="${itemKey}"
                                               data-category="${category}"
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                                        <span class="flex-1 text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through opacity-60' : ''}">${itemText}</span>
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
        packingCard.className = 'bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 mb-6';
        
        packingCard.innerHTML = `
            <div class="p-6">
                <div class="flex items-center gap-4 mb-6">
                    <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">luggage</span>
                    <div class="flex-1">
                        <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Lista de Equipaje</h3>
                        <p class="text-slate-600 dark:text-slate-400">Organiza tu equipaje por categorías</p>
                    </div>
                </div>
                
                <!-- Progress Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="${CARD_STYLES.SUMMARY}">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">inventory</span>
                            <div>
                                <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Items empacados</p>
                                <p class="text-2xl font-bold text-slate-900 dark:text-white" id="packed-count">${stats.packed}/${stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div class="${CARD_STYLES.SUMMARY}">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">trending_up</span>
                            <div>
                                <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Progreso</p>
                                <p class="text-2xl font-bold text-slate-900 dark:text-white" id="progress-percent">${stats.percentage}%</p>
                            </div>
                        </div>
                    </div>
                    <div class="${CARD_STYLES.SUMMARY}">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-3xl">scale</span>
                            <div>
                                <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Peso Total</p>
                                <p class="text-2xl font-bold text-slate-900 dark:text-white" id="total-weight">${stats.weight && stats.weight.totalGrams && !isNaN(stats.weight.totalGrams) ? (stats.weight.totalGrams / 1000).toFixed(1) : '0.0'}kg</p>
                            </div>
                        </div>
                    </div>
                
                <!-- Categories -->
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

        // Event listener para checkboxes - solo usar PackingListManager
        container.addEventListener('change', async (e) => {
            if (e.target.type === 'checkbox' && e.target.hasAttribute('data-item-key')) {
                const itemKey = e.target.getAttribute('data-item-key');
                const isChecked = e.target.checked;
                
                Logger.debug(`🎒 Toggling item: ${itemKey} = ${isChecked}`);
                
                try {
                    // Solo usar PackingListManager para toda la lógica
                    const success = await packingManager.toggleItem(itemKey, isChecked);
                    
                    if (!success) {
                        // Revertir checkbox si falló
                        e.target.checked = !isChecked;
                    } else {
                        // NO llamar updateGlobalStats - PackingListManager ya actualiza las métricas
                        // Solo actualizar estado visual del checkbox
                        this.updateItemVisual(e.target, isChecked);
                    }
                    
                } catch (error) {
                    Logger.error('Error syncing item:', error);
                    e.target.checked = !isChecked;
                }
            }
        });

        // Función para actualizar UI después de cambios - delegada a PackingListManager
        window.updatePackingUI = async () => {
            // Re-renderizar la sección completa para mantener consistencia
            const planningContainer = document.querySelector('#planning-content');
            if (planningContainer) {
                await PlanningRenderer.renderPackingList(planningContainer);
            }
        };

        Logger.success('✅ Packing list rendered with Firebase integration');
    }


    loadServices() {
        Logger.ui('🛠️ Loading services information');
        const agenciesContent = document.getElementById('agencies-content');
        if (!agenciesContent) {
            Logger.warning('⚠️ Services content container not found');
            return;
        }

        const services = tripConfig.services || {};
        const agencies = services.agencies || [];
        const insurance = services.insurance || {};
        const emergency = services.emergency || {};

        Logger.data(`🛠️ Found services: ${agencies.length} agencies, insurance, emergency`);

        let servicesHTML = '<div class="space-y-6">';

        // Agencies Section
        if (agencies.length > 0) {
            servicesHTML += `
                <div>
                    <h4 class="text-md font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-orange-600 dark:text-orange-400" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">business</span>
                        Tours y Actividades
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            `;

            agencies.forEach(agency => {
                servicesHTML += `
                    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-xl transition-shadow">
                        <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-2xl ${agency.color || 'text-orange-600 dark:text-orange-400'}" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">${agency.icon || 'business'}</span>
                            <div class="flex-1">
                                <h5 class="font-semibold text-slate-900 dark:text-white">${agency.name}</h5>
                                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${agency.tour || agency.type}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-500 mt-2">${agency.description}</p>
                                
                                <div class="mt-3 flex items-center justify-between">
                                    <span class="text-lg font-bold text-green-600 dark:text-green-400">${agency.price}</span>
                                    ${agency.url ? `
                                        <a href="${agency.url}" target="_blank" 
                                           class="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                                            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">open_in_new</span>
                                            Ver Tour
                                        </a>
                                    ` : ''}
                                </div>
                                
                                ${agency.contact ? `
                                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">contact_mail</span>
                                        ${agency.contact}
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            servicesHTML += `
                    </div>
                </div>
            `;
        }

        // Create a grid for insurance and emergency info if both exist
        const hasInsurance = insurance.name;
        const hasEmergency = emergency.name;
        
        if (hasInsurance || hasEmergency) {
            servicesHTML += `
                <div>
                    <h4 class="text-md font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">info</span>
                        Información Importante
                    </h4>
                    <div class="grid grid-cols-1 ${hasInsurance && hasEmergency ? 'md:grid-cols-2' : ''} gap-4">
            `;

            // Insurance Section
            if (hasInsurance) {
                servicesHTML += `
                    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="material-symbols-outlined text-xl ${insurance.color || 'text-purple-600 dark:text-purple-400'}" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">${insurance.icon || 'security'}</span>
                            <h5 class="font-semibold text-slate-900 dark:text-white">${insurance.name}</h5>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400">${insurance.description}</p>
                        ${insurance.status ? `
                            <span class="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">schedule</span>
                                ${insurance.status === 'pending' ? 'Pendiente' : insurance.status}
                            </span>
                        ` : ''}
                    </div>
                `;
            }

            // Emergency Section
            if (hasEmergency) {
                servicesHTML += `
                    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="material-symbols-outlined text-xl ${emergency.color || 'text-red-600 dark:text-red-400'}" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">${emergency.icon || 'emergency'}</span>
                            <h5 class="font-semibold text-slate-900 dark:text-white">${emergency.name}</h5>
                        </div>
                        <div class="space-y-2">
                            ${emergency.embassy ? `
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">account_balance</span>
                                    <span class="text-sm text-slate-600 dark:text-slate-400">${emergency.embassy}</span>
                                </div>
                            ` : ''}
                            
                            ${emergency.hospital ? `
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-green-600 dark:text-green-400" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">local_hospital</span>
                                    <span class="text-sm text-slate-600 dark:text-slate-400">${emergency.hospital}</span>
                                </div>
                            ` : ''}
                            
                            ${emergency.timezone ? `
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-purple-600 dark:text-purple-400" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">schedule</span>
                                    <span class="text-sm text-slate-600 dark:text-slate-400">${emergency.timezone}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            servicesHTML += `
                    </div>
                </div>
            `;
        }

        servicesHTML += '</div>';

        if (agencies.length === 0 && !insurance.name && !emergency.name) {
            servicesHTML = `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">miscellaneous_services</span>
                    <p class="text-slate-600 dark:text-slate-400">No hay servicios disponibles</p>
                </div>
            `;
        }

        agenciesContent.innerHTML = servicesHTML;
        Logger.success(`✅ Services rendered: ${agencies.length} agencies + insurance + emergency info`);
    }

    loadAccommodations() {
        const accommodationsContent = document.getElementById('accommodations-content');
        if (!accommodationsContent) return;

        // Use accommodations data from tripConfig
        const accommodations = tripConfig.accommodations || [];
        
        if (accommodations.length === 0) {
            accommodationsContent.innerHTML = `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">hotel</span>
                    <p class="text-slate-600 dark:text-slate-400">No hay alojamientos disponibles</p>
                </div>
            `;
            return;
        }

        // Calculate accommodation statistics
        let totalCost = 0;
        let totalNights = 0;
        let totalReservations = 0;

        accommodations.forEach(accommodation => {
            if (accommodation.reservations) {
                accommodation.reservations.forEach(reservation => {
                    totalCost += reservation.myCost || reservation.totalCost;
                    totalNights += reservation.nights;
                    totalReservations++;
                });
            }
        });

        // Calculate average cost per night
        const avgCostPerNight = totalNights > 0 ? Math.round((totalCost / totalNights) * 100) / 100 : 0;

        // Generate summary cards with budget card styling
        let accommodationsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-slate-50 dark:bg-slate-700/30 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">payments</span>
                        <div>
                            <div class="text-2xl font-bold text-slate-900 dark:text-white">${totalCost}€</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Costo Total</div>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700/30 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-3xl text-green-600 dark:text-green-400" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">hotel</span>
                        <div>
                            <div class="text-2xl font-bold text-slate-900 dark:text-white">${avgCostPerNight}€</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Costo por Noche</div>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700/30 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">business</span>
                        <div>
                            <div class="text-2xl font-bold text-slate-900 dark:text-white">${accommodations.length}</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Hoteles</div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Reservas de Alojamiento</h3>
        `;

        // Collect all reservations from all accommodations
        let allReservations = [];
        accommodations.forEach(accommodation => {
            if (accommodation.reservations) {
                accommodation.reservations.forEach(reservation => {
                    allReservations.push({
                        ...reservation,
                        accommodation: accommodation
                    });
                });
            }
        });

        // Sort reservations by check-in date
        const sortedReservations = allReservations.sort((a, b) => {
            return new Date(a.checkIn) - new Date(b.checkIn);
        });
        
        accommodationsHTML += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        
        sortedReservations.forEach(reservation => {
            const accommodation = reservation.accommodation;
            
            // Format dates
            const checkIn = new Date(reservation.checkIn).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit'
            });
            const checkOut = new Date(reservation.checkOut).toLocaleDateString('es-ES', {
                day: '2-digit', 
                month: '2-digit'
            });
            
            accommodationsHTML += `
                <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-xl transition-shadow cursor-pointer" 
                     onclick="window.openHotelModal('${reservation.id}')">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            ${accommodation.images?.[0] ? `
                                <img src="${accommodation.images[0]}" 
                                     alt="${accommodation.name}" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\"material-symbols-outlined text-slate-400 text-xl\" style=\"font-variation-settings: \'FILL\' 0, \'wght\' 400, \'GRAD\' 0, \'opsz\' 24;\">hotel</span>';">
                            ` : `
                                <span class="material-symbols-outlined text-slate-400 text-xl" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">hotel</span>
                            `}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-semibold text-slate-900 dark:text-white text-sm">${accommodation.name}</h3>
                                    <p class="text-xs text-slate-600 dark:text-slate-400">${accommodation.location}, ${accommodation.country}</p>
                                    <p class="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-1">${accommodation.description}</p>
                                </div>
                                <div class="text-right ml-3">
                                    <div class="text-lg font-bold text-slate-900 dark:text-white">${reservation.myCost || reservation.totalCost}€</div>
                                    <div class="text-xs text-slate-600 dark:text-slate-400">${reservation.nights} noche${reservation.nights > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <span class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">calendar_today</span>
                                    ${checkIn} - ${checkOut}
                                </span>
                                <span class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">confirmation_number</span>
                                    ${reservation.confirmationCode}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        accommodationsHTML += '</div>';
        accommodationsContent.innerHTML = accommodationsHTML;

        // Set up global modal function
        const self = this;
        window.openHotelModal = function(reservationId) {
            console.log('Opening modal for reservation:', reservationId);
            const reservation = allReservations.find(r => r.id === reservationId);
            console.log('Found reservation:', reservation);
            if (reservation) {
                self.showHotelModal(reservation, reservation.accommodation);
            } else {
                console.error('Could not find reservation data');
            }
        };

        Logger.success(`✅ ${sortedReservations.length} hotel reservations rendered with global onclick handlers`);
    }

    showHotelModal(reservation, accommodation) {
        Logger.ui(`🏨 Opening hotel reservation modal for ${reservation.id}`);
        
        // Create modal HTML
        const modalHTML = `
            <div id="hotel-reservation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <!-- Header -->
                    <div class="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-xl">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                    <img src="${accommodation.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                                         alt="${accommodation.name}" 
                                         class="w-full h-full object-cover"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <span class="material-symbols-outlined text-slate-400 text-2xl hidden" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">hotel</span>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${accommodation.name}</h2>
                                    <p class="text-slate-600 dark:text-slate-400">${accommodation.location}, ${accommodation.country}</p>
                                </div>
                            </div>
                            <button onclick="window.closeHotelReservationModal()" 
                                    class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div class="p-6 space-y-6">
                        <!-- Reservation Details -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span class="material-symbols-outlined text-blue-600">event</span>
                                    Detalles de la Reserva
                                </h3>
                                
                                <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4 space-y-3">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-green-600 text-sm">calendar_today</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Check-in / Check-out</p>
                                            <p class="font-medium text-slate-900 dark:text-white">
                                                ${new Date(reservation.checkIn).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p class="font-medium text-slate-900 dark:text-white">
                                                ${new Date(reservation.checkOut).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-purple-600 text-sm">bed</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Habitación</p>
                                            <p class="font-medium text-slate-900 dark:text-white">${reservation.roomType}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-orange-600 text-sm">group</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Huéspedes</p>
                                            <p class="font-medium text-slate-900 dark:text-white">${reservation.guests} personas</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-blue-600 text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">confirmation_number</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Código de Confirmación</p>
                                            <p class="font-medium text-slate-900 dark:text-white font-mono">${reservation.confirmationCode}</p>
                                        </div>
                                    </div>
                                    
                                    ${reservation.pinCode ? `
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-red-600 text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">pin</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">PIN de Acceso</p>
                                            <p class="font-medium text-slate-900 dark:text-white font-mono">${reservation.pinCode}</p>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span class="material-symbols-outlined text-green-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">payments</span>
                                    Información de Costos
                                </h3>
                                
                                <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4 space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Costo Total</span>
                                        <span class="font-bold text-lg text-slate-900 dark:text-white">${reservation.totalCost}€</span>
                                    </div>
                                    
                                    ${reservation.shared ? `
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Mi Parte</span>
                                        <span class="font-bold text-lg text-green-600">${reservation.myCost}€</span>
                                    </div>
                                    
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Compartido entre</span>
                                        <span class="text-slate-900 dark:text-white">${reservation.splitBetween} personas</span>
                                    </div>
                                    ` : ''}
                                    
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Noches</span>
                                        <span class="text-slate-900 dark:text-white">${reservation.nights}</span>
                                    </div>
                                    
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Precio por noche</span>
                                        <span class="text-slate-900 dark:text-white">${accommodation.pricePerNight}€</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Hotel Information -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-purple-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">hotel</span>
                                Información del Hotel
                            </h3>
                            
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                                <p class="text-slate-700 dark:text-slate-300 mb-4">${accommodation.description}</p>
                                
                                ${accommodation.contact ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${accommodation.contact.phone ? `
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-blue-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">phone</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Teléfono</p>
                                            <a href="tel:${accommodation.contact.phone}" class="font-medium text-blue-600 hover:text-blue-700">${accommodation.contact.phone}</a>
                                        </div>
                                    </div>
                                    ` : ''}
                                    
                                    ${accommodation.contact.bookingUrl ? `
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-green-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">link</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Booking</p>
                                            <a href="${accommodation.contact.bookingUrl}" target="_blank" class="font-medium text-green-600 hover:text-green-700">Ver en Booking.com</a>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Map -->
                        ${accommodation.coordinates ? `
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-red-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">location_on</span>
                                Ubicación
                            </h3>
                            
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                                <iframe 
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=${accommodation.coordinates[1] - 0.01},${accommodation.coordinates[0] - 0.01},${accommodation.coordinates[1] + 0.01},${accommodation.coordinates[0] + 0.01}&layer=mapnik&marker=${accommodation.coordinates[0]},${accommodation.coordinates[1]}"
                                    width="100%" 
                                    height="256" 
                                    style="border: none; border-radius: 0.5rem;"
                                    loading="lazy"
                                    title="Mapa de ${accommodation.name}">
                                </iframe>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${reservation.specialRequests ? `
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-orange-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">note</span>
                                Solicitudes Especiales
                            </h3>
                            
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                                <p class="text-slate-700 dark:text-slate-300">${reservation.specialRequests}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Footer -->
                    <div class="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 rounded-b-xl">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <span class="material-symbols-outlined text-green-600" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">check_circle</span>
                                Estado: ${reservation.status === 'confirmed' ? 'Confirmado' : reservation.status}
                            </div>
                            
                            <button onclick="window.closeHotelReservationModal()" 
                                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add close functionality
        window.closeHotelReservationModal = () => {
            const modal = document.getElementById('hotel-reservation-modal');
            if (modal) {
                modal.remove();
            }
        };
        
        // Close on backdrop click
        document.getElementById('hotel-reservation-modal').addEventListener('click', (e) => {
            if (e.target.id === 'hotel-reservation-modal') {
                window.closeHotelReservationModal();
            }
        });
    }

    updateItemVisual(checkbox, isChecked) {
        const label = checkbox.closest('label');
        const textSpan = label.querySelector('span:not(.material-symbols-outlined)');
        const checkIcon = label.querySelector('.material-symbols-outlined');
        
        if (isChecked) {
            textSpan.classList.add('line-through', 'opacity-60');
            if (!checkIcon) {
                label.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined text-green-600 text-lg">check</span>');
            }
        } else {
            textSpan.classList.remove('line-through', 'opacity-60');
            if (checkIcon) {
                checkIcon.remove();
            }
        }
    }

    updateCategoryStats(category, container) {
        const categoryHeader = container.querySelector(`[data-category="${category}"]`);
        if (!categoryHeader) return;
        
        const categoryContent = categoryHeader.nextElementSibling;
        const checkboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
        const checkedBoxes = categoryContent.querySelectorAll('input[type="checkbox"]:checked');
        
        const percentage = checkboxes.length > 0 ? Math.round((checkedBoxes.length / checkboxes.length) * 100) : 0;
        
        categoryHeader.querySelector('.category-percentage').textContent = `${percentage}%`;
        categoryHeader.querySelector('.category-items-count').textContent = `${checkedBoxes.length}/${checkboxes.length}`;
    }

    updateGlobalStats(container) {
        const allCheckboxes = container.querySelectorAll('input[type="checkbox"]');
        const allChecked = container.querySelectorAll('input[type="checkbox"]:checked');
        
        const globalProgress = container.querySelector('#global-progress');
        const packedCount = container.querySelector('#packed-count');
        const progressPercent = container.querySelector('#progress-percent');
        const totalWeight = container.querySelector('#total-weight');
        
        const percentage = allCheckboxes.length > 0 ? Math.round((allChecked.length / allCheckboxes.length) * 100) : 0;
        
        if (globalProgress) globalProgress.textContent = `${allChecked.length}/${allCheckboxes.length}`;
        if (packedCount) packedCount.textContent = `${allChecked.length}/${allCheckboxes.length}`;
        if (progressPercent) progressPercent.textContent = `${percentage}%`;
        if (totalWeight) {
            // Usar la lógica del WeightEstimator para cálculo preciso
            const packingManager = window.packingManager;
            if (packingManager && packingManager.localCache && window.weightEstimator) {
                const weightData = window.weightEstimator.calculateTotalWeight(packingManager.localCache);
                totalWeight.textContent = weightData.totalFormatted || "0kg";
            } else {
                totalWeight.textContent = "0.0kg";
            }
        }
    }
}

export const planningRenderer = new PlanningRenderer();
