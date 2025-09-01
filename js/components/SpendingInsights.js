/**
 * SpendingInsights - Simple Analytics for Expense Data
 * 
 * Provides basic analytics and insights on existing expense data without
 * complex dependencies. Shows spending patterns, category breakdowns,
 * and budget progress with simple visualizations.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { ANALYTICS } from '../config/DesignTokens.js';
import Logger from '../utils/Logger.js';

export class SpendingInsights {
    constructor(budgetManager) {
        this.budgetManager = budgetManager;
        this.insights = null;
        this.init();
    }

    init() {
        if (Logger && Logger.info) Logger.info('SpendingInsights initialized', { budgetManager: !!this.budgetManager });
    }

    /**
     * Calculate comprehensive spending insights
     */
    calculateInsights() {
        try {
            const expenses = this.getExpenses();
            const budget = this.getBudget();
            
            this.insights = {
                overview: this.calculateOverview(expenses, budget),
                categories: this.calculateCategoryInsights(expenses, budget),
                trends: this.calculateTrends(expenses),
                recommendations: this.generateRecommendations(expenses, budget)
            };

            Logger.success('Spending insights calculated', {
                totalExpenses: expenses.length,
                categoriesAnalyzed: Object.keys(this.insights.categories).length
            });

            return this.insights;
        } catch (error) {
            Logger.error('Failed to calculate spending insights', error);
            return null;
        }
    }

    getExpenses() {
        // Get expenses from budget manager or localStorage
        try {
            const saved = localStorage.getItem('viaje-expenses');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    getBudget() {
        // Get budget data from tripConfig or budget manager
        try {
            if (this.budgetManager && this.budgetManager.tripConfig) {
                return this.budgetManager.tripConfig.budgetData;
            }
            return {};
        } catch {
            return {};
        }
    }

    calculateOverview(expenses, budget) {
        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalBudget = Object.values(budget).reduce((sum, cat) => {
            return sum + (cat.items ? cat.items.reduce((s, item) => s + item.amount, 0) : 0);
        }, 0);

        const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        const remaining = Math.max(0, totalBudget - totalSpent);

        return {
            totalSpent,
            totalBudget,
            remaining,
            spentPercentage: Math.round(spentPercentage * 100) / 100,
            status: this.getSpendingStatus(spentPercentage)
        };
    }

    calculateCategoryInsights(expenses, budget) {
        const categories = {};
        
        // Group expenses by category
        expenses.forEach(expense => {
            const category = expense.category || 'MISC';
            if (!categories[category]) {
                categories[category] = {
                    spent: 0,
                    budget: 0,
                    count: 0,
                    expenses: []
                };
            }
            
            categories[category].spent += expense.amount;
            categories[category].count += 1;
            categories[category].expenses.push(expense);
        });

        // Add budget information
        Object.keys(budget).forEach(categoryKey => {
            const category = budget[categoryKey];
            const categoryName = categoryKey.toUpperCase();
            
            if (!categories[categoryName]) {
                categories[categoryName] = {
                    spent: 0,
                    budget: 0,
                    count: 0,
                    expenses: []
                };
            }
            
            if (category.items) {
                categories[categoryName].budget = category.items.reduce((sum, item) => sum + item.amount, 0);
            }
        });

        // Calculate percentages and status for each category
        Object.keys(categories).forEach(categoryName => {
            const cat = categories[categoryName];
            cat.percentage = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
            cat.remaining = Math.max(0, cat.budget - cat.spent);
            cat.status = this.getSpendingStatus(cat.percentage);
            cat.averageExpense = cat.count > 0 ? cat.spent / cat.count : 0;
        });

        return categories;
    }

    calculateTrends(expenses) {
        if (expenses.length === 0) return { daily: [], weekly: [], topDays: [] };

        // Sort expenses by date
        const sortedExpenses = expenses
            .filter(e => e.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Daily spending
        const dailySpending = {};
        sortedExpenses.forEach(expense => {
            const date = expense.date.split('T')[0]; // Get date part only
            dailySpending[date] = (dailySpending[date] || 0) + expense.amount;
        });

        // Convert to array and calculate moving average
        const daily = Object.entries(dailySpending)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find top spending days
        const topDays = Object.entries(dailySpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([date, amount]) => ({ date, amount }));

        return {
            daily,
            topDays,
            totalDays: Object.keys(dailySpending).length,
            averageDaily: daily.length > 0 ? daily.reduce((sum, d) => sum + d.amount, 0) / daily.length : 0
        };
    }

    generateRecommendations(expenses, budget) {
        const recommendations = [];
        const overview = this.calculateOverview(expenses, budget);
        const categories = this.calculateCategoryInsights(expenses, budget);

        // Budget status recommendations
        if (overview.spentPercentage > 90) {
            recommendations.push({
                type: 'warning',
                title: 'Presupuesto casi agotado',
                message: `Has gastado el ${overview.spentPercentage.toFixed(1)}% de tu presupuesto total.`,
                action: 'Revisa tus gastos restantes y considera ajustar el plan.'
            });
        } else if (overview.spentPercentage > 75) {
            recommendations.push({
                type: 'info',
                title: 'Controla el presupuesto',
                message: `Llevas gastado el ${overview.spentPercentage.toFixed(1)}% del presupuesto.`,
                action: 'Mantén un ojo en los gastos para no excederte.'
            });
        }

        // Category-specific recommendations
        Object.entries(categories).forEach(([categoryName, cat]) => {
            if (cat.percentage > 100) {
                recommendations.push({
                    type: 'error',
                    title: `Exceso en ${categoryName}`,
                    message: `Has excedido el presupuesto de ${categoryName} en €${(cat.spent - cat.budget).toFixed(2)}.`,
                    action: 'Considera reducir gastos en esta categoría.'
                });
            } else if (cat.percentage > 80) {
                recommendations.push({
                    type: 'warning',
                    title: `Cuidado con ${categoryName}`,
                    message: `Has gastado el ${cat.percentage.toFixed(1)}% del presupuesto en ${categoryName}.`,
                    action: 'Modera los gastos en esta categoría.'
                });
            }
        });

        // Positive recommendations
        if (overview.spentPercentage < 50) {
            recommendations.push({
                type: 'success',
                title: '¡Buen control del presupuesto!',
                message: `Solo has gastado el ${overview.spentPercentage.toFixed(1)}% de tu presupuesto.`,
                action: 'Puedes permitirte algunos gastos extra si quieres.'
            });
        }

        return recommendations.slice(0, 5); // Limit to 5 recommendations
    }

    getSpendingStatus(percentage) {
        if (percentage > 100) return 'over';
        if (percentage > 90) return 'critical';
        if (percentage > 75) return 'warning';
        if (percentage > 50) return 'moderate';
        return 'good';
    }

    /**
     * Render insights as HTML
     */
    renderInsights() {
        if (!this.insights) {
            this.calculateInsights();
        }

        if (!this.insights) {
            return '<div class="text-center text-slate-500">No hay datos suficientes para mostrar insights</div>';
        }

        return `
            <div class="space-y-6">
                ${this.renderOverview()}
                ${this.renderCategoryBreakdown()}
                ${this.renderRecommendations()}
            </div>
        `;
    }

    renderOverview() {
        const { overview } = this.insights;
        const statusColor = this.getStatusColor(overview.status);

        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    📊 Resumen de Gastos
                </h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-slate-900 dark:text-white">
                            €${overview.totalSpent.toFixed(2)}
                        </div>
                        <div class="text-sm text-slate-500">Gastado</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-slate-900 dark:text-white">
                            €${overview.remaining.toFixed(2)}
                        </div>
                        <div class="text-sm text-slate-500">Restante</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold ${statusColor}">
                            ${overview.spentPercentage.toFixed(1)}%
                        </div>
                        <div class="text-sm text-slate-500">del Presupuesto</div>
                    </div>
                </div>
                
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div class="h-3 rounded-full ${this.getProgressBarColor(overview.status)}" 
                         style="width: ${Math.min(100, overview.spentPercentage)}%"></div>
                </div>
            </div>
        `;
    }

    renderCategoryBreakdown() {
        const { categories } = this.insights;
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => b.spent - a.spent)
            .slice(0, 6); // Show top 6 categories

        if (Logger && Logger.info) Logger.info('Generated spending insights', { totalSpent: sortedCategories.reduce((sum, [,cat]) => sum + cat.spent, 0), budgetUsed: sortedCategories.reduce((sum, [,cat]) => sum + cat.budget, 0), categories: sortedCategories.length });

        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    🏷️ Gastos por Categoría
                </h3>
                
                <div class="space-y-3">
                    ${sortedCategories.map(([name, cat]) => `
                        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div class="flex-1">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-medium text-slate-900 dark:text-white">${name}</span>
                                    <span class="text-sm ${this.getStatusColor(cat.status)}">
                                        €${cat.spent.toFixed(2)} / €${cat.budget.toFixed(2)}
                                    </span>
                                </div>
                                <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                    <div class="h-2 rounded-full ${this.getProgressBarColor(cat.status)}" 
                                         style="width: ${Math.min(100, cat.percentage)}%"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderRecommendations() {
        const { recommendations } = this.insights;
        
        if (recommendations.length === 0) {
            return '';
        }

        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    💡 Recomendaciones
                </h3>
                
                <div class="space-y-3">
                    ${recommendations.map(rec => `
                        <div class="p-4 rounded-lg ${this.getRecommendationBg(rec.type)} border-l-4 ${this.getRecommendationBorder(rec.type)}">
                            <div class="font-medium ${this.getRecommendationText(rec.type)} mb-1">
                                ${rec.title}
                            </div>
                            <div class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                ${rec.message}
                            </div>
                            <div class="text-xs text-slate-500">
                                ${rec.action}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getStatusColor(status) {
        const colors = {
            'good': 'text-green-600 dark:text-green-400',
            'moderate': 'text-blue-600 dark:text-blue-400',
            'warning': 'text-amber-600 dark:text-amber-400',
            'critical': 'text-red-600 dark:text-red-400',
            'over': 'text-red-700 dark:text-red-300'
        };
        return colors[status] || colors.good;
    }

    getProgressBarColor(status) {
        const colors = {
            'good': 'bg-green-500',
            'moderate': 'bg-blue-500',
            'warning': 'bg-amber-500',
            'critical': 'bg-red-500',
            'over': 'bg-red-600'
        };
        return colors[status] || colors.good;
    }

    getRecommendationBg(type) {
        const backgrounds = {
            'success': 'bg-green-50 dark:bg-green-900/20',
            'info': 'bg-blue-50 dark:bg-blue-900/20',
            'warning': 'bg-amber-50 dark:bg-amber-900/20',
            'error': 'bg-red-50 dark:bg-red-900/20'
        };
        return backgrounds[type] || backgrounds.info;
    }

    getRecommendationBorder(type) {
        const borders = {
            'success': 'border-green-400',
            'info': 'border-blue-400',
            'warning': 'border-amber-400',
            'error': 'border-red-400'
        };
        return borders[type] || borders.info;
    }

    getRecommendationText(type) {
        const colors = {
            'success': 'text-green-700 dark:text-green-300',
            'info': 'text-blue-700 dark:text-blue-300',
            'warning': 'text-amber-700 dark:text-amber-300',
            'error': 'text-red-700 dark:text-red-300'
        };
        return colors[type] || colors.info;
    }

    // Public methods
    refresh() {
        this.calculateInsights();
        if (Logger && Logger.info) Logger.info('SpendingInsights refreshed');
    }

    getInsights() {
        if (!this.insights) {
            this.calculateInsights();
        }
        return this.insights;
    }
}

export default SpendingInsights;
