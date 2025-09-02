/**
 * ⚖️ WEIGHT ESTIMATOR - ESTIMADOR DE PESO DE MOCHILA
 * 
 * Sistema para estimar el peso total de la mochila basado en los artículos empacados
 * Incluye base de datos de pesos reales y alertas por límites
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class WeightEstimator {
    constructor() {
        this.weightLimits = {
            trekking: 15, // kg máximo para trekking
            city: 20,     // kg máximo para ciudad
            flight: 23    // kg máximo equipaje facturado
        };
        
        this.init();
    }
    
    init() {
        Logger.success('WeightEstimator initialized');
    }
    
    /**
     * Obtener peso de un item desde tripConfig
     */
    getItemWeight(itemKey) {
        // Buscar en todas las categorías del packingListData
        for (const [categoryName, items] of Object.entries(tripConfig.packingListData)) {
            const item = items.find(item => item.key === itemKey);
            if (item) {
                return item.weight || 100; // Usar peso del item o 100g por defecto
            }
        }
        
        // Peso por defecto si no se encuentra
        return 100; // 100g por defecto
    }
    
    /**
     * Obtener categoría de un item
     */
    getItemCategory(itemKey) {
        // Buscar en qué categoría está el item
        for (const [categoryName, items] of Object.entries(tripConfig.packingListData)) {
            const item = items.find(item => item.key === itemKey);
            if (item) {
                return categoryName;
            }
        }
        return 'Otros';
    }
    
    /**
     * Estima el peso de un artículo basado en su nombre
     */
    estimateItemWeight(itemName) {
        const normalizedName = this.normalizeItemName(itemName);
        
        // Buscar coincidencia exacta
        for (const [category, items] of Object.entries(this.weightDatabase)) {
            if (items[normalizedName]) {
                return items[normalizedName];
            }
        }
        
        // Buscar coincidencia parcial
        for (const [category, items] of Object.entries(this.weightDatabase)) {
            for (const [key, weight] of Object.entries(items)) {
                if (normalizedName.includes(key) || key.includes(normalizedName)) {
                    return weight;
                }
            }
        }
        
        // Estimación por categoría si no se encuentra
        return this.estimateByCategory(itemName);
    }
    
    normalizeItemName(name) {
        return name.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^\w_]/g, '');
    }
    
    estimateByCategory(itemName) {
        const name = itemName.toLowerCase();
        
        // Estimaciones por palabras clave
        if (name.includes('camiseta') || name.includes('camisa')) return 150;
        if (name.includes('pantalon') || name.includes('pantalón')) return 400;
        if (name.includes('chaqueta') || name.includes('abrigo')) return 350;
        if (name.includes('zapato') || name.includes('bota')) return 800;
        if (name.includes('calcetín') || name.includes('calcetines')) return 60;
        if (name.includes('ropa interior')) return 50;
        
        if (name.includes('mochila')) return 1500;
        if (name.includes('saco')) return 1000;
        if (name.includes('tienda')) return 1300;
        
        if (name.includes('móvil') || name.includes('teléfono')) return 200;
        if (name.includes('cámara')) return 400;
        if (name.includes('cargador')) return 100;
        
        if (name.includes('pasta') || name.includes('champú')) return 100;
        if (name.includes('medicamento') || name.includes('medicina')) return 150;
        
        if (name.includes('pasaporte')) return 50;
        if (name.includes('guía') || name.includes('libro')) return 250;
        
        // Peso por defecto
        return 200;
    }
    
    /**
     * Calcular peso total basado en items empacados
     */
    calculatePackedWeight(packedItems) {
        // Peso promedio por item: 0.15kg
        const averageWeight = 0.15;
        const totalWeight = packedItems * averageWeight;
        console.log(`🏋️ Weight calculation: ${packedItems} items × ${averageWeight}kg = ${totalWeight}kg`);
        return Math.round(totalWeight * 10) / 10; // Redondear a 1 decimal
    }
    
    /**
     * Calcular peso total basado en items empacados
     */
    calculateTotalWeight(packedItems) {
        console.log('🔍 WeightEstimator.calculateTotalWeight called with:', packedItems);
        let totalWeight = 0;
        const breakdown = {};
        
        // Check if packedItems is empty or has no true values
        const packedCount = Object.values(packedItems || {}).filter(Boolean).length;
        console.log('🔍 Packed items count:', packedCount);
        
        // If no items are packed, return zero weight
        if (packedCount === 0) {
            console.log('🔍 No items packed, returning zero weight');
            return {
                totalGrams: 0,
                totalKg: "0.0",
                totalFormatted: "0kg",
                breakdown: {},
                analysis: this.analyzeWeight(0)
            };
        }
        
        // Iterar sobre items empacados
        for (const [itemKey, isPacked] of Object.entries(packedItems)) {
            console.log(`🔍 Processing item: ${itemKey} = ${isPacked}`);
            if (isPacked) {
                const weight = this.getItemWeight(itemKey);
                console.log(`🔍 Item weight: ${itemKey} = ${weight}g`);
                totalWeight += weight;
                
                // Agrupar por categoría para breakdown
                const category = this.getItemCategory(itemKey);
                if (!breakdown[category]) breakdown[category] = 0;
                breakdown[category] += weight;
            }
        }
        
        console.log(`🔍 Total weight calculated: ${totalWeight}g`);
        
        const result = {
            totalGrams: totalWeight,
            totalKg: (totalWeight / 1000).toFixed(1),
            totalFormatted: this.formatWeight(totalWeight),
            breakdown,
            analysis: this.analyzeWeight(totalWeight)
        };
        
        console.log('🔍 Final weight result:', result);
        return result;
    }
    
    /**
     * Analiza el peso y proporciona recomendaciones
     */
    analyzeWeight(weightGrams) {
        const weightKg = weightGrams / 1000;
        const analysis = {
            weightKg: Math.round(weightKg * 10) / 10,
            status: 'ok',
            message: '',
            recommendations: [],
            limits: {}
        };
        
        // Evaluar contra límites
        Object.entries(this.weightLimits).forEach(([type, limit]) => {
            const percentage = (weightKg / limit) * 100;
            analysis.limits[type] = {
                limit: limit,
                percentage: Math.round(percentage),
                exceeded: weightKg > limit,
                remaining: Math.max(0, limit - weightKg)
            };
        });
        
        // Determinar estado general
        if (weightKg > this.weightLimits.flight) {
            analysis.status = 'critical';
            analysis.message = '⚠️ Excede límite de equipaje de vuelo';
            analysis.recommendations.push('Considera dejar artículos no esenciales');
            analysis.recommendations.push('Revisa si puedes usar ropa más ligera');
        } else if (weightKg > this.weightLimits.trekking) {
            analysis.status = 'warning';
            analysis.message = '⚠️ Pesado para trekking';
            analysis.recommendations.push('Ideal reducir peso para caminatas largas');
            analysis.recommendations.push('Considera equipamiento más ligero');
        } else if (weightKg > this.weightLimits.city) {
            analysis.status = 'caution';
            analysis.message = '⚠️ Algo pesado para ciudad';
            analysis.recommendations.push('Peso manejable pero considera optimizar');
        } else {
            analysis.status = 'excellent';
            analysis.message = '✅ Peso ideal para el viaje';
            analysis.recommendations.push('Excelente distribución de peso');
        }
        
        return analysis;
    }
    
    /**
     * Formatea peso en gramos a formato legible
     */
    formatWeight(grams) {
        if (grams === 0) {
            return "0kg";
        }
        
        if (grams >= 1000) {
            const kg = grams / 1000;
            // Always show one decimal place for weights >= 1kg
            return `${kg.toFixed(1)}kg`;
        } else {
            return `${Math.round(grams)}g`;
        }
    }
    
    /**
     * Genera recomendaciones para reducir peso
     */
    generateWeightReductions(breakdown) {
        const recommendations = [];
        
        // Analizar categorías más pesadas
        const sortedCategories = Object.entries(breakdown)
            .sort(([,a], [,b]) => b.weight - a.weight)
            .slice(0, 3);
        
        sortedCategories.forEach(([category, data]) => {
            if (data.weight > 2000) { // Más de 2kg
                recommendations.push({
                    category: category,
                    weight: data.weight,
                    suggestion: this.getCategoryReduction(category),
                    priority: 'high'
                });
            } else if (data.weight > 1000) { // Más de 1kg
                recommendations.push({
                    category: category,
                    weight: data.weight,
                    suggestion: this.getCategoryReduction(category),
                    priority: 'medium'
                });
            }
        });
        
        return recommendations;
    }
    
    getCategoryReduction(category) {
        const suggestions = {
            'Ropa': 'Lleva menos mudas y lava más frecuentemente',
            'Equipamiento': 'Considera equipamiento más ligero o compartido',
            'Electrónicos': 'Evalúa si necesitas todos los dispositivos',
            'Higiene': 'Usa productos sólidos y tamaños de viaje',
            'Varios': 'Revisa artículos no esenciales'
        };
        
        return suggestions[category] || 'Revisa artículos no esenciales';
    }
    
    /**
     * Crea widget de peso para la UI
     */
    createWeightWidget(containerId, packedItems) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const weightData = this.calculateTotalWeight(packedItems);
        const analysis = weightData.analysis;
        
        const statusColors = {
            excellent: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700',
            ok: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-700',
            caution: 'from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-700',
            warning: 'from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-orange-200 dark:border-orange-700',
            critical: 'from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-700'
        };
        
        const statusIcons = {
            excellent: 'check_circle',
            ok: 'luggage',
            caution: 'warning',
            warning: 'error',
            critical: 'dangerous'
        };
        
        container.innerHTML = `
            <div class="weight-estimator-widget">
                <div class="p-4 bg-gradient-to-r ${statusColors[analysis.status]} rounded-xl border mb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-2xl">
                                ${statusIcons[analysis.status]}
                            </span>
                            <div>
                                <h3 class="font-semibold text-slate-900 dark:text-white">Peso Total</h3>
                                <p class="text-sm text-slate-600 dark:text-slate-400">${analysis.message}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${weightData.totalFormatted}</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">${analysis.weightKg}kg</div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-4">
                    ${Object.entries(analysis.limits).map(([type, limit]) => `
                        <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                            <div class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                                ${type}
                            </div>
                            <div class="text-sm font-bold ${limit.exceeded ? 'text-red-600' : 'text-green-600'}">
                                ${limit.percentage}%
                            </div>
                            <div class="text-xs text-slate-500">
                                ${limit.limit}kg máx
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="space-y-2">
                    <h4 class="font-medium text-slate-900 dark:text-white">Desglose por Categoría</h4>
                    ${Object.entries(weightData.breakdown)
                        .filter(([,data]) => data.count > 0)
                        .sort(([,a], [,b]) => b.weight - a.weight)
                        .map(([category, data]) => `
                            <div class="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                <span class="text-sm">${category} (${data.count})</span>
                                <span class="font-medium">${this.formatWeight(data.weight)}</span>
                            </div>
                        `).join('')}
                </div>
                
                ${analysis.recommendations.length > 0 ? `
                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Recomendaciones</h4>
                        <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            ${analysis.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Actualiza el widget cuando cambian los items empacados
     */
    updateWeightWidget(containerId, packedItems) {
        this.createWeightWidget(containerId, packedItems);
    }
}

// Exportar instancia singleton
export const weightEstimator = new WeightEstimator();
export default weightEstimator;
