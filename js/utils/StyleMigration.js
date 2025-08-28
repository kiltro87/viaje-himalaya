/**
 * 🔄 STYLE MIGRATION UTILITY
 * 
 * Utilidad para migrar estilos inconsistentes a Design Tokens.
 * Proporciona funciones de ayuda para detectar y corregir patrones
 * de estilo que no siguen las convenciones del sistema de diseño.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { RADIUS, SHADOW, SPACING } from '../config/DesignTokens.js';

/**
 * 🔍 DETECTAR CLASES INCONSISTENTES
 * 
 * @param {string} classString - String de clases CSS
 * @returns {object} Objeto con clases inconsistentes detectadas
 */
export const detectInconsistencies = (classString) => {
    const inconsistencies = {
        radius: [],
        shadow: [],
        spacing: []
    };

    // Detectar border radius inconsistentes
    const radiusMatches = classString.match(/rounded-\w+/g) || [];
    const standardRadius = Object.values(RADIUS);
    
    radiusMatches.forEach(radiusClass => {
        if (!standardRadius.includes(radiusClass)) {
            inconsistencies.radius.push(radiusClass);
        }
    });

    // Detectar sombras inconsistentes
    const shadowMatches = classString.match(/shadow-\w+/g) || [];
    const standardShadows = Object.values(SHADOW);
    
    shadowMatches.forEach(shadowClass => {
        if (!standardShadows.includes(shadowClass)) {
            inconsistencies.shadow.push(shadowClass);
        }
    });

    return inconsistencies;
};

/**
 * 🔧 MIGRAR CLASES A DESIGN TOKENS
 * 
 * @param {string} classString - String de clases CSS originales
 * @returns {string} String de clases CSS migradas
 */
export const migrateToDesignTokens = (classString) => {
    let migratedClasses = classString;

    // Mapeo de migración para border radius
    const radiusMigration = {
        'rounded': RADIUS.MEDIUM,        // rounded -> rounded-xl
        'rounded-md': RADIUS.SMALL,     // rounded-md -> rounded-lg
        'rounded-lg': RADIUS.SMALL,     // mantener
        'rounded-xl': RADIUS.MEDIUM,    // mantener
        'rounded-2xl': RADIUS.LARGE,    // mantener
        'rounded-3xl': RADIUS.XLARGE    // mantener
    };

    // Mapeo de migración para shadows
    const shadowMigration = {
        'shadow': SHADOW.NORMAL,        // shadow -> shadow-lg
        'shadow-sm': SHADOW.SUBTLE,     // mantener
        'shadow-md': SHADOW.NORMAL,     // shadow-md -> shadow-lg
        'shadow-lg': SHADOW.NORMAL,     // mantener
        'shadow-xl': SHADOW.PROMINENT,  // mantener
        'shadow-2xl': SHADOW.DRAMATIC   // mantener
    };

    // Aplicar migraciones de radius
    Object.entries(radiusMigration).forEach(([oldClass, newClass]) => {
        const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
        migratedClasses = migratedClasses.replace(regex, newClass);
    });

    // Aplicar migraciones de shadow
    Object.entries(shadowMigration).forEach(([oldClass, newClass]) => {
        const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
        migratedClasses = migratedClasses.replace(regex, newClass);
    });

    return migratedClasses;
};

/**
 * 📊 GENERAR REPORTE DE MIGRACIÓN
 * 
 * @param {string} filePath - Ruta del archivo
 * @param {string} originalClasses - Clases originales
 * @param {string} migratedClasses - Clases migradas
 * @returns {object} Reporte de migración
 */
export const generateMigrationReport = (filePath, originalClasses, migratedClasses) => {
    const originalInconsistencies = detectInconsistencies(originalClasses);
    const migratedInconsistencies = detectInconsistencies(migratedClasses);

    return {
        file: filePath,
        original: {
            classes: originalClasses,
            inconsistencies: originalInconsistencies,
            issueCount: Object.values(originalInconsistencies).flat().length
        },
        migrated: {
            classes: migratedClasses,
            inconsistencies: migratedInconsistencies,
            issueCount: Object.values(migratedInconsistencies).flat().length
        },
        improved: originalInconsistencies.issueCount > migratedInconsistencies.issueCount
    };
};

export default {
    detectInconsistencies,
    migrateToDesignTokens,
    generateMigrationReport
};
