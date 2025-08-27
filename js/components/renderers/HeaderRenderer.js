/**
 * HeaderRenderer - Renderizador de Cabeceras Estandarizadas
 * 
 * Módulo especializado para generar cabeceras consistentes en toda la aplicación.
 * Garantiza un estilo uniforme y mantenible para todas las secciones.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

export class HeaderRenderer {
    /**
     * Renderiza una cabecera estándar para las secciones de la aplicación
     * 
     * @param {Object} config - Configuración de la cabecera
     * @param {string} config.icon - Icono Material Symbols
     * @param {string} config.title - Título de la sección
     * @param {string} config.iconColor - Color del icono (ej: 'text-blue-600 dark:text-blue-400')
     * @param {string} [config.extraClasses] - Clases adicionales
     * @returns {string} HTML de la cabecera
     */
    static renderStandardHeader({ icon, title, iconColor, extraClasses = '' }) {
        return `
            <div class="flex items-center gap-3 mb-8 ${extraClasses}">
                <span class="material-symbols-outlined text-3xl ${iconColor}">${icon}</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${title}</h2>
            </div>
        `;
    }

    /**
     * Renderiza una cabecera hero para páginas principales
     * 
     * @param {Object} config - Configuración de la cabecera hero
     * @param {string} config.icon - Icono Material Symbols
     * @param {string} config.title - Título principal
     * @param {string} config.subtitle - Subtítulo descriptivo
     * @param {string} config.iconColor - Color del icono
     * @returns {string} HTML de la cabecera hero
     */
    static renderHeroHeader({ icon, title, subtitle, iconColor }) {
        return `
            <div class="mb-12">
                <div class="flex items-center gap-4 mb-4">
                    <span class="material-symbols-outlined text-6xl ${iconColor}">${icon}</span>
                    <div>
                        <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">${title}</h1>
                        <p class="text-lg text-slate-600 dark:text-slate-400">${subtitle}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtiene configuraciones predefinidas para secciones comunes
     */
    static getPresetConfigs() {
        return {
            summary: {
                icon: 'dashboard',
                title: 'Resumen del Viaje',
                iconColor: 'text-blue-600 dark:text-blue-400'
            },
            itinerary: {
                icon: 'list_alt',
                title: 'Itinerario del Viaje',
                iconColor: 'text-blue-600 dark:text-blue-400'
            },
            today: {
                icon: 'today',
                title: 'Hoy en tu Viaje',
                iconColor: 'text-orange-600 dark:text-orange-400'
            },
            map: {
                icon: 'map',
                title: 'Ruta del Viaje',
                iconColor: 'text-blue-600 dark:text-blue-400'
            },
            budget: {
                icon: 'account_balance_wallet',
                title: 'Presupuesto del Viaje',
                iconColor: 'text-green-600 dark:text-green-400'
            },
            status: {
                icon: 'event_available',
                title: 'Estado del viaje',
                iconColor: 'text-blue-600 dark:text-blue-400'
            },
            weather: {
                icon: 'wb_sunny',
                title: 'Información Climática',
                iconColor: 'text-yellow-600 dark:text-yellow-400'
            },
            packing: {
                icon: 'luggage',
                title: 'Lista de Equipaje',
                iconColor: 'text-teal-600 dark:text-teal-400'
            },
            agencies: {
                icon: 'business',
                title: 'Información de Agencias',
                iconColor: 'text-blue-600 dark:text-blue-400'
            },
            flights: {
                icon: 'flight',
                title: 'Información de Vuelos',
                iconColor: 'text-blue-600 dark:text-blue-400'
            }
        };
    }

    /**
     * Renderiza una cabecera usando un preset predefinido
     * 
     * @param {string} presetName - Nombre del preset (ej: 'summary', 'itinerary')
     * @param {Object} [overrides] - Configuración adicional o sobrescritura
     * @returns {string} HTML de la cabecera
     */
    static renderPresetHeader(presetName, overrides = {}) {
        const presets = this.getPresetConfigs();
        const config = { ...presets[presetName], ...overrides };
        
        if (!config) {
            console.warn(`⚠️ HeaderRenderer: Preset '${presetName}' no encontrado`);
            return '';
        }

        return this.renderStandardHeader(config);
    }
}
