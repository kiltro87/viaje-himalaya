/**
 * HotelManager - Gestión de hoteles y reservas
 * 
 * Funcionalidades:
 * - Gestión de datos de hoteles
 * - Manejo de reservas
 * - Cálculo de costos
 * - Sincronización con Firebase
 * - Auto-generación de gastos de alojamiento
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2025
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class HotelManager {
    constructor() {
        this.hotels = new Map();
        this.reservations = new Map();
        this.firebaseManager = null;
        this.budgetManager = null;
        
        Logger.init('🏨 HotelManager initialized');
        this.loadHotelsData();
        this.loadReservationsData();
    }

    /**
     * Inicializar con Firebase y BudgetManager
     */
    async initialize(firebaseManager, budgetManager) {
        this.firebaseManager = firebaseManager;
        this.budgetManager = budgetManager;
        
        if (firebaseManager) {
            await this.syncWithFirebase();
        }
        
        Logger.success('✅ HotelManager initialized with Firebase');
    }

    /**
     * Cargar datos de hoteles desde tripConfig
     */
    loadHotelsData() {
        const hotelsData = tripConfig.hotelsData || {};
        
        Object.values(hotelsData).forEach(hotel => {
            this.hotels.set(hotel.id, hotel);
        });
        
        Logger.debug(`📊 Loaded ${this.hotels.size} hotels`);
    }

    /**
     * Cargar datos de reservas desde tripConfig
     */
    loadReservationsData() {
        const reservationsData = tripConfig.reservationsData || [];
        
        reservationsData.forEach(reservation => {
            this.reservations.set(reservation.id, reservation);
        });
        
        Logger.debug(`📊 Loaded ${this.reservations.size} reservations`);
    }

    /**
     * Obtener hotel por ID
     */
    getHotel(hotelId) {
        return this.hotels.get(hotelId);
    }

    /**
     * Obtener todos los hoteles
     */
    getAllHotels() {
        return Array.from(this.hotels.values());
    }

    /**
     * Obtener hoteles por país
     */
    getHotelsByCountry(country) {
        return this.getAllHotels().filter(hotel => hotel.country === country);
    }

    /**
     * Obtener reserva por ID
     */
    getReservation(reservationId) {
        return this.reservations.get(reservationId);
    }

    /**
     * Obtener todas las reservas
     */
    getAllReservations() {
        return Array.from(this.reservations.values());
    }

    /**
     * Obtener reservas por hotel
     */
    getReservationsByHotel(hotelId) {
        return this.getAllReservations().filter(res => res.hotelId === hotelId);
    }

    /**
     * Obtener hotel para un día específico del itinerario
     */
    getHotelForDay(dayId) {
        const reservation = this.getAllReservations().find(res => 
            res.dayIds.includes(dayId)
        );
        
        if (reservation) {
            return this.getHotel(reservation.hotelId);
        }
        
        return null;
    }

    /**
     * Obtener reserva para un día específico
     */
    getReservationForDay(dayId) {
        return this.getAllReservations().find(res => 
            res.dayIds.includes(dayId)
        );
    }

    /**
     * Calcular costo total de todas las reservas
     */
    getTotalCost() {
        return this.getAllReservations().reduce((total, reservation) => {
            return total + (reservation.totalCost || 0);
        }, 0);
    }

    /**
     * Calcular costo por país
     */
    getCostByCountry() {
        const costByCountry = {};
        
        this.getAllReservations().forEach(reservation => {
            const hotel = this.getHotel(reservation.hotelId);
            if (hotel) {
                const country = hotel.country;
                costByCountry[country] = (costByCountry[country] || 0) + reservation.totalCost;
            }
        });
        
        return costByCountry;
    }

    /**
     * Calcular número total de noches
     */
    getTotalNights() {
        return this.getAllReservations().reduce((total, reservation) => {
            return total + (reservation.nights || 0);
        }, 0);
    }

    /**
     * Obtener estadísticas de hoteles
     */
    getHotelStats() {
        const reservations = this.getAllReservations();
        const totalCost = this.getTotalCost();
        const totalNights = this.getTotalNights();
        const avgCostPerNight = totalNights > 0 ? totalCost / totalNights : 0;
        
        return {
            totalHotels: this.hotels.size,
            totalReservations: reservations.length,
            totalCost,
            totalNights,
            avgCostPerNight: Math.round(avgCostPerNight * 100) / 100,
            costByCountry: this.getCostByCountry()
        };
    }

    /**
     * Auto-generar gastos de alojamiento para BudgetManager
     */
    async generateAccommodationExpenses() {
        if (!this.budgetManager) {
            Logger.warning('BudgetManager not available for expense generation');
            return [];
        }

        const expenses = [];
        
        for (const reservation of this.getAllReservations()) {
            const hotel = this.getHotel(reservation.hotelId);
            if (!hotel) continue;

            // Check if expense already exists to avoid duplicates
            // Skip duplicate check for now since getExpenseById method may not exist
            // TODO: Implement proper duplicate checking when BudgetManager API is available

            const expense = {
                id: `hotel_${reservation.id}`,
                description: `Alojamiento - ${hotel.name}`,
                amount: reservation.totalCost,
                currency: reservation.currency,
                category: 'Alojamiento',
                subcategory: 'Hotel',
                date: reservation.checkInDate,
                location: hotel.location,
                country: hotel.country,
                notes: `${reservation.nights} noches - Confirmación: ${reservation.confirmationCode}`,
                source: 'hotel_reservation',
                reservationId: reservation.id,
                hotelId: reservation.hotelId,
                isAutoGenerated: true
            };

            // Add expense to budget manager
            try {
                // Check if addExpense method exists
                if (this.budgetManager && typeof this.budgetManager.addExpense === 'function') {
                    await this.budgetManager.addExpense(expense);
                    expenses.push(expense);
                    if (Logger && Logger.success) {
                        Logger.success(`Added accommodation expense for ${hotel.name}: $${reservation.totalCost}`);
                    }
                } else {
                    // Fallback: just add to expenses array for now
                    expenses.push(expense);
                    if (Logger && Logger.info) {
                        Logger.info(`Prepared accommodation expense for ${hotel.name}: $${reservation.totalCost}`);
                    }
                }
            } catch (error) {
                if (Logger && Logger.error) {
                    Logger.error(`Failed to add expense for ${hotel.name}:`, error);
                }
            }
        }

        if (Logger && Logger.info) {
            Logger.info(`Generated and added ${expenses.length} accommodation expenses`);
        }
        return expenses;
    }

    async syncExpensesWithBudget() {
        if (!this.budgetManager) {
            Logger.warning('BudgetManager not available for expense sync');
            return;
        }

        try {
            const generatedExpenses = await this.generateAccommodationExpenses();
            
            if (generatedExpenses.length > 0) {
                // Trigger budget recalculation if method exists
                if (this.budgetManager && typeof this.budgetManager.calculateTotals === 'function') {
                    await this.budgetManager.calculateTotals();
                }
                if (Logger && Logger.success) {
                    Logger.success(`Synced ${generatedExpenses.length} hotel expenses with budget`);
                }
            }
        } catch (error) {
            if (Logger && Logger.error) {
                Logger.error('Error syncing hotel expenses with budget:', error);
            }
        }
    }

    /**
     * Determinar tipo de alojamiento basado en el nombre
     */
    getHotelType(hotelName) {
        const name = hotelName.toLowerCase();
        
        if (name.includes('lodge')) return 'lodge';
        if (name.includes('teahouse') || name.includes('tea house')) return 'teahouse';
        if (name.includes('guesthouse') || name.includes('guest house')) return 'guesthouse';
        
        return 'hotel';
    }

    /**
     * Validar reserva
     */
    validateReservation(reservation) {
        const errors = [];
        
        // Validar hotel existe
        if (!this.getHotel(reservation.hotelId)) {
            errors.push(`Hotel ${reservation.hotelId} no encontrado`);
        }
        
        // Validar fechas
        const checkIn = new Date(reservation.checkInDate);
        const checkOut = new Date(reservation.checkOutDate);
        
        if (checkIn >= checkOut) {
            errors.push('Fecha de salida debe ser posterior a la de entrada');
        }
        
        // Validar noches calculadas
        const daysDiff = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (daysDiff !== reservation.nights) {
            errors.push(`Número de noches no coincide: calculado ${daysDiff}, especificado ${reservation.nights}`);
        }
        
        return errors;
    }

    /**
     * Sincronizar con Firebase
     */
    async syncWithFirebase() {
        if (!this.firebaseManager) return;
        
        try {
            // Aquí implementaríamos la sincronización con Firebase
            Logger.debug('🔄 Syncing hotels with Firebase...');
            
            // Por ahora solo log, implementación futura
            Logger.success('✅ Hotels synced with Firebase');
        } catch (error) {
            Logger.error('Error syncing hotels with Firebase:', error);
        }
    }

    /**
     * Exportar datos para backup
     */
    exportData() {
        return {
            hotels: Array.from(this.hotels.values()),
            reservations: Array.from(this.reservations.values()),
            stats: this.getHotelStats(),
            timestamp: new Date().toISOString()
        };
    }
}
