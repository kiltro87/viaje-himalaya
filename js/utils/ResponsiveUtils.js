/**
 * ResponsiveUtils - Utilidades para Diseño Responsive
 * 
 * Conjunto de utilidades para detectar breakpoints, gestionar
 * comportamiento responsive y adaptar la interfaz según el dispositivo.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import { BREAKPOINTS } from '../config/AppConstants.js';
import Logger from './Logger.js';

export class ResponsiveUtils {
    /**
     * Detectar breakpoint actual
     * @returns {string} Breakpoint actual ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
     */
    static getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width >= BREAKPOINTS.XXL) return '2xl';
        if (width >= BREAKPOINTS.XL) return 'xl';
        if (width >= BREAKPOINTS.LG) return 'lg';
        if (width >= BREAKPOINTS.MD) return 'md';
        if (width >= BREAKPOINTS.SM) return 'sm';
        return 'xs';
    }

    /**
     * Verificar si estamos en un breakpoint específico o superior
     * @param {string} breakpoint - Breakpoint a verificar
     * @returns {boolean} True si estamos en ese breakpoint o superior
     */
    static isBreakpointOrAbove(breakpoint) {
        const current = ResponsiveUtils.getCurrentBreakpoint();
        const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        
        const currentIndex = breakpointOrder.indexOf(current);
        const targetIndex = breakpointOrder.indexOf(breakpoint);
        
        return currentIndex >= targetIndex;
    }

    /**
     * Verificar si estamos en móvil
     * @returns {boolean} True si estamos en móvil
     */
    static isMobile() {
        return !ResponsiveUtils.isBreakpointOrAbove('md');
    }

    /**
     * Verificar si estamos en tablet
     * @returns {boolean} True si estamos en tablet
     */
    static isTablet() {
        const current = ResponsiveUtils.getCurrentBreakpoint();
        return current === 'md' || current === 'lg';
    }

    /**
     * Verificar si estamos en desktop
     * @returns {boolean} True si estamos en desktop
     */
    static isDesktop() {
        return ResponsiveUtils.isBreakpointOrAbove('xl');
    }

    /**
     * Obtener clases CSS responsive para un elemento
     * @param {Object} config - Configuración de clases por breakpoint
     * @returns {string} Clases CSS concatenadas
     */
    static getResponsiveClasses(config) {
        const classes = [];
        
        // Clase base (xs)
        if (config.base || config.xs) {
            classes.push(config.base || config.xs);
        }
        
        // Clases por breakpoint
        ['sm', 'md', 'lg', 'xl', '2xl'].forEach(bp => {
            if (config[bp]) {
                classes.push(`${bp}:${config[bp]}`);
            }
        });
        
        return classes.join(' ');
    }

    /**
     * Configurar observer para cambios de breakpoint
     * @param {Function} callback - Función a ejecutar cuando cambie el breakpoint
     * @returns {Function} Función para limpiar el observer
     */
    static observeBreakpointChanges(callback) {
        let currentBreakpoint = ResponsiveUtils.getCurrentBreakpoint();
        
        const checkBreakpoint = () => {
            const newBreakpoint = ResponsiveUtils.getCurrentBreakpoint();
            if (newBreakpoint !== currentBreakpoint) {
                const previousBreakpoint = currentBreakpoint;
                currentBreakpoint = newBreakpoint;
                
                Logger.responsive(`Breakpoint changed: ${previousBreakpoint} → ${newBreakpoint}`, {
                    width: window.innerWidth,
                    previous: previousBreakpoint,
                    current: newBreakpoint
                });
                
                callback(newBreakpoint, previousBreakpoint);
            }
        };
        
        window.addEventListener('resize', checkBreakpoint);
        
        // Retornar función de limpieza
        return () => {
            window.removeEventListener('resize', checkBreakpoint);
        };
    }

    /**
     * Obtener configuración de grid responsive
     * @param {Object} columns - Número de columnas por breakpoint
     * @returns {string} Clases de grid responsive
     */
    static getGridClasses(columns) {
        const defaultColumns = {
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 5,
            '2xl': 6,
            ...columns
        };
        
        return ResponsiveUtils.getResponsiveClasses({
            base: `grid-cols-${defaultColumns.xs}`,
            sm: `grid-cols-${defaultColumns.sm}`,
            md: `grid-cols-${defaultColumns.md}`,
            lg: `grid-cols-${defaultColumns.lg}`,
            xl: `grid-cols-${defaultColumns.xl}`,
            '2xl': `grid-cols-${defaultColumns['2xl']}`
        });
    }

    /**
     * Obtener configuración de padding responsive
     * @param {Object} padding - Padding por breakpoint
     * @returns {string} Clases de padding responsive
     */
    static getPaddingClasses(padding) {
        const defaultPadding = {
            xs: 'p-4',
            sm: 'p-6',
            md: 'p-8',
            lg: 'p-12',
            ...padding
        };
        
        return ResponsiveUtils.getResponsiveClasses(defaultPadding);
    }

    /**
     * Obtener configuración de texto responsive
     * @param {Object} sizes - Tamaños de texto por breakpoint
     * @returns {string} Clases de texto responsive
     */
    static getTextClasses(sizes) {
        const defaultSizes = {
            xs: 'text-base',
            sm: 'text-lg',
            md: 'text-xl',
            lg: 'text-2xl',
            ...sizes
        };
        
        return ResponsiveUtils.getResponsiveClasses(defaultSizes);
    }

    /**
     * Adaptar contenido según el dispositivo
     * @param {Object} content - Contenido por tipo de dispositivo
     * @returns {any} Contenido adaptado al dispositivo actual
     */
    static adaptContentForDevice(content) {
        if (ResponsiveUtils.isMobile() && content.mobile) {
            return content.mobile;
        }
        
        if (ResponsiveUtils.isTablet() && content.tablet) {
            return content.tablet;
        }
        
        if (ResponsiveUtils.isDesktop() && content.desktop) {
            return content.desktop;
        }
        
        return content.default || content;
    }

    /**
     * Obtener información completa del viewport
     * @returns {Object} Información del viewport
     */
    static getViewportInfo() {
        const breakpoint = ResponsiveUtils.getCurrentBreakpoint();
        
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            breakpoint,
            isMobile: ResponsiveUtils.isMobile(),
            isTablet: ResponsiveUtils.isTablet(),
            isDesktop: ResponsiveUtils.isDesktop(),
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }
}
