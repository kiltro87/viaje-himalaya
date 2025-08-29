/**
 * AppConstants - Constantes Centralizadas de la Aplicación
 * 
 * Archivo que centraliza todas las constantes, configuraciones y valores
 * fijos utilizados a lo largo de la aplicación. Esto mejora la mantenibilidad
 * y evita la duplicación de valores mágicos en el código.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

export const APP_CONFIG = {
    // Información de la aplicación
    NAME: 'Sistema de Viaje - Himalaya',
    VERSION: '2.0.0',
    AUTHOR: 'Sistema de Viaje',
    
    // Configuración de fechas
    TRIP_YEAR: 2025,
    FALLBACK_START_DATE: { year: 2025, month: 9, day: 9 }, // 9 de octubre de 2025
    
    // Configuración de persistencia
    STORAGE_KEYS: {
        EXPENSES: 'tripExpensesV1',
        PACKING_LIST: 'tripPackingListV1',
        USER_PREFERENCES: 'tripUserPreferencesV1'
    },
    
    // Configuración de logging
    LOGGING: {
        ENABLED_IN_DEV: true,
        ENABLED_IN_PROD: true,
        DEV_LOG_LEVEL: 'DEBUG',
        PROD_LOG_LEVEL: 'WARNING'
    }
};

export const VIEWS = {
    TODAY: 'hoy',           // Landing page principal
    ITINERARY: 'itinerario', // Timeline del viaje
    PLANNING: 'planificacion', // Gastos + Extras + Packing
    TRACKING: 'seguimiento'    // Mapa + Analytics
};

export const BREAKPOINTS = {
    XS: 0,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
};

export const RESPONSIVE_CLASSES = {
    HEADER_VISIBILITY: 'hidden md:block',
    ICON_SIZE: 'w-10 h-10 sm:w-12 sm:h-12',
    ICON_TEXT: 'text-lg sm:text-xl',
    PADDING_RESPONSIVE: 'p-4 sm:p-6 md:p-8 lg:p-12',
    GRID_RESPONSIVE: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
};

export const COLORS = {
    VIEWS: {
        [VIEWS.TODAY]: 'orange',        // Landing page principal
        [VIEWS.ITINERARY]: 'blue',      // Timeline del viaje
        [VIEWS.PLANNING]: 'green',      // Gastos + Extras + Packing
        [VIEWS.TRACKING]: 'purple'      // Mapa + Analytics
    },
    
    TAILWIND_VARIANTS: {
        blue: {
            text: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-600',
            border: 'border-blue-500'
        },
        green: {
            text: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-600',
            border: 'border-green-500'
        },
        orange: {
            text: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-600',
            border: 'border-orange-500'
        },
        purple: {
            text: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-600',
            border: 'border-purple-500'
        }
    }
};

export const ICONS = {
    VIEWS: {
        [VIEWS.TODAY]: 'today',                    // Landing page principal
        [VIEWS.ITINERARY]: 'list_alt',             // Timeline del viaje
        [VIEWS.PLANNING]: 'checklist',             // Gastos + Extras + Packing
        [VIEWS.TRACKING]: 'analytics'              // Mapa + Analytics
    }
};

export const SELECTORS = {
    // Elementos principales
    MAIN_CONTENT: '#main-content',
    NAV_BUTTONS: '.nav-btn',
    
    // Elementos específicos
    TODAY_DATE: '#today-date',
    TODAY_DAY: '#today-day',
    TODAY_DAY_LABEL: '#today-day-label',
    TODAY_SUBTITLE: '#today-subtitle',
    
    // Contenedores
    BUDGET_CONTAINER: '#budget-container',
    BUDGET_CONTENT: '#budget-content',
    EXPENSE_FORM: '#expense-form'
};

export const MESSAGES = {
    LOADING: 'Cargando...',
    ERROR_MAIN_CONTENT: 'No se encontró el elemento main-content',
    ERROR_EXPENSE_NOT_FOUND: 'No se encontró el gasto especificado',
    SUCCESS_EXPENSE_ADDED: 'Gasto añadido correctamente',
    SUCCESS_EXPENSE_UPDATED: 'Gasto actualizado correctamente',
    SUCCESS_EXPENSE_DELETED: 'Gasto eliminado correctamente'
};

export const ANIMATION_DURATIONS = {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
};

export const MAP_CONFIG = {
    DEFAULT_CENTER: [28.3949, 84.1240], // Nepal/Bután
    DEFAULT_ZOOM: 7,
    TILE_LAYER: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    ATTRIBUTION: '&copy; OpenStreetMap &copy; CARTO'
};
