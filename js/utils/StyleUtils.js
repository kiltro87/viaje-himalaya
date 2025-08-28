/**
 * 🎨 STYLE UTILITIES
 * 
 * Funciones de utilidad para aplicar estilos consistentes usando Design Tokens.
 * Centraliza la lógica de estilos y garantiza coherencia visual.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import DesignTokens, { 
    SPACING, 
    RADIUS, 
    SHADOW, 
    COLOR_CONTEXTS, 
    RESPONSIVE, 
    TRANSITION,
    TYPOGRAPHY,
    COMPONENT 
} from '../config/DesignTokens.js';

/**
 * 📦 OBTENER ESTILOS DE TARJETA
 * 
 * @param {string} variant - Variante de tarjeta: 'base', 'interactive', 'floating'
 * @param {string} size - Tamaño: 'small', 'medium', 'large'
 * @returns {string} Clases CSS completas para tarjeta
 */
export const getCardStyles = (variant = 'base', size = 'medium') => {
    const baseCard = COMPONENT.CARD[variant.toUpperCase()] || COMPONENT.CARD.BASE;
    const padding = SPACING.COMPONENT[size.toUpperCase()] || SPACING.COMPONENT.MEDIUM;
    
    return `${baseCard} ${padding}`;
};

/**
 * 🔘 OBTENER ESTILOS DE BOTÓN
 * 
 * @param {string} variant - Variante: 'primary', 'secondary', 'ghost'
 * @param {string} size - Tamaño: 'small', 'medium', 'large'
 * @returns {string} Clases CSS completas para botón
 */
export const getButtonStyles = (variant = 'primary', size = 'medium') => {
    const baseButton = COMPONENT.BUTTON[variant.toUpperCase()] || COMPONENT.BUTTON.PRIMARY;
    
    // Ajustar padding según tamaño
    const sizeAdjustments = {
        small: 'px-3 py-1 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg'
    };
    
    const sizeClasses = sizeAdjustments[size] || sizeAdjustments.medium;
    
    return `${baseButton} ${sizeClasses}`;
};

/**
 * 🎨 OBTENER COLORES POR CONTEXTO
 * 
 * @param {string} context - Contexto: 'state', 'trip', 'budget'
 * @param {string} type - Tipo específico del contexto
 * @returns {object} Objeto con clases de colores: { bg, border, text, icon }
 */
export const getContextColors = (context, type) => {
    const contextMap = {
        state: COLOR_CONTEXTS.STATE,
        trip: COLOR_CONTEXTS.TRIP_PHASES,
        budget: COLOR_CONTEXTS.BUDGET_CATEGORIES
    };
    
    const colorContext = contextMap[context];
    if (!colorContext) return COLOR_CONTEXTS.STATE.INFO;
    
    return colorContext[type.toUpperCase()] || colorContext.INFO || Object.values(colorContext)[0];
};

/**
 * 📱 OBTENER CLASES RESPONSIVE
 * 
 * @param {string} type - Tipo: 'container', 'grid', 'padding'
 * @param {string} variant - Variante específica
 * @returns {string} Clases CSS responsive
 */
export const getResponsiveClasses = (type, variant = 'default') => {
    const typeMap = {
        container: RESPONSIVE.CONTAINER,
        grid: RESPONSIVE.GRID,
        padding: RESPONSIVE.PADDING
    };
    
    const responsiveType = typeMap[type];
    if (!responsiveType) return '';
    
    return responsiveType[variant.toUpperCase()] || Object.values(responsiveType)[0];
};

/**
 * 🔤 OBTENER ESTILOS DE TIPOGRAFÍA
 * 
 * @param {string} type - Tipo: 'heading', 'body'
 * @param {string} variant - Variante específica
 * @param {string} color - Color: 'primary', 'secondary', 'muted'
 * @returns {string} Clases CSS de tipografía
 */
export const getTypographyStyles = (type, variant = 'normal', color = 'primary') => {
    const typeMap = {
        heading: TYPOGRAPHY.HEADING,
        body: TYPOGRAPHY.BODY
    };
    
    const typography = typeMap[type] || TYPOGRAPHY.BODY;
    const textStyle = typography[variant.toUpperCase()] || typography.NORMAL || '';
    const textColor = TYPOGRAPHY.COLOR[color.toUpperCase()] || TYPOGRAPHY.COLOR.PRIMARY;
    
    return `${textStyle} ${textColor}`;
};

/**
 * 🌫️ COMBINAR SOMBRAS CON TRANSICIONES
 * 
 * @param {string} shadowLevel - Nivel de sombra: 'subtle', 'normal', 'prominent', 'dramatic'
 * @param {boolean} withHover - Si incluir efecto hover
 * @returns {string} Clases CSS de sombra con transiciones
 */
export const getShadowWithTransition = (shadowLevel = 'normal', withHover = false) => {
    const shadow = SHADOW[shadowLevel.toUpperCase()] || SHADOW.NORMAL;
    const transition = TRANSITION.NORMAL;
    
    if (withHover) {
        return `${shadow} ${transition} hover:shadow-xl`;
    }
    
    return `${shadow} ${transition}`;
};

/**
 * 🔘 OBTENER BORDER RADIUS CON OVERFLOW
 * 
 * @param {string} size - Tamaño: 'small', 'medium', 'large', 'xlarge', 'full'
 * @param {boolean} withOverflow - Si incluir overflow-hidden
 * @returns {string} Clases CSS de border radius
 */
export const getRadiusWithOverflow = (size = 'medium', withOverflow = false) => {
    const radius = RADIUS[size.toUpperCase()] || RADIUS.MEDIUM;
    
    if (withOverflow) {
        return `${radius} overflow-hidden`;
    }
    
    return radius;
};

/**
 * 📊 OBTENER COLORES DE CATEGORÍA DE PRESUPUESTO
 * 
 * @param {string} category - Nombre de la categoría
 * @returns {object} Objeto con clases de colores para la categoría
 */
export const getBudgetCategoryColors = (category) => {
    // Limpiar nombre de categoría (remover emojis y espacios extra)
    const cleanCategory = category
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .trim();
    
    // Mapeo de categorías a claves de design tokens
    const categoryMap = {
        'Ropa': 'CLOTHES',
        'Calzado': 'FOOTWEAR',
        'Equipo': 'EQUIPMENT',
        'Equipamiento': 'GEAR',
        'Documentos y Salud': 'HEALTH_DOCS',
        'Vuelos': 'FLIGHTS',
        'Alojamiento': 'ACCOMMODATION',
        'Transporte': 'TRANSPORT',
        'Comida': 'FOOD',
        'Comida y Bebida': 'FOOD',
        'Actividades': 'ACTIVITIES',
        'Visados': 'VISAS',
        'Entradas y Visados': 'VISAS',
        'Seguro': 'INSURANCE',
        'Tour': 'TOUR',
        'Varios': 'MISC',
        'Contingencia': 'CONTINGENCY'
    };
    
    const tokenKey = categoryMap[cleanCategory] || categoryMap[category] || 'MISC';
    return COLOR_CONTEXTS.BUDGET_CATEGORIES[tokenKey] || COLOR_CONTEXTS.BUDGET_CATEGORIES.MISC;
};

/**
 * 🎯 OBTENER ICONO CON TAMAÑO
 * 
 * @param {string} iconName - Nombre del icono Material Symbols
 * @param {string} size - Tamaño: 'small', 'medium', 'large', 'xlarge'
 * @param {string} color - Color personalizado (opcional)
 * @returns {string} HTML del icono con estilos
 */
export const getIconWithStyles = (iconName, size = 'medium', color = '') => {
    const iconSize = COMPONENT.ICON[size.toUpperCase()] || COMPONENT.ICON.MEDIUM;
    const colorClass = color || 'text-slate-600 dark:text-slate-400';
    
    return `<span class="material-symbols-outlined ${iconSize} ${colorClass}">${iconName}</span>`;
};

/**
 * 🔄 OBTENER CLASES DE TRANSICIÓN POR TIPO
 * 
 * @param {string} type - Tipo: 'fast', 'normal', 'slow', 'hover', 'focus', 'button'
 * @returns {string} Clases CSS de transición
 */
export const getTransitionClasses = (type = 'normal') => {
    return TRANSITION[type.toUpperCase()] || TRANSITION.NORMAL;
};

/**
 * 🎨 CREAR CLASES COMBINADAS PARA ELEMENTOS COMUNES
 * 
 * @param {string} element - Tipo de elemento: 'section', 'card', 'header', 'content'
 * @param {object} options - Opciones de personalización
 * @returns {string} Clases CSS combinadas
 */
export const getElementClasses = (element, options = {}) => {
    const {
        size = 'medium',
        shadow = 'normal',
        radius = 'medium',
        responsive = true,
        interactive = false
    } = options;
    
    const baseClasses = {
        section: `${responsive ? RESPONSIVE.CONTAINER.FULL : ''} ${SPACING.SECTION.LARGE} ${RESPONSIVE.PADDING.CONTENT}`,
        card: getCardStyles(interactive ? 'interactive' : 'base', size),
        header: `${TYPOGRAPHY.HEADING.SECTION} ${TYPOGRAPHY.COLOR.PRIMARY} mb-6`,
        content: `${TYPOGRAPHY.BODY.NORMAL} ${TYPOGRAPHY.COLOR.SECONDARY}`
    };
    
    return baseClasses[element] || '';
};

/**
 * 🚀 UTILIDADES DE EXPORTACIÓN POR DEFECTO
 */
export default {
    getCardStyles,
    getButtonStyles,
    getContextColors,
    getResponsiveClasses,
    getTypographyStyles,
    getShadowWithTransition,
    getRadiusWithOverflow,
    getBudgetCategoryColors,
    getIconWithStyles,
    getTransitionClasses,
    getElementClasses
};
