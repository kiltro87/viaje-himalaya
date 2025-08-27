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

// ⚠️ DUPLICACIÓN ELIMINADA: DateUtils movido a DateUtils.js
// Para usar DateUtils: import { DateUtils } from './DateUtils.js';
