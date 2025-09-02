/**
 * 🎨 DESIGN TOKENS - SISTEMA CENTRALIZADO DE ESTILOS
 * 
 * Sistema unificado de tokens de diseño para mantener consistencia
 * visual a lo largo de toda la aplicación.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { COLORS as APP_COLORS } from './AppConstants.js';

/**
 * 🎨 TOKENS DE COLORES (Re-exportados para centralización)
 */
export const COLORS = APP_COLORS;

/**
 * 📐 TOKENS DE ESPACIADO - SISTEMA MEJORADO
 */
export const SPACING = {
    // Sistema de espaciado base (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
    BASE: {
        XS: '1',    // 4px
        SM: '2',    // 8px
        MD: '3',    // 12px
        LG: '4',    // 16px
        XL: '6',    // 24px
        '2XL': '8', // 32px
        '3XL': '12', // 48px
        '4XL': '16'  // 64px
    },
    
    // Padding interno de componentes
    COMPONENT: {
        SMALL: 'p-4',
        MEDIUM: 'p-6', 
        LARGE: 'p-8',
        XLARGE: 'p-12'
    },
    
    // Márgenes entre secciones
    SECTION: {
        SMALL: 'space-y-4',
        MEDIUM: 'space-y-6',
        LARGE: 'space-y-8',
        XLARGE: 'space-y-12'
    },
    
    // Gaps para grids y flexbox
    GAP: {
        SMALL: 'gap-3',
        MEDIUM: 'gap-4',
        LARGE: 'gap-6',
        XLARGE: 'gap-8'
    },
    
    // Espaciado responsive mejorado
    RESPONSIVE: {
        XS: 'p-2 sm:p-3 md:p-4',
        SM: 'p-3 sm:p-4 md:p-6',
        MD: 'p-4 sm:p-6 md:p-8',
        LG: 'p-6 sm:p-8 md:p-12'
    }
};

/**
 * 🔘 TOKENS DE BORDER RADIUS
 */
export const RADIUS = {
    // Elementos pequeños (botones, badges, inputs)
    SMALL: 'rounded-lg',
    
    // Tarjetas secundarias y elementos medianos
    MEDIUM: 'rounded-xl',
    
    // Tarjetas principales y contenedores importantes
    LARGE: 'rounded-2xl',
    
    // Secciones hero y elementos prominentes
    XLARGE: 'rounded-3xl',
    
    // Elementos circulares
    FULL: 'rounded-full'
};

/**
 * 🌫️ TOKENS DE SOMBRAS
 */
export const SHADOW = {
    // Elementos interactivos sutiles (botones, inputs)
    SUBTLE: 'shadow-sm',
    
    // Tarjetas y elementos elevados
    NORMAL: 'shadow-lg',
    
    // Modales y elementos flotantes importantes
    PROMINENT: 'shadow-xl',
    
    // Elementos con máximo énfasis
    DRAMATIC: 'shadow-2xl'
};

/**
 * 📊 TOKENS DE TARJETAS ESTANDARIZADAS
 */
export const CARD_STYLES = {
    // Tarjeta principal estándar
    PRIMARY: 'bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer',
    
    // Tarjeta de resumen/estadística
    SUMMARY: 'bg-slate-50 dark:bg-slate-700 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-600/50 p-4',
    
    // Tarjeta de presupuesto (contenedor principal)
    BUDGET_CONTAINER: 'bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6',
    
    // Tarjeta interactiva (clickeable)
    INTERACTIVE: 'bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer',
    
    // Tarjeta de hotel con profundidad extra
    HOTEL: 'bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer'
};

/**
 * 🎨 TOKENS DE COLORES CONTEXTUALES
 */
export const COLOR_CONTEXTS = {
    // Estados de la aplicación
    STATE: {
        SUCCESS: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-green-600 dark:text-green-400',
            icon: 'text-green-600 dark:text-green-400'
        },
        WARNING: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            text: 'text-amber-600 dark:text-amber-400',
            icon: 'text-amber-600 dark:text-amber-400'
        },
        ERROR: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-600 dark:text-red-400',
            icon: 'text-red-600 dark:text-red-400'
        },
        INFO: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-600 dark:text-blue-400',
            icon: 'text-blue-600 dark:text-blue-400'
        }
    },
    
    // Fases del viaje
    TRIP_PHASES: {
        NEPAL: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-green-600 dark:text-green-400',
            gradient: 'from-green-500 to-emerald-600'
        },
        BHUTAN: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-200 dark:border-purple-800',
            text: 'text-purple-600 dark:text-purple-400',
            gradient: 'from-purple-500 to-indigo-600'
        },
        FLIGHTS: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-600 dark:text-blue-400',
            gradient: 'from-blue-500 to-cyan-600'
        }
    },
    
    // Categorías de presupuesto
    BUDGET_CATEGORIES: {
        CLOTHES: {
            bg: 'bg-blue-500',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        },
        FOOTWEAR: {
            bg: 'bg-green-500',
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800'
        },
        EQUIPMENT: {
            bg: 'bg-purple-500',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800'
        },
        HEALTH_DOCS: {
            bg: 'bg-red-500',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800'
        },
        FLIGHTS: {
            bg: 'bg-blue-500',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        },
        ACCOMMODATION: {
            bg: 'bg-purple-500',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800'
        },
        TRANSPORT: {
            bg: 'bg-green-500',
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800'
        },
        FOOD: {
            bg: 'bg-orange-500',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800'
        },
        ACTIVITIES: {
            bg: 'bg-red-500',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800'
        },
        VISAS: {
            bg: 'bg-yellow-500',
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-200 dark:border-yellow-800'
        },
        INSURANCE: {
            bg: 'bg-indigo-500',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800'
        },
        GEAR: {
            bg: 'bg-pink-500',
            text: 'text-pink-600 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-800'
        },
        TOUR: {
            bg: 'bg-teal-500',
            text: 'text-teal-600 dark:text-teal-400',
            border: 'border-teal-200 dark:border-teal-800'
        },
        MISC: {
            bg: 'bg-gray-500',
            text: 'text-gray-600 dark:text-gray-400',
            border: 'border-gray-200 dark:border-gray-800'
        },
        CONTINGENCY: {
            bg: 'bg-amber-500',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800'
        }
    }
};

/**
 * 📱 TOKENS RESPONSIVE
 */
export const RESPONSIVE = {
    // Contenedores principales
    CONTAINER: {
        FULL: 'w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto',
        CENTERED: 'w-full max-w-4xl mx-auto',
        NARROW: 'w-full max-w-2xl mx-auto'
    },
    
    // Espaciado responsive
    PADDING: {
        SECTION: 'p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12',
        CARD: 'p-4 sm:p-6 md:p-8',
        CONTENT: 'pb-32' // Bottom padding para navegación móvil
    },
    
    // Grids responsive
    GRID: {
        AUTO: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        CARDS: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        STATS: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    }
};

/**
 * ✨ TOKENS DE TRANSICIONES - MEJORADO CON EASING
 */
export const TRANSITION = {
    // Transiciones estándar con easing mejorado
    FAST: 'transition-all duration-150 ease-out',
    NORMAL: 'transition-all duration-300 ease-out',
    SLOW: 'transition-all duration-500 ease-out',
    
    // Easing personalizado
    EASING: {
        SMOOTH: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        EASE_OUT: 'cubic-bezier(0.0, 0.0, 0.2, 1)'
    },
    
    // Efectos específicos
    HOVER: 'hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out',
    FOCUS: 'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200',
    BUTTON: 'hover:bg-opacity-90 active:scale-95 transition-all duration-150 ease-out',
    
    // Nuevos efectos para pull-to-refresh y loading
    PULL_TO_REFRESH: 'transition-transform duration-300 ease-out',
    SKELETON: 'animate-pulse',
    FADE_IN: 'animate-fade-in',
    SLIDE_UP: 'animate-slide-up'
};

/**
 * 🔤 TOKENS DE TIPOGRAFÍA
 */
export const TYPOGRAPHY = {
    // Títulos de sección
    HEADING: {
        HERO: 'text-4xl md:text-6xl font-black leading-tight',
        SECTION: 'text-4xl md:text-5xl font-black',
        SUBSECTION: 'text-2xl md:text-3xl font-bold',
        CARD: 'text-xl font-bold'
    },
    
    // Texto de contenido
    BODY: {
        LARGE: 'text-lg leading-relaxed',
        NORMAL: 'text-base leading-relaxed',
        SMALL: 'text-sm',
        CAPTION: 'text-xs'
    },
    
    // Colores de texto
    COLOR: {
        PRIMARY: 'text-slate-900 dark:text-white',
        SECONDARY: 'text-slate-600 dark:text-slate-400',
        MUTED: 'text-slate-500 dark:text-slate-500'
    }
};

/**
 * 📦 TOKENS DE COMPONENTES COMUNES
 */
export const COMPONENT = {
    // Estilo de tarjetas base
    CARD: {
        BASE: `bg-white dark:bg-slate-800 ${RADIUS.LARGE} ${SHADOW.NORMAL} border border-slate-200 dark:border-slate-700`,
        INTERACTIVE: `bg-white dark:bg-slate-800 ${RADIUS.LARGE} ${SHADOW.NORMAL} border border-slate-200 dark:border-slate-700 ${TRANSITION.HOVER}`,
        FLOATING: `bg-white dark:bg-slate-800 ${RADIUS.LARGE} ${SHADOW.PROMINENT} border border-slate-200 dark:border-slate-700`
    },
    
    // Botones
    BUTTON: {
        PRIMARY: `bg-blue-600 hover:bg-blue-700 text-white ${RADIUS.MEDIUM} ${SPACING.COMPONENT.SMALL} ${TRANSITION.BUTTON}`,
        SECONDARY: `bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white ${RADIUS.MEDIUM} ${SPACING.COMPONENT.SMALL} ${TRANSITION.BUTTON}`,
        GHOST: `hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 ${RADIUS.MEDIUM} ${SPACING.COMPONENT.SMALL} ${TRANSITION.BUTTON}`
    },
    
    // Iconos estándar
    ICON: {
        SMALL: 'text-lg',
        MEDIUM: 'text-2xl',
        LARGE: 'text-3xl',
        XLARGE: 'text-6xl'
    }
};

/**
 * 🌙 TOKENS DE MODO OSCURO INTELIGENTE
 */
export const DARK_MODE = {
    // Clases para transiciones suaves
    TRANSITION: 'transition-colors duration-300 ease-out',
    
    // Detectores de tiempo
    TIME_BASED: {
        SUNSET_HOUR: 19,
        SUNRISE_HOUR: 7
    },
    
    // Preferencias del sistema
    SYSTEM: {
        PREFER_DARK: '(prefers-color-scheme: dark)',
        PREFER_LIGHT: '(prefers-color-scheme: light)'
    }
};

/**
 * 📊 TOKENS PARA ANALYTICS Y INSIGHTS
 */
export const ANALYTICS = {
    COLORS: {
        CHART_PRIMARY: '#3B82F6',
        CHART_SECONDARY: '#10B981',
        CHART_ACCENT: '#F59E0B',
        CHART_DANGER: '#EF4444'
    },
    
    GRADIENTS: {
        SPENDING: 'from-red-500 to-orange-500',
        BUDGET: 'from-green-500 to-emerald-500',
        SAVINGS: 'from-blue-500 to-cyan-500'
    }
};

export default {
    SPACING,
    RADIUS,
    SHADOW,
    COLOR_CONTEXTS,
    RESPONSIVE,
    TRANSITION,
    TYPOGRAPHY,
    COMPONENT,
    DARK_MODE,
    ANALYTICS
};
