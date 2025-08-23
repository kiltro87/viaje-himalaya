/**
 * FormatUtils - Utilidades de Formateo y Conversión
 * 
 * Conjunto de utilidades para formatear fechas, monedas, números
 * y otros tipos de datos utilizados en la aplicación.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import { APP_CONFIG } from '../config/AppConstants.js';
import { tripConfig } from '../config/tripConfig.js';

export class FormatUtils {
    /**
     * Formatear fecha en formato corto español
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada (ej: "15 Oct")
     */
    static formatShortDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return 'Fecha inválida';
        }
        
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                       'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    /**
     * Formatear fecha completa en español
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada (ej: "15 de octubre de 2025")
     */
    static formatFullDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return 'Fecha inválida';
        }
        
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Formatear cantidad monetaria en euros
     * @param {number} amount - Cantidad a formatear
     * @param {boolean} round - Si debe redondear a enteros
     * @returns {string} Cantidad formateada (ej: "1.234,56 €")
     */
    static formatCurrency(amount, round = false) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '0,00 €';
        }
        
        const value = round ? Math.round(amount) : amount;
        return new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: round ? 0 : 2 
        }).format(value);
    }

    /**
     * Formatear número con separadores de miles
     * @param {number} number - Número a formatear
     * @returns {string} Número formateado (ej: "1.234")
     */
    static formatNumber(number) {
        if (typeof number !== 'number' || isNaN(number)) {
            return '0';
        }
        
        return new Intl.NumberFormat('es-ES').format(number);
    }

    /**
     * Formatear duración en formato legible
     * @param {number} milliseconds - Duración en milisegundos
     * @returns {string} Duración formateada (ej: "2h 30m")
     */
    static formatDuration(milliseconds) {
        if (typeof milliseconds !== 'number' || milliseconds < 0) {
            return '0ms';
        }
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Truncar texto con puntos suspensivos
     * @param {string} text - Texto a truncar
     * @param {number} maxLength - Longitud máxima
     * @returns {string} Texto truncado
     */
    static truncateText(text, maxLength = 50) {
        if (typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Capitalizar primera letra de cada palabra
     * @param {string} text - Texto a capitalizar
     * @returns {string} Texto capitalizado
     */
    static capitalizeWords(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Formatear porcentaje
     * @param {number} value - Valor decimal (0.5 = 50%)
     * @param {number} decimals - Número de decimales
     * @returns {string} Porcentaje formateado (ej: "50,0%")
     */
    static formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0%';
        }
        
        return new Intl.NumberFormat('es-ES', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }
}

export class DateUtils {
    /**
     * Obtener fecha de inicio del viaje
     * @returns {Date} Fecha de inicio del viaje
     */
    static getTripStartDate() {
        // Obtener fecha de salida desde los datos de vuelos
        if (tripConfig.flightsData && tripConfig.flightsData.length > 0) {
            const firstFlight = tripConfig.flightsData[0];
            if (firstFlight.segments && firstFlight.segments.length > 0) {
                const departureTime = firstFlight.segments[0].departure.time;
                const [day, month, year] = departureTime.split('/');
                return new Date(APP_CONFIG.TRIP_YEAR, parseInt(month) - 1, parseInt(day));
            }
        }
        
        // Fecha de fallback
        const fallback = APP_CONFIG.FALLBACK_START_DATE;
        return new Date(fallback.year, fallback.month, fallback.day);
    }

    /**
     * Obtener fecha específica del viaje
     * @param {number} dayNumber - Número del día del viaje (0-based)
     * @returns {Date} Fecha correspondiente al día especificado
     */
    static getTripDate(dayNumber) {
        const startDate = DateUtils.getTripStartDate();
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayNumber);
        return date;
    }

    /**
     * Calcular días entre dos fechas
     * @param {Date} startDate - Fecha inicial
     * @param {Date} endDate - Fecha final
     * @returns {number} Número de días de diferencia
     */
    static daysBetween(startDate, endDate) {
        const oneDay = 24 * 60 * 60 * 1000; // milisegundos en un día
        return Math.round((endDate - startDate) / oneDay);
    }

    /**
     * Verificar si una fecha está en el rango del viaje
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si está en el rango del viaje
     */
    static isDateInTripRange(date) {
        const startDate = DateUtils.getTripStartDate();
        const endDate = DateUtils.getTripDate(tripConfig.itineraryData.length - 1);
        return date >= startDate && date <= endDate;
    }

    /**
     * Obtener el día del viaje para una fecha específica
     * @param {Date} date - Fecha a verificar
     * @returns {number|null} Número del día del viaje o null si no está en rango
     */
    static getTripDayForDate(date) {
        const startDate = DateUtils.getTripStartDate();
        const dayDiff = DateUtils.daysBetween(startDate, date);
        
        if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
            return dayDiff + 1; // 1-based
        }
        
        return null;
    }

    /**
     * Verificar si el viaje está en curso
     * @returns {boolean} True si el viaje está actualmente en curso
     */
    static isTripInProgress() {
        const today = new Date();
        return DateUtils.isDateInTripRange(today);
    }

    /**
     * Obtener estado del viaje (futuro, en curso, completado)
     * @returns {string} Estado del viaje ('future', 'in-progress', 'completed')
     */
    static getTripStatus() {
        const today = new Date();
        const startDate = DateUtils.getTripStartDate();
        const endDate = DateUtils.getTripDate(tripConfig.itineraryData.length - 1);
        
        if (today < startDate) return 'future';
        if (today > endDate) return 'completed';
        return 'in-progress';
    }
}
