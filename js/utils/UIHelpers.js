/**
 * UIHelpers - Utilidades Comunes para la Interfaz de Usuario
 * 
 * Módulo centralizado con funciones auxiliares reutilizables
 * para mantener consistencia y reducir duplicación de código.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

export class UIHelpers {
    
    /**
     * Genera un contenedor estándar para el contenido principal
     * 
     * @param {string} content - Contenido HTML interno
     * @param {Object} options - Opciones de configuración
     * @param {string} [options.padding] - Clases de padding personalizadas
     * @param {string} [options.extraClasses] - Clases adicionales
     * @returns {string} HTML del contenedor
     */
    static createMainContainer(content, options = {}) {
        const { 
            padding = 'p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12',
            extraClasses = ''
        } = options;

        return `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 ${padding} ${extraClasses}">
                ${content}
            </div>
        `;
    }

    /**
     * Crea una tarjeta estándar con estilos consistentes
     * 
     * @param {string} content - Contenido de la tarjeta
     * @param {Object} options - Opciones de configuración
     * @param {string} [options.padding] - Padding interno
     * @param {string} [options.background] - Clases de fondo
     * @param {string} [options.shadow] - Tipo de sombra
     * @param {string} [options.border] - Clases de borde
     * @returns {string} HTML de la tarjeta
     */
    static createCard(content, options = {}) {
        const {
            padding = 'p-6',
            background = 'bg-white dark:bg-slate-800',
            shadow = 'shadow-lg',
            border = 'border border-slate-200 dark:border-slate-700',
            extraClasses = ''
        } = options;

        return `
            <div class="${background} rounded-2xl ${padding} ${border} ${shadow} ${extraClasses}">
                ${content}
            </div>
        `;
    }

    /**
     * Genera un grid responsive estándar
     * 
     * @param {string[]} items - Array de elementos HTML
     * @param {Object} options - Opciones del grid
     * @param {string} [options.cols] - Configuración de columnas
     * @param {string} [options.gap] - Espaciado entre elementos
     * @returns {string} HTML del grid
     */
    static createResponsiveGrid(items, options = {}) {
        const {
            cols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            gap = 'gap-6',
            extraClasses = ''
        } = options;

        return `
            <div class="grid ${cols} ${gap} ${extraClasses}">
                ${items.join('')}
            </div>
        `;
    }

    /**
     * Crea un badge/etiqueta informativa
     * 
     * @param {string} text - Texto del badge
     * @param {string} variant - Variante de color ('blue', 'green', 'yellow', 'red')
     * @param {string} size - Tamaño ('sm', 'md', 'lg')
     * @returns {string} HTML del badge
     */
    static createBadge(text, variant = 'blue', size = 'sm') {
        const variants = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
            yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
            red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
        };

        const sizes = {
            sm: 'text-xs px-2 py-1',
            md: 'text-sm px-3 py-1',
            lg: 'text-base px-4 py-2'
        };

        const colorClass = variants[variant] || variants.blue;
        const sizeClass = sizes[size] || sizes.sm;

        return `
            <span class="${colorClass} ${sizeClass} rounded-full font-medium">
                ${text}
            </span>
        `;
    }

    /**
     * Genera un botón con icono estándar
     * 
     * @param {Object} config - Configuración del botón
     * @param {string} config.text - Texto del botón
     * @param {string} config.icon - Icono Material Symbols
     * @param {string} [config.variant] - Variante ('primary', 'secondary', 'outline')
     * @param {string} [config.size] - Tamaño ('sm', 'md', 'lg')
     * @param {string} [config.onClick] - Función onclick
     * @returns {string} HTML del botón
     */
    static createIconButton({ text, icon, variant = 'primary', size = 'md', onClick = '' }) {
        const variants = {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white',
            secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
            outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg'
        };

        const variantClass = variants[variant] || variants.primary;
        const sizeClass = sizes[size] || sizes.md;

        return `
            <button class="flex items-center gap-2 ${variantClass} ${sizeClass} rounded-lg font-medium transition-colors" ${onClick ? `onclick="${onClick}"` : ''}>
                <span class="material-symbols-outlined">${icon}</span>
                ${text}
            </button>
        `;
    }

    /**
     * Crea una estadística numérica destacada
     * 
     * @param {Object} stat - Configuración de la estadística
     * @param {string} stat.value - Valor principal
     * @param {string} stat.label - Etiqueta descriptiva
     * @param {string} [stat.icon] - Icono opcional
     * @param {string} [stat.color] - Color del tema
     * @returns {string} HTML de la estadística
     */
    static createStatCard({ value, label, icon, color = 'blue' }) {
        const iconHTML = icon ? `<span class="material-symbols-outlined text-${color}-600 dark:text-${color}-400 mb-2">${icon}</span>` : '';
        
        return `
            <div class="text-center p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl">
                ${iconHTML}
                <div class="text-2xl font-bold text-${color}-600 dark:text-${color}-400">${value}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">${label}</div>
            </div>
        `;
    }

    /**
     * Genera un loading spinner estándar
     * 
     * @param {string} [message] - Mensaje opcional
     * @returns {string} HTML del loading
     */
    static createLoadingSpinner(message = 'Cargando...') {
        return `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-slate-600 dark:text-slate-400">${message}</p>
            </div>
        `;
    }

    /**
     * Crea un mensaje de error estándar
     * 
     * @param {string} message - Mensaje de error
     * @param {string} [action] - Acción opcional
     * @returns {string} HTML del error
     */
    static createErrorMessage(message, action = '') {
        return `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined">error</span>
                    <span class="font-semibold">Error</span>
                </div>
                <p class="text-sm">${message}</p>
                ${action ? `<div class="mt-3">${action}</div>` : ''}
            </div>
        `;
    }

    /**
     * Genera código CSS responsivo para breakpoints
     * 
     * @param {Object} classes - Objeto con clases por breakpoint
     * @returns {string} Clases CSS concatenadas
     */
    static responsive(classes) {
        return Object.entries(classes)
            .map(([breakpoint, cls]) => breakpoint === 'base' ? cls : `${breakpoint}:${cls}`)
            .join(' ');
    }

    /**
     * Sanitiza y valida contenido HTML básico
     * 
     * @param {string} html - HTML a sanitizar
     * @returns {string} HTML sanitizado
     */
    static sanitizeHTML(html) {
        // Básico: remover scripts y eventos peligrosos
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '');
    }

    /**
     * Genera IDs únicos para elementos
     * 
     * @param {string} prefix - Prefijo del ID
     * @returns {string} ID único
     */
    static generateId(prefix = 'ui') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Valida si un contenedor DOM existe
     * 
     * @param {string} selector - Selector del contenedor
     * @param {string} [context] - Contexto para logging
     * @returns {HTMLElement|null} Elemento encontrado o null
     */
    static validateContainer(selector, context = 'UIHelpers') {
        const element = document.querySelector(selector);
        if (!element) {
            console.error(`❌ ${context}: Contenedor '${selector}' no encontrado`);
            return null;
        }
        return element;
    }
}
