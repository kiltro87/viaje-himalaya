/**
 * ShareManager - Gestor de Compartir Nativo
 * 
 * Maneja la funcionalidad de compartir contenido usando la Web Share API
 * nativa del dispositivo, con fallbacks para navegadores no compatibles.
 * 
 * Funcionalidades principales:
 * - Compartir itinerario completo
 * - Compartir días específicos del viaje
 * - Compartir gastos y presupuesto
 * - Compartir ubicaciones y mapas
 * - Compartir fotos y documentos
 * - Fallbacks para navegadores sin soporte nativo
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';
import { FormatUtils } from './FormatUtils.js';

export class ShareManager {
    /**
     * Constructor del ShareManager
     * 
     * Inicializa el sistema de compartir con detección de capacidades
     * del navegador y configuración de fallbacks.
     * 
     * @constructor
     */
    constructor() {
        this.isWebShareSupported = this.checkWebShareSupport();
        this.isWebShareFilesSupported = this.checkWebShareFilesSupport();
        
        Logger.init('ShareManager initialized', {
            webShareSupported: this.isWebShareSupported,
            webShareFilesSupported: this.isWebShareFilesSupported
        });
    }

    /**
     * Verifica si Web Share API está soportada
     * 
     * @returns {boolean} True si Web Share API está disponible
     */
    checkWebShareSupport() {
        return 'share' in navigator;
    }

    /**
     * Verifica si Web Share API soporta archivos
     * 
     * @returns {boolean} True si se pueden compartir archivos
     */
    checkWebShareFilesSupported() {
        return 'canShare' in navigator && 'share' in navigator;
    }

    /**
     * Comparte el itinerario completo del viaje
     * 
     * @param {Object} options - Opciones de compartir
     * @param {string} options.format - Formato: 'text', 'url', 'json'
     * @returns {Promise<boolean>} True si se compartió exitosamente
     */
    async shareItinerary(options = {}) {
        const { format = 'text' } = options;
        
        try {
            let shareData;
            
            switch (format) {
                case 'text':
                    shareData = this.generateItineraryText();
                    break;
                case 'url':
                    shareData = this.generateItineraryUrl();
                    break;
                case 'json':
                    shareData = this.generateItineraryJson();
                    break;
                default:
                    shareData = this.generateItineraryText();
            }

            Logger.event('Sharing itinerary', { format, dataLength: shareData.text?.length });
            
            if (this.isWebShareSupported) {
                await navigator.share(shareData);
                Logger.success('Itinerary shared successfully via Web Share API');
                return true;
            } else {
                return this.fallbackShare(shareData);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.warning('Share cancelled by user');
                return false;
            }
            
            Logger.error('Error sharing itinerary:', error);
            return this.fallbackShare(this.generateItineraryText());
        }
    }

    /**
     * Comparte un día específico del itinerario
     * 
     * @param {string} dayId - ID del día a compartir
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<boolean>} True si se compartió exitosamente
     */
    async shareDay(dayId, options = {}) {
        try {
            const day = tripConfig.itinerary.find(d => d.id === dayId);
            if (!day) {
                throw new Error(`Day ${dayId} not found in itinerary`);
            }

            const shareData = this.generateDayShareData(day, options);
            
            Logger.event('Sharing day', { dayId, location: day.location });

            if (this.isWebShareSupported) {
                await navigator.share(shareData);
                Logger.success('Day shared successfully via Web Share API');
                return true;
            } else {
                return this.fallbackShare(shareData);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.warning('Share cancelled by user');
                return false;
            }
            
            Logger.error('Error sharing day:', error);
            return false;
        }
    }

    /**
     * Comparte información de gastos y presupuesto
     * 
     * @param {Object} options - Opciones de compartir
     * @param {boolean} options.includeDetails - Incluir detalles de gastos
     * @param {string} options.category - Categoría específica a compartir
     * @returns {Promise<boolean>} True si se compartió exitosamente
     */
    async shareBudget(options = {}) {
        try {
            const shareData = this.generateBudgetShareData(options);
            
            Logger.event('Sharing budget', options);

            if (this.isWebShareSupported) {
                await navigator.share(shareData);
                Logger.success('Budget shared successfully via Web Share API');
                return true;
            } else {
                return this.fallbackShare(shareData);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.warning('Share cancelled by user');
                return false;
            }
            
            Logger.error('Error sharing budget:', error);
            return false;
        }
    }

    /**
     * Comparte una ubicación específica
     * 
     * @param {Object} location - Datos de ubicación
     * @param {number} location.lat - Latitud
     * @param {number} location.lng - Longitud
     * @param {string} location.name - Nombre del lugar
     * @param {string} location.description - Descripción opcional
     * @returns {Promise<boolean>} True si se compartió exitosamente
     */
    async shareLocation(location) {
        try {
            const shareData = this.generateLocationShareData(location);
            
            Logger.event('Sharing location', { name: location.name });

            if (this.isWebShareSupported) {
                await navigator.share(shareData);
                Logger.success('Location shared successfully via Web Share API');
                return true;
            } else {
                return this.fallbackShare(shareData);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.warning('Share cancelled by user');
                return false;
            }
            
            Logger.error('Error sharing location:', error);
            return false;
        }
    }

    /**
     * Comparte archivos (fotos, documentos)
     * 
     * @param {File[]} files - Array de archivos a compartir
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<boolean>} True si se compartió exitosamente
     */
    async shareFiles(files, options = {}) {
        try {
            if (!this.isWebShareFilesSupported) {
                Logger.warning('File sharing not supported, using fallback');
                return this.fallbackShareFiles(files, options);
            }

            const shareData = {
                title: options.title || 'Archivos del Viaje',
                text: options.text || 'Compartiendo archivos de mi aventura en el Himalaya',
                files: files
            };

            // Verificar si se pueden compartir estos archivos
            if (navigator.canShare && !navigator.canShare(shareData)) {
                Logger.warning('Cannot share these files, using fallback');
                return this.fallbackShareFiles(files, options);
            }

            Logger.event('Sharing files', { 
                fileCount: files.length,
                totalSize: files.reduce((sum, file) => sum + file.size, 0)
            });

            await navigator.share(shareData);
            Logger.success('Files shared successfully via Web Share API');
            return true;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.warning('Share cancelled by user');
                return false;
            }
            
            Logger.error('Error sharing files:', error);
            return this.fallbackShareFiles(files, options);
        }
    }

    /**
     * Genera datos de texto para compartir el itinerario
     * 
     * @private
     * @returns {Object} Datos para compartir
     */
    generateItineraryText() {
        const itinerary = tripConfig.itinerary;
        const totalDays = tripConfig.itinerary.length;
        
        let text = `🏔️ Mi Aventura en el Himalaya\n`;
        text += `📅 ${totalDays} días de viaje increíble\n\n`;
        
        text += `📍 Itinerario:\n`;
        itinerary.forEach(day => {
            text += `Día ${day.day}: ${day.location}\n`;
            if (day.activities && day.activities.length > 0) {
                text += `   🎯 ${day.activities[0]}\n`;
            }
        });
        
        text += `\n✨ ¡Sígueme en esta aventura!`;

        return {
            title: 'Mi Aventura en el Himalaya',
            text: text,
            url: window.location.href
        };
    }

    /**
     * Genera URL para compartir el itinerario
     * 
     * @private
     * @returns {Object} Datos para compartir
     */
    generateItineraryUrl() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            view: 'itinerario',
            shared: 'true'
        });

        return {
            title: 'Mi Aventura en el Himalaya - Itinerario',
            text: '🏔️ Mira mi itinerario completo para la aventura en el Himalaya',
            url: `${baseUrl}?${params.toString()}`
        };
    }

    /**
     * Genera JSON para compartir el itinerario
     * 
     * @private
     * @returns {Object} Datos para compartir
     */
    generateItineraryJson() {
        const itineraryData = {
            title: 'Mi Aventura en el Himalaya',
            totalDays: tripConfig.itinerary.length,
            itinerary: tripConfig.itinerary.map(day => ({
                day: day.day,
                location: day.location,
                activities: day.activities,
                coordinates: day.coordinates
            })),
            exportedAt: new Date().toISOString()
        };

        const jsonBlob = new Blob([JSON.stringify(itineraryData, null, 2)], {
            type: 'application/json'
        });

        return {
            title: 'Itinerario - Mi Aventura en el Himalaya',
            text: 'Datos completos del itinerario en formato JSON',
            files: [new File([jsonBlob], 'itinerario-himalaya.json', {
                type: 'application/json'
            })]
        };
    }

    /**
     * Genera datos para compartir un día específico
     * 
     * @private
     * @param {Object} day - Datos del día
     * @param {Object} options - Opciones adicionales
     * @returns {Object} Datos para compartir
     */
    generateDayShareData(day, options = {}) {
        let text = `🏔️ Día ${day.day} - ${day.location}\n\n`;
        
        if (day.activities && day.activities.length > 0) {
            text += `🎯 Actividades:\n`;
            day.activities.forEach(activity => {
                text += `• ${activity}\n`;
            });
            text += `\n`;
        }

        if (day.accommodation) {
            text += `🏨 Alojamiento: ${day.accommodation}\n`;
        }

        if (day.coordinates) {
            text += `📍 Ubicación: ${day.coordinates.lat}, ${day.coordinates.lng}\n`;
        }

        text += `\n✨ Parte de mi aventura en el Himalaya`;

        const shareData = {
            title: `Día ${day.day} - ${day.location}`,
            text: text
        };

        if (options.includeUrl) {
            const params = new URLSearchParams({
                view: 'itinerario',
                day: day.id
            });
            shareData.url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        }

        return shareData;
    }

    /**
     * Genera datos para compartir presupuesto
     * 
     * @private
     * @param {Object} options - Opciones de compartir
     * @returns {Object} Datos para compartir
     */
    generateBudgetShareData(options = {}) {
        const expenses = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]');
        const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        // Calcular presupuesto total
        const budgetData = tripConfig.budget.categories;
        const allExpenses = Object.values(budgetData).flat();
        const totalBudget = allExpenses.reduce((sum, item) => {
            if (item.cost) return sum + item.cost;
            if (item.subItems) return sum + item.subItems.reduce((subSum, subItem) => subSum + (subItem.cost || 0), 0);
            return sum;
        }, 0);

        let text = `💰 Presupuesto - Mi Aventura en el Himalaya\n\n`;
        text += `📊 Resumen:\n`;
        text += `• Presupuesto total: ${FormatUtils.formatCurrency(totalBudget)}\n`;
        text += `• Gastado hasta ahora: ${FormatUtils.formatCurrency(totalSpent)}\n`;
        text += `• Restante: ${FormatUtils.formatCurrency(totalBudget - totalSpent)}\n`;
        
        const percentage = (totalSpent / totalBudget) * 100;
        text += `• Porcentaje gastado: ${Math.round(percentage)}%\n`;

        if (options.includeDetails && expenses.length > 0) {
            text += `\n💳 Últimos gastos:\n`;
            expenses.slice(0, 5).forEach(expense => {
                text += `• ${expense.concept}: ${FormatUtils.formatCurrency(expense.amount)}\n`;
            });
        }

        return {
            title: 'Presupuesto - Mi Aventura en el Himalaya',
            text: text,
            url: options.includeUrl ? `${window.location.origin}${window.location.pathname}?view=gastos` : undefined
        };
    }

    /**
     * Genera datos para compartir ubicación
     * 
     * @private
     * @param {Object} location - Datos de ubicación
     * @returns {Object} Datos para compartir
     */
    generateLocationShareData(location) {
        let text = `📍 ${location.name}\n\n`;
        
        if (location.description) {
            text += `${location.description}\n\n`;
        }
        
        text += `🗺️ Coordenadas: ${location.lat}, ${location.lng}\n`;
        text += `🔗 Ver en Google Maps: https://maps.google.com/?q=${location.lat},${location.lng}\n`;
        text += `\n✨ Parte de mi aventura en el Himalaya`;

        return {
            title: location.name,
            text: text,
            url: `https://maps.google.com/?q=${location.lat},${location.lng}`
        };
    }

    /**
     * Fallback para compartir cuando Web Share API no está disponible
     * 
     * @private
     * @param {Object} shareData - Datos a compartir
     * @returns {Promise<boolean>} True si se ejecutó el fallback
     */
    async fallbackShare(shareData) {
        Logger.warning('Using fallback share method');
        
        try {
            // Intentar copiar al portapapeles
            if (navigator.clipboard && navigator.clipboard.writeText) {
                let textToShare = shareData.title ? `${shareData.title}\n\n` : '';
                textToShare += shareData.text || '';
                if (shareData.url) {
                    textToShare += `\n\n${shareData.url}`;
                }
                
                await navigator.clipboard.writeText(textToShare);
                
                // Mostrar notificación de éxito
                this.showFallbackNotification('Contenido copiado al portapapeles');
                Logger.success('Content copied to clipboard as fallback');
                return true;
            }
            
            // Fallback más básico: crear elemento temporal
            const textArea = document.createElement('textarea');
            textArea.value = shareData.text + (shareData.url ? `\n${shareData.url}` : '');
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showFallbackNotification('Contenido copiado al portapapeles');
            Logger.success('Content copied using fallback method');
            return true;
            
        } catch (error) {
            Logger.error('Fallback share failed:', error);
            this.showFallbackNotification('No se pudo compartir el contenido', 'error');
            return false;
        }
    }

    /**
     * Fallback para compartir archivos
     * 
     * @private
     * @param {File[]} files - Archivos a compartir
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<boolean>} True si se ejecutó el fallback
     */
    async fallbackShareFiles(files, options = {}) {
        Logger.warning('Using fallback file share method');
        
        try {
            // Crear enlaces de descarga para cada archivo
            files.forEach(file => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
            
            this.showFallbackNotification(`${files.length} archivo(s) descargado(s)`);
            Logger.success('Files downloaded as fallback share method');
            return true;
            
        } catch (error) {
            Logger.error('Fallback file share failed:', error);
            this.showFallbackNotification('No se pudieron compartir los archivos', 'error');
            return false;
        }
    }

    /**
     * Muestra notificación de fallback
     * 
     * @private
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación ('success' | 'error')
     */
    showFallbackNotification(message, type = 'success') {
        // Crear notificación temporal en la UI
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Obtiene información sobre las capacidades de compartir
     * 
     * @returns {Object} Estado de las capacidades de compartir
     */
    getCapabilities() {
        return {
            webShareSupported: this.isWebShareSupported,
            webShareFilesSupported: this.isWebShareFilesSupported,
            clipboardSupported: !!(navigator.clipboard && navigator.clipboard.writeText),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }

    /**
     * Limpieza de recursos
     */
    destroy() {
        Logger.data('ShareManager destroyed');
    }
}
