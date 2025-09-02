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
        packingCard.className = 'bg-white dark:bg-slate-800 radius-card shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-12';
        
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
        Logger.ui('🏨 Loading hotels information');
        
        const hotelsContent = document.getElementById('hotels-content');
        Logger.data('🔍 Hotels content element found:', !!hotelsContent);
        
        if (!hotelsContent) {
            Logger.error('❌ Hotels content container not found!');
            
            // Check what elements exist in the DOM
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                Logger.data('🔍 Main content HTML:', mainContent.innerHTML.substring(0, 500));
                const hotelElements = mainContent.querySelectorAll('[id*="hotel"]');
                Logger.data('🔍 Hotel-related elements found:', hotelElements.length);
            }
            return;
        }

        let hotelManager = stateManager.getHotelManager();
        Logger.data('🏨 HotelManager from state:', !!hotelManager);
        
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
            Logger.warning('⚠️ HotelManager not available - using tripConfig fallback');
            
            // Fallback to tripConfig data
            const accommodations = tripConfig.accommodations || [];
            
            // Extract all reservations from accommodations
            const allReservations = [];
            
            Logger.data(`🏨 Found ${accommodations.length} hotels in tripConfig`);
            
            accommodations.forEach(hotel => {
                Logger.data(`🏨 Processing hotel: ${hotel.name} (id: ${hotel.id})`);
                if (hotel.reservations && Array.isArray(hotel.reservations)) {
                    Logger.data(`📋 Hotel has ${hotel.reservations.length} reservations`);
                    hotel.reservations.forEach(reservation => {
                        allReservations.push({
                            ...reservation,
                            hotelId: hotel.id,
                            hotelName: hotel.name,
                            checkInDate: reservation.checkIn,
                            checkOutDate: reservation.checkOut
                        });
                    });
                } else {
                    Logger.warning(`⚠️ Hotel ${hotel.name} has no reservations array`);
                }
            });
            
            Logger.data(`📋 Fallback: Found ${allReservations.length} reservations in tripConfig`);
            Logger.data('🏨 Accommodations data:', accommodations);
            Logger.data('🔍 Sample reservation:', allReservations[0]);
            Logger.data('🎯 About to render to element:', hotelsContent.id);
            
            // Always render, even if no reservations to show the structure
            this.renderAccommodationsFromTripConfig(hotelsContent, allReservations, accommodations);
            
            // Verify rendering worked
            setTimeout(() => {
                Logger.data('🔄 Post-render check - innerHTML length:', hotelsContent.innerHTML.length);
                Logger.data('🔄 Post-render preview:', hotelsContent.innerHTML.substring(0, 200));
            }, 50);
            
            return;
        }

        const reservations = hotelManager.getAllReservations();
        const stats = hotelManager.getHotelStats();
        
        // Debug logging
        Logger.data(`🏨 HotelManager found. Reservations: ${reservations.length}`);
        Logger.data('📊 Hotel stats:', stats);
        Logger.data('🔍 Sample reservation data:', reservations[0]);
        Logger.data('🏨 Hotels available in manager:', hotelManager.getAllHotels().length);
        
        // Debug the hotel lookup for each reservation
        reservations.forEach((reservation, index) => {
            const hotel = hotelManager.getHotel(reservation.hotelId);
            Logger.data(`🔍 Reservation ${index} hotel lookup:`, {
                hotelId: reservation.hotelId,
                hotelFound: !!hotel,
                hotelName: hotel?.name || 'NOT FOUND'
            });
        });
        
        if (reservations.length === 0) {
            Logger.warning('⚠️ No reservations found in HotelManager');
            hotelsContent.innerHTML = `
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-12">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">hotel</span>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Alojamientos</h2>
                        </div>
                    </div>
                    <p class="text-slate-600 dark:text-slate-400">No hay reservas disponibles en HotelManager.</p>
                </div>
            `;
            return;
        }

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
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">hotel</span>
                            <div>
                                <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">${stats.totalNights}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">Noches totales</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">payments</span>
                            <div>
                                <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">$${stats.totalCost}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">Costo total</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
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
                        
                        // If hotel not found by hotelId, try to find by other means
                        let actualHotel = hotel;
                        if (!hotel) {
                            // Try to find hotel by reservation properties
                            const allHotels = hotelManager.getAllHotels();
                            actualHotel = allHotels.find(h => 
                                h.name === reservation.hotelName || 
                                h.id === reservation.hotel_id ||
                                (reservation.hotel && h.name === reservation.hotel)
                            );
                            
                            // If still not found, get hotel data from tripConfig accommodations
                            if (!actualHotel) {
                                // Find the accommodation that contains this reservation
                                const accommodation = tripConfig.accommodations?.find(acc => 
                                    acc.reservations?.some(res => res.id === reservation.id)
                                );
                                
                                if (accommodation) {
                                    actualHotel = {
                                        id: accommodation.id,
                                        name: accommodation.name,
                                        location: accommodation.location,
                                        country: accommodation.country,
                                        description: accommodation.description,
                                        images: accommodation.images || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80']
                                    };
                                } else {
                                    // Ultimate fallback
                                    actualHotel = {
                                        id: `hotel-${reservation.id}`,
                                        name: 'Hotel confirmado',
                                        location: 'Ubicación por confirmar',
                                        country: 'Nepal',
                                        description: 'Alojamiento confirmado para el viaje',
                                        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80']
                                    };
                                }
                            }
                        }
                        
                        if (!actualHotel) {
                            Logger.warning(`Skipping reservation without hotel data:`, reservation);
                            return '';
                        }
                        
                        return `
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" 
                                 onclick="window.showHotelReservationModal('${reservation.id}', '${actualHotel.id}')">
                                <div class="flex items-start gap-4">
                                    <img src="${actualHotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                                         alt="${actualHotel.name}" 
                                         class="w-16 h-16 rounded-lg object-cover">
                                    <div class="flex-1">
                                        <div class="flex items-start justify-between">
                                            <div>
                                                <h3 class="font-semibold text-slate-900 dark:text-white">${actualHotel.name}</h3>
                                                <p class="text-sm text-slate-600 dark:text-slate-400">${actualHotel.location}, ${actualHotel.country}</p>
                                                <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">${actualHotel.description}</p>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-lg font-bold text-slate-900 dark:text-white">$${reservation.totalCost || reservation.cost || reservation.price || '0'}</div>
                                                <div class="text-sm text-slate-600 dark:text-slate-400">${reservation.nights || reservation.duration || '1'} noches</div>
                                            </div>
                                        </div>
                                        <div class="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-sm">calendar_today</span>
                                                ${new Date(reservation.checkInDate || reservation.checkIn).toLocaleDateString('es-ES')} - ${new Date(reservation.checkOutDate || reservation.checkOut).toLocaleDateString('es-ES')}
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-sm">confirmation_number</span>
                                                ${reservation.confirmationCode || reservation.confirmation || 'N/A'}
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-sm">bed</span>
                                                ${reservation.roomType || reservation.room || 'Habitación estándar'}
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
        
        // Expose hotel reservation modal function globally
        window.showHotelReservationModal = this.showHotelReservationModal.bind(this);
        
        // Debug logging - verify rendering
        setTimeout(() => {
            Logger.data('🔄 Post-render verification:');
            Logger.data('  - Element exists:', !!hotelsContent);
            Logger.data('  - innerHTML length:', hotelsContent.innerHTML.length);
            Logger.data('  - Visible in DOM:', hotelsContent.offsetHeight > 0);
            Logger.data('  - Parent element:', hotelsContent.parentElement?.tagName);
            Logger.data('  - Display style:', window.getComputedStyle(hotelsContent).display);
            Logger.data('  - Visibility style:', window.getComputedStyle(hotelsContent).visibility);
            
            // Check if reservations are actually rendered
            const reservationCards = hotelsContent.querySelectorAll('.bg-slate-50');
            Logger.data('  - Reservation cards found:', reservationCards.length);
            
            // Also check for the reservations container
            const reservationsContainer = hotelsContent.querySelector('.space-y-4');
            Logger.data('  - Reservations container found:', !!reservationsContainer);
            
            if (reservationsContainer) {
                Logger.data('  - Reservations container innerHTML length:', reservationsContainer.innerHTML.length);
                Logger.data('  - Reservations container children:', reservationsContainer.children.length);
                Logger.data('  - Reservations container preview:', reservationsContainer.innerHTML.substring(0, 300));
            }
            
            if (reservationCards.length === 0) {
                Logger.error('❌ No reservation cards found in DOM despite successful rendering!');
                Logger.data('🔍 Full HTML content:', hotelsContent.innerHTML);
                
                // Check what's actually in the reservations map
                Logger.data('🔍 Checking reservations.map result...');
                const testReservations = hotelManager.getAllReservations();
                Logger.data('  - Reservations array:', testReservations);
                
                testReservations.forEach((reservation, index) => {
                    const hotel = hotelManager.getHotel(reservation.hotelId);
                    Logger.data(`  - Reservation ${index}:`, {
                        reservation,
                        hotel: hotel ? hotel.name : 'NOT FOUND',
                        hotelId: reservation.hotelId,
                        reservationKeys: Object.keys(reservation),
                        hotelName: reservation.hotelName,
                        hotel_id: reservation.hotel_id,
                        hotel: reservation.hotel
                    });
                });
                
                // Check available hotels in manager
                const allHotels = hotelManager.getAllHotels();
                Logger.data('  - Available hotels in manager:', allHotels.map(h => ({ id: h.id, name: h.name })));
                
                // Test the map function directly
                Logger.data('  - Testing reservations.map directly...');
                const mapResult = testReservations.map((reservation, index) => {
                    Logger.data(`    Processing reservation ${index}:`, reservation);
                    const hotel = hotelManager.getHotel(reservation.hotelId);
                    
                    // Try fallback logic
                    let actualHotel = hotel;
                    if (!hotel) {
                        const allHotels = hotelManager.getAllHotels();
                        actualHotel = allHotels.find(h => 
                            h.name === reservation.hotelName || 
                            h.id === reservation.hotel_id ||
                            (reservation.hotel && h.name === reservation.hotel)
                        );
                        Logger.data(`    Fallback search result:`, actualHotel ? actualHotel.name : 'STILL NOT FOUND');
                        
                        if (!actualHotel) {
                            // Get hotel data from tripConfig accommodations
                            const accommodation = testReservations.length > 0 ? 
                                tripConfig.accommodations?.find(acc => 
                                    acc.reservations?.some(res => res.id === reservation.id)
                                ) : null;
                            
                            if (accommodation) {
                                actualHotel = {
                                    id: accommodation.id,
                                    name: accommodation.name,
                                    location: accommodation.location,
                                    country: accommodation.country,
                                    description: accommodation.description,
                                    images: accommodation.images || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80']
                                };
                                Logger.data(`    Found accommodation data:`, actualHotel.name);
                            } else {
                                actualHotel = {
                                    id: `hotel-${reservation.id}`,
                                    name: 'Hotel confirmado',
                                    location: 'Ubicación por confirmar',
                                    country: 'Nepal',
                                    description: 'Alojamiento confirmado para el viaje',
                                    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80']
                                };
                                Logger.data(`    Created fallback hotel:`, actualHotel.name);
                            }
                        }
                    }
                    
                    if (!actualHotel) {
                        Logger.warning(`    Skipping reservation ${index} - no hotel data`);
                        return '';
                    }
                    
                    Logger.data(`    Will render card for hotel:`, actualHotel.name);
                    return 'CARD_PLACEHOLDER';
                });
                Logger.data('  - Map result:', mapResult);
                Logger.data('  - Non-empty results:', mapResult.filter(r => r !== '').length);
            } else {
                Logger.success(`✅ ${reservationCards.length} reservation cards successfully rendered and visible`);
            }
        }, 100);
        if (Logger && Logger.info) {
            Logger.info(`Hotels loaded: ${reservations.length} reservations found`);
            Logger.info('Hotel stats:', stats);
        }
    }

    showHotelReservationModal(reservationId, hotelId) {
        Logger.ui(`🏨 Opening hotel reservation modal for ${reservationId}`);
        
        // Find the reservation and hotel data
        const accommodation = tripConfig.accommodations?.find(acc => 
            acc.reservations?.some(res => res.id === reservationId)
        );
        
        if (!accommodation) {
            Logger.error('Accommodation not found for reservation:', reservationId);
            return;
        }
        
        const reservation = accommodation.reservations.find(res => res.id === reservationId);
        if (!reservation) {
            Logger.error('Reservation not found:', reservationId);
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="hotel-reservation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <!-- Header -->
                    <div class="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-xl">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <img src="${accommodation.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                                     alt="${accommodation.name}" 
                                     class="w-16 h-16 rounded-lg object-cover">
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
                                        <span class="material-symbols-outlined text-blue-600 text-sm">confirmation_number</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Código de Confirmación</p>
                                            <p class="font-medium text-slate-900 dark:text-white font-mono">${reservation.confirmationCode}</p>
                                        </div>
                                    </div>
                                    
                                    ${reservation.pinCode ? `
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-red-600 text-sm">pin</span>
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
                                    <span class="material-symbols-outlined text-green-600">payments</span>
                                    Información de Costos
                                </h3>
                                
                                <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4 space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Costo Total</span>
                                        <span class="font-bold text-lg text-slate-900 dark:text-white">€${reservation.totalCost}</span>
                                    </div>
                                    
                                    ${reservation.shared ? `
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-600 dark:text-slate-400">Mi Parte</span>
                                        <span class="font-bold text-lg text-green-600">€${reservation.myCost}</span>
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
                                        <span class="text-slate-900 dark:text-white">€${accommodation.pricePerNight}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Hotel Information -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-purple-600">hotel</span>
                                Información del Hotel
                            </h3>
                            
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                                <p class="text-slate-700 dark:text-slate-300 mb-4">${accommodation.description}</p>
                                
                                ${accommodation.contact ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${accommodation.contact.phone ? `
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-blue-600">phone</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400">Teléfono</p>
                                            <a href="tel:${accommodation.contact.phone}" class="font-medium text-blue-600 hover:text-blue-700">${accommodation.contact.phone}</a>
                                        </div>
                                    </div>
                                    ` : ''}
                                    
                                    ${accommodation.contact.bookingUrl ? `
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-green-600">link</span>
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
                                <span class="material-symbols-outlined text-red-600">location_on</span>
                                Ubicación
                            </h3>
                            
                            <div class="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                                <div id="hotel-map" class="w-full h-64 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                    <div class="text-center">
                                        <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">map</span>
                                        <p class="text-slate-600 dark:text-slate-400">Mapa cargando...</p>
                                        <p class="text-sm text-slate-500 mt-1">Lat: ${accommodation.coordinates[0]}, Lng: ${accommodation.coordinates[1]}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${reservation.specialRequests ? `
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-orange-600">note</span>
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
                                <span class="material-symbols-outlined text-green-600">check_circle</span>
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
        
        // Initialize map if coordinates are available
        if (accommodation.coordinates) {
            setTimeout(() => {
                this.initializeHotelMap(accommodation.coordinates, accommodation.name);
            }, 100);
        }
        
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
    
    initializeHotelMap(coordinates, hotelName) {
        const mapContainer = document.getElementById('hotel-map');
        if (!mapContainer) return;
        
        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            // Fallback if Leaflet is not loaded
            mapContainer.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg flex flex-col items-center justify-center">
                    <span class="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400 mb-2">location_on</span>
                    <h4 class="font-semibold text-slate-900 dark:text-white">${hotelName}</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400">Lat: ${coordinates[0]}, Lng: ${coordinates[1]}</p>
                    <p class="text-xs text-slate-500 mt-2">Mapa no disponible</p>
                </div>
            `;
            return;
        }
        
        // Clear container and create Leaflet map
        mapContainer.innerHTML = '';
        
        try {
            const map = L.map('hotel-map', {
                center: [coordinates[0], coordinates[1]],
                zoom: 15,
                zoomControl: true,
                scrollWheelZoom: false
            });
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            
            // Add marker for hotel
            const marker = L.marker([coordinates[0], coordinates[1]])
                .addTo(map)
                .bindPopup(`
                    <div class="text-center">
                        <h4 class="font-semibold text-slate-900 mb-1">${hotelName}</h4>
                        <p class="text-sm text-slate-600">Lat: ${coordinates[0]}</p>
                        <p class="text-sm text-slate-600">Lng: ${coordinates[1]}</p>
                    </div>
                `)
                .openPopup();
                
            // Fit map to marker with some padding
            setTimeout(() => {
                map.invalidateSize();
                map.setView([coordinates[0], coordinates[1]], 15);
            }, 100);
            
        } catch (error) {
            Logger.error('Error initializing hotel map:', error);
            // Fallback on error
            mapContainer.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg flex flex-col items-center justify-center">
                    <span class="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400 mb-2">location_on</span>
                    <h4 class="font-semibold text-slate-900 dark:text-white">${hotelName}</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400">Lat: ${coordinates[0]}, Lng: ${coordinates[1]}</p>
                    <p class="text-xs text-slate-500 mt-2">Error cargando mapa</p>
                </div>
            `;
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

        const agencies = tripConfig.services?.agencies || [];
        
        // Generate cards dynamically based on available agencies
        const agencyCards = [];
        
        // Process each agency
        agencies.forEach((agency) => {
            if (!agency) return;
            
            let cardHTML = '';
            
            if (agency.type === 'emergency') {
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
        const self = this;
        window.openHotelModal = function(reservationId) {
            console.log('Opening modal for reservation:', reservationId);
            const reservation = reservations.find(r => r.id === reservationId);
            const hotel = hotels.find(h => h.id === reservation?.hotelId);
            console.log('Found reservation:', reservation);
            console.log('Found hotel:', hotel);
            if (reservation && hotel) {
                self.showHotelModal(reservation, hotel);
            } else {
                console.error('Could not find reservation or hotel data');
            }
        };

        Logger.success(`✅ ${reservations.length} hotel reservations rendered with global onclick handlers`);
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
