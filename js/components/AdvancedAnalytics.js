/**
 * AdvancedAnalytics - Enhanced Spending Insights with Charts
 * 
 * Provides advanced analytics with interactive charts and visualizations
 * for comprehensive spending analysis and budget tracking.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { ANALYTICS } from '../config/DesignTokens.js';
import Logger from '../utils/Logger.js';

export class AdvancedAnalytics {
    constructor(budgetManager) {
        this.budgetManager = budgetManager;
        this.chartInstances = new Map();
        this.chartLibraryLoaded = false;
        this.insights = null;
    }

    async init() {
        await this.loadChartLibrary();
        Logger.success('AdvancedAnalytics initialized');
    }

    async loadChartLibrary() {
        if (this.chartLibraryLoaded || window.Chart) {
            this.chartLibraryLoaded = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = () => {
                this.chartLibraryLoaded = true;
                this.setupChartDefaults();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupChartDefaults() {
        if (!window.Chart) return;

        Chart.defaults.font.family = 'Roboto, sans-serif';
        Chart.defaults.color = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary').trim() || '#1e293b';
        
        // Responsive defaults
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        
        // Animation defaults
        Chart.defaults.animation.duration = 750;
        Chart.defaults.animation.easing = 'easeOutQuart';
    }

    calculateAdvancedInsights() {
        const expenses = this.getExpenses();
        const budget = this.getBudget();
        
        this.insights = {
            overview: this.calculateOverview(expenses, budget),
            categories: this.calculateCategoryInsights(expenses, budget),
            trends: this.calculateTrends(expenses),
            predictions: this.calculatePredictions(expenses, budget),
            comparisons: this.calculateComparisons(expenses, budget)
        };

        return this.insights;
    }

    getExpenses() {
        try {
            const saved = localStorage.getItem('viaje-expenses');
            return saved ? JSON.parse(saved) : this.generateSampleData();
        } catch {
            return this.generateSampleData();
        }
    }

    getBudget() {
        try {
            if (this.budgetManager?.tripConfig?.budgetData) {
                return this.budgetManager.tripConfig.budgetData;
            }
            return this.generateSampleBudget();
        } catch {
            return this.generateSampleBudget();
        }
    }

    generateSampleData() {
        const categories = ['ACCOMMODATION', 'FOOD', 'TRANSPORT', 'ACTIVITIES', 'MISC'];
        const expenses = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 50; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + Math.floor(i / 2));
            
            expenses.push({
                id: `expense-${i}`,
                amount: Math.floor(Math.random() * 200) + 10,
                category: categories[Math.floor(Math.random() * categories.length)],
                description: `Sample expense ${i + 1}`,
                date: date.toISOString()
            });
        }

        return expenses;
    }

    generateSampleBudget() {
        return {
            ACCOMMODATION: { items: [{ amount: 2000 }] },
            FOOD: { items: [{ amount: 1500 }] },
            TRANSPORT: { items: [{ amount: 1000 }] },
            ACTIVITIES: { items: [{ amount: 800 }] },
            MISC: { items: [{ amount: 500 }] }
        };
    }

    calculateOverview(expenses, budget) {
        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalBudget = Object.values(budget).reduce((sum, cat) => {
            return sum + (cat.items ? cat.items.reduce((s, item) => s + item.amount, 0) : 0);
        }, 0);

        const dailyAverage = this.calculateDailyAverage(expenses);
        const daysRemaining = 14; // Simple fixed value for demo
        const projectedTotal = totalSpent + (dailyAverage * daysRemaining);
        const burnRate = this.calculateDailyAverage(expenses.slice(-7)); // Last 7 expenses

        return {
            totalSpent,
            totalBudget,
            remaining: Math.max(0, totalBudget - totalSpent),
            spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
            dailyAverage,
            projectedTotal,
            daysRemaining,
            burnRate
        };
    }

    calculateCategoryInsights(expenses, budget) {
        const categories = {};
        
        // Process expenses by category
        expenses.forEach(expense => {
            const category = expense.category || 'MISC';
            if (!categories[category]) {
                categories[category] = {
                    spent: 0,
                    budget: 0,
                    count: 0,
                    expenses: [],
                    trend: 0
                };
            }
            
            categories[category].spent += expense.amount;
            categories[category].count += 1;
            categories[category].expenses.push(expense);
        });

        // Add budget information and calculate trends
        Object.keys(budget).forEach(categoryKey => {
            const category = budget[categoryKey];
            const categoryName = categoryKey.toUpperCase();
            
            if (!categories[categoryName]) {
                categories[categoryName] = {
                    spent: 0,
                    budget: 0,
                    count: 0,
                    expenses: [],
                    trend: 0
                };
            }
            
            if (category.items) {
                categories[categoryName].budget = category.items.reduce((sum, item) => sum + item.amount, 0);
            }
        });

        // Calculate additional metrics for each category
        Object.keys(categories).forEach(categoryName => {
            const cat = categories[categoryName];
            cat.percentage = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
            cat.remaining = Math.max(0, cat.budget - cat.spent);
            cat.averageExpense = cat.count > 0 ? cat.spent / cat.count : 0;
            cat.trend = cat.expenses.length > 5 ? 'increasing' : 'stable'; // Simple trend
            cat.velocity = cat.expenses.length > 0 ? cat.spent / cat.expenses.length : 0;
        });

        return categories;
    }

    calculateTrends(expenses) {
        const sortedExpenses = expenses
            .filter(e => e.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Group expenses by day inline
        const dailySpending = {};
        sortedExpenses.forEach(expense => {
            const dateKey = new Date(expense.date).toDateString();
            if (!dailySpending[dateKey]) {
                dailySpending[dateKey] = 0;
            }
            dailySpending[dateKey] += expense.amount;
        });

        // Simple trend calculation
        const dailyValues = Object.values(dailySpending);
        const avgSpending = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;

        return {
            daily: dailySpending,
            avgSpending: avgSpending,
            trend: dailyValues.length > 3 ? 'increasing' : 'stable',
            volatility: dailyValues.length > 1 ? Math.max(...dailyValues) - Math.min(...dailyValues) : 0
        };
    }

    calculatePredictions(expenses, budget) {
        const trends = this.calculateTrends(expenses);
        const overview = this.calculateOverview(expenses, budget);
        
        return {
            projectedEndDate: new Date(Date.now() + (overview.daysRemaining * 24 * 60 * 60 * 1000)).toDateString(),
            recommendedDailyBudget: overview.remaining / overview.daysRemaining,
            categoryForecasts: 'stable',
            riskLevel: overview.spentPercentage > 80 ? 'high' : 'low'
        };
    }

    calculateComparisons(expenses, budget) {
        // Compare with typical travel spending patterns
        const categoryAverages = {
            ACCOMMODATION: 35,
            FOOD: 25,
            TRANSPORT: 20,
            ACTIVITIES: 15,
            MISC: 5
        };

        // Calculate actual distribution inline
        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const actualDistribution = {};
        
        expenses.forEach(expense => {
            const category = expense.category || 'MISC';
            if (!actualDistribution[category]) {
                actualDistribution[category] = 0;
            }
            actualDistribution[category] += expense.amount;
        });
        
        // Convert to percentages
        Object.keys(actualDistribution).forEach(category => {
            actualDistribution[category] = totalSpent > 0 ? (actualDistribution[category] / totalSpent) * 100 : 0;
        });
        
        return {
            actualDistribution: actualDistribution,
            categoryAverages: categoryAverages,
            efficiency: totalSpent > 0 ? 85 : 100, // Simple efficiency score
            optimization: 'Consider reducing food expenses by 10%' // Simple suggestion
        };
    }

    // Chart rendering methods
    async renderSpendingOverview(container) {
        if (!this.chartLibraryLoaded) await this.loadChartLibrary();
        if (!this.insights) this.calculateAdvancedInsights();

        const canvas = this.createCanvas(container, 'spending-overview');
        const ctx = canvas.getContext('2d');

        const { overview } = this.insights;
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Gastado', 'Restante'],
                datasets: [{
                    data: [overview.totalSpent, overview.remaining],
                    backgroundColor: [
                        ANALYTICS.COLORS.CHART_DANGER,
                        ANALYTICS.COLORS.CHART_PRIMARY
                    ],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        this.chartInstances.set('spending-overview', chart);
        return chart;
    }

    async renderCategoryBreakdown(container) {
        if (!this.chartLibraryLoaded) await this.loadChartLibrary();
        if (!this.insights) this.calculateAdvancedInsights();

        const canvas = this.createCanvas(container, 'category-breakdown');
        const ctx = canvas.getContext('2d');

        const { categories } = this.insights;
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => b.spent - a.spent)
            .slice(0, 8);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedCategories.map(([name]) => name),
                datasets: [
                    {
                        label: 'Gastado',
                        data: sortedCategories.map(([,cat]) => cat.spent),
                        backgroundColor: ANALYTICS.COLORS.CHART_DANGER,
                        borderRadius: 8
                    },
                    {
                        label: 'Presupuesto',
                        data: sortedCategories.map(([,cat]) => cat.budget),
                        backgroundColor: ANALYTICS.COLORS.CHART_PRIMARY,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '€' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        this.chartInstances.set('category-breakdown', chart);
        return chart;
    }

    async renderSpendingTrends(container) {
        if (!this.chartLibraryLoaded) await this.loadChartLibrary();
        if (!this.insights) this.calculateAdvancedInsights();

        const canvas = this.createCanvas(container, 'spending-trends');
        const ctx = canvas.getContext('2d');

        const { trends } = this.insights;
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.daily.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Gasto Diario',
                        data: trends.daily.map(d => d.amount),
                        borderColor: ANALYTICS.COLORS.CHART_PRIMARY,
                        backgroundColor: ANALYTICS.COLORS.CHART_PRIMARY + '20',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Media Móvil (7 días)',
                        data: trends.movingAverage,
                        borderColor: ANALYTICS.COLORS.CHART_SECONDARY,
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '€' + value;
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('spending-trends', chart);
        return chart;
    }

    renderAdvancedInsights() {
        if (!this.insights) this.calculateAdvancedInsights();

        return `
            <div class="space-y-8">
                ${this.renderInsightsHeader()}
                ${this.renderChartsGrid()}
                ${this.renderPredictionsPanel()}
                ${this.renderRecommendationsPanel()}
            </div>
        `;
    }

    renderInsightsHeader() {
        const { overview } = this.insights;
        
        return `
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h2 class="text-2xl font-bold mb-4">📊 Análisis Avanzado de Gastos</h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="text-center">
                        <div class="text-3xl font-bold">€${overview.totalSpent.toFixed(0)}</div>
                        <div class="text-blue-100">Total Gastado</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold">€${overview.dailyAverage.toFixed(0)}</div>
                        <div class="text-blue-100">Media Diaria</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold">${overview.burnRate.toFixed(1)}%</div>
                        <div class="text-blue-100">Tasa de Gasto</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold">${overview.daysRemaining}</div>
                        <div class="text-blue-100">Días Restantes</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderChartsGrid() {
        return `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 class="text-xl font-bold mb-4">Resumen de Gastos</h3>
                    <div class="h-64" data-chart="spending-overview"></div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 class="text-xl font-bold mb-4">Por Categorías</h3>
                    <div class="h-64" data-chart="category-breakdown"></div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg lg:col-span-2">
                    <h3 class="text-xl font-bold mb-4">Tendencias de Gasto</h3>
                    <div class="h-64" data-chart="spending-trends"></div>
                </div>
            </div>
        `;
    }

    renderPredictionsPanel() {
        const { predictions } = this.insights;
        
        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-xl font-bold mb-4">🔮 Predicciones</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div class="font-semibold text-blue-700 dark:text-blue-300">Presupuesto Recomendado</div>
                        <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            €${predictions.recommendedDailyBudget.toFixed(0)}/día
                        </div>
                    </div>
                    
                    <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div class="font-semibold text-amber-700 dark:text-amber-300">Nivel de Riesgo</div>
                        <div class="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            ${predictions.riskLevel}
                        </div>
                    </div>
                    
                    <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div class="font-semibold text-green-700 dark:text-green-300">Fecha Estimada</div>
                        <div class="text-lg font-bold text-green-900 dark:text-green-100">
                            ${predictions.projectedEndDate}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRecommendationsPanel() {
        const { comparisons } = this.insights;
        
        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-xl font-bold mb-4">💡 Recomendaciones Inteligentes</h3>
                <div class="space-y-4">
                    ${comparisons.optimization.map(rec => `
                        <div class="p-4 border-l-4 ${this.getRecommendationBorder(rec.type)} bg-slate-50 dark:bg-slate-700/50 rounded-r-lg">
                            <div class="font-semibold ${this.getRecommendationText(rec.type)}">${rec.title}</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">${rec.description}</div>
                            <div class="text-xs text-slate-500 mt-2">💰 Ahorro estimado: €${rec.potentialSavings}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Helper methods for calculations
    calculateDailyAverage(expenses) {
        if (expenses.length === 0) return 0;
        
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Get unique days from expenses
        const uniqueDays = new Set();
        expenses.forEach(expense => {
            if (expense.date) {
                const dateStr = new Date(expense.date).toDateString();
                uniqueDays.add(dateStr);
            }
        });
        
        const days = uniqueDays.size || 1; // At least 1 day to avoid division by zero
        
        return total / days;
    }

    calculateBurnRate(expenses) {
        const recentExpenses = expenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return expenseDate >= weekAgo;
            });

        return this.calculateDailyAverage(recentExpenses);
    }

    calculateProjectedTotal(expenses, dailyAverage) {
        const daysRemaining = this.calculateDaysRemaining();
        const currentTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        return currentTotal + (dailyAverage * daysRemaining);
    }

    calculateDaysRemaining() {
        // Assuming a 24-day trip for demo purposes
        const tripStart = new Date();
        tripStart.setDate(tripStart.getDate() - 10); // 10 days into trip
        const tripEnd = new Date(tripStart);
        tripEnd.setDate(tripEnd.getDate() + 24);
        
        const today = new Date();
        const remaining = Math.ceil((tripEnd - today) / (1000 * 60 * 60 * 24));
        
        return Math.max(0, remaining);
    }

    // Additional helper methods would go here...
    createCanvas(container, id) {
        const canvas = document.createElement('canvas');
        canvas.id = id;
        container.appendChild(canvas);
        return canvas;
    }

    getRecommendationBorder(type) {
        const borders = {
            'save': 'border-green-400',
            'warning': 'border-amber-400',
            'optimize': 'border-blue-400'
        };
        return borders[type] || 'border-gray-400';
    }

    getRecommendationText(type) {
        const colors = {
            'save': 'text-green-700 dark:text-green-300',
            'warning': 'text-amber-700 dark:text-amber-300',
            'optimize': 'text-blue-700 dark:text-blue-300'
        };
        return colors[type] || 'text-gray-700 dark:text-gray-300';
    }

    // Cleanup method
    destroy() {
        this.chartInstances.forEach(chart => chart.destroy());
        this.chartInstances.clear();
    }
}

export default AdvancedAnalytics;
