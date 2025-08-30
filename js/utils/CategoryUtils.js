/**
 * CategoryUtils - Utilidades para Categorías
 * 
 * Módulo centralizado para manejar iconos y colores de categorías,
 * eliminando duplicación de código entre BudgetManager y otros componentes.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from BudgetManager.js, UIRenderer.js
 */

import Logger from './Logger.js';

/**
 * 🎨 OBTENER ICONO DE CATEGORÍA DE PRESUPUESTO
 */
export function getBudgetCategoryIcon(category) {
    const icons = {
        'Transporte': 'directions_bus',
        'Tour': 'tour',
        'Comida y Bebida': 'restaurant',
        'Entradas y Visados': 'confirmation_number',
        'Varios': 'more_horiz',
        'Contingencia': 'emergency',
        // Categorías adicionales para compatibilidad
        'Vuelos': 'flight',
        'Alojamiento': 'hotel',
        'Comida': 'restaurant',
        'Actividades': 'hiking',
        'Compras': 'shopping_bag',
        'Otros': 'category',
        'Emergencia': 'emergency'
    };
    
    return icons[category] || 'category';
}

/**
 * 🎨 OBTENER ICONO DE CATEGORÍA DE EQUIPAJE
 */
export function getPackingCategoryIcon(category) {
    // Limpiar emojis de la categoría
    const cleanCategory = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    
    const icons = {
        'Ropa': 'checkroom',
        'Calzado': 'footprint', 
        'Equipo': 'backpack',
        'Documentos y Salud': 'medical_services',
        'Otros': 'inventory_2'
    };
    
    return icons[cleanCategory] || 'inventory_2';
}

/**
 * 🎨 OBTENER COLORES DE CATEGORÍA DE PRESUPUESTO
 */
export function getBudgetCategoryColors(category) {
    const colors = {
        'Transporte': {
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            text: 'text-orange-800 dark:text-orange-200',
            border: 'border-orange-200 dark:border-orange-800',
            icon: 'text-orange-600 dark:text-orange-400'
        },
        'Tour': {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-800 dark:text-blue-200',
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'text-blue-600 dark:text-blue-400'
        },
        'Comida y Bebida': {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-800 dark:text-green-200',
            border: 'border-green-200 dark:border-green-800',
            icon: 'text-green-600 dark:text-green-400'
        },
        'Entradas y Visados': {
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-800 dark:text-purple-200',
            border: 'border-purple-200 dark:border-purple-800',
            icon: 'text-purple-600 dark:text-purple-400'
        },
        'Varios': {
            bg: 'bg-slate-100 dark:bg-slate-700',
            text: 'text-slate-800 dark:text-slate-200',
            border: 'border-slate-200 dark:border-slate-600',
            icon: 'text-slate-600 dark:text-slate-400'
        },
        'Contingencia': {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-800 dark:text-red-200',
            border: 'border-red-200 dark:border-red-800',
            icon: 'text-red-600 dark:text-red-400'
        },
        // Categorías adicionales para compatibilidad
        'Vuelos': {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-800 dark:text-blue-200',
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'text-blue-600 dark:text-blue-400'
        },
        'Alojamiento': {
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-800 dark:text-purple-200',
            border: 'border-purple-200 dark:border-purple-800',
            icon: 'text-purple-600 dark:text-purple-400'
        },
        'Comida': {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-800 dark:text-green-200',
            border: 'border-green-200 dark:border-green-800',
            icon: 'text-green-600 dark:text-green-400'
        },
        'Actividades': {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-800 dark:text-red-200',
            border: 'border-red-200 dark:border-red-800',
            icon: 'text-red-600 dark:text-red-400'
        },
        'Compras': {
            bg: 'bg-pink-100 dark:bg-pink-900/30',
            text: 'text-pink-800 dark:text-pink-200',
            border: 'border-pink-200 dark:border-pink-800',
            icon: 'text-pink-600 dark:text-pink-400'
        },
        'Otros': {
            bg: 'bg-slate-100 dark:bg-slate-700',
            text: 'text-slate-800 dark:text-slate-200',
            border: 'border-slate-200 dark:border-slate-600',
            icon: 'text-slate-600 dark:text-slate-400'
        },
        'Emergencia': {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-800 dark:text-red-200',
            border: 'border-red-200 dark:border-red-800',
            icon: 'text-red-600 dark:text-red-400'
        }
    };
    
    return colors[category] || colors['Varios'];
}

/**
 * 🎨 OBTENER ICONO GENERAL DE CATEGORÍA
 * Función genérica que delega a las específicas según el tipo
 */
export function getCategoryIcon(category, type = 'budget') {
    switch (type) {
        case 'budget':
            return getBudgetCategoryIcon(category);
        case 'packing':
            return getPackingCategoryIcon(category);
        default:
            Logger.warning(`⚠️ Unknown category type: ${type}`);
            return 'category';
    }
}

/**
 * 🎨 OBTENER COLORES GENERALES DE CATEGORÍA
 * Función genérica que delega a las específicas según el tipo
 */
export function getCategoryColors(category, type = 'budget') {
    switch (type) {
        case 'budget':
            return getBudgetCategoryColors(category);
        default:
            Logger.warning(`⚠️ Unknown category type: ${type}`);
            return getBudgetCategoryColors('Otros');
    }
}

/**
 * 📊 VALIDAR CATEGORÍA
 * Verifica si una categoría es válida para un tipo específico
 */
export function isValidCategory(category, type = 'budget') {
    const validCategories = {
        budget: ['Transporte', 'Tour', 'Comida y Bebida', 'Entradas y Visados', 'Varios', 'Contingencia', 'Vuelos', 'Alojamiento', 'Comida', 'Actividades', 'Compras', 'Otros', 'Emergencia'],
        packing: ['Ropa', 'Calzado', 'Equipo', 'Documentos y Salud', 'Otros']
    };
    
    return validCategories[type]?.includes(category) || false;
}

/**
 * 📋 OBTENER TODAS LAS CATEGORÍAS
 * Devuelve la lista completa de categorías para un tipo específico
 */
export function getAllCategories(type = 'budget') {
    const categories = {
        budget: ['Transporte', 'Tour', 'Comida y Bebida', 'Entradas y Visados', 'Varios', 'Contingencia', 'Vuelos', 'Alojamiento', 'Comida', 'Actividades', 'Compras', 'Otros', 'Emergencia'],
        packing: ['Ropa', 'Calzado', 'Equipo', 'Documentos y Salud', 'Otros']
    };
    
    return categories[type] || [];
}

Logger.debug('📦 CategoryUtils module loaded');
