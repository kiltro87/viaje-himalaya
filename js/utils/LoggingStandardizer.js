/**
 * LoggingStandardizer - Estandarizador de Patrones de Logging
 * 
 * Elimina duplicación de patrones de logging y estandariza mensajes
 * consistentes en toda la aplicación.
 * 
 * Características:
 * - Patrones predefinidos para operaciones comunes
 * - Mensajes contextuales automáticos
 * - Migración automática de console.log
 * - Métricas de uso de logging
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0  
 * @since 2024
 */

import Logger from './Logger.js';

export class LoggingStandardizer {
    
    static patterns = new Map();
    static metrics = {
        standardized: 0,
        console_migrated: 0,
        patterns_used: new Map()
    };

    /**
     * Inicializa patrones estándar de logging
     */
    static init() {
        this.registerStandardPatterns();
        this.setupConsoleMigration();
        Logger.success('LoggingStandardizer initialized');
    }

    /**
     * Registra patrones estándar de logging
     */
    static registerStandardPatterns() {
        // Patrones de renderizado
        this.registerPattern('render_start', (component) => ({
            message: `🎨 Renderizando ${component}...`,
            category: 'ui',
            level: 'info'
        }));

        this.registerPattern('render_success', (component) => ({
            message: `✅ ${component} renderizado correctamente`,
            category: 'success',
            level: 'success'
        }));

        this.registerPattern('render_error', (component, error) => ({
            message: `❌ Error al renderizar ${component}`,
            category: 'error',
            level: 'error',
            data: { error: error.message, stack: error.stack }
        }));

        // Patrones de datos
        this.registerPattern('data_load_start', (source) => ({
            message: `📊 Cargando datos desde ${source}...`,
            category: 'data',
            level: 'info'
        }));

        this.registerPattern('data_load_success', (source, count) => ({
            message: `✅ Datos cargados desde ${source}`,
            category: 'success', 
            level: 'success',
            data: { source, itemCount: count }
        }));

        this.registerPattern('data_save_success', (type, id) => ({
            message: `✅ ${type} guardado correctamente`,
            category: 'success',
            level: 'success',
            data: { type, id }
        }));

        // Patrones de performance
        this.registerPattern('performance_start', (operation) => ({
            message: `⚡ Iniciando ${operation}`,
            category: 'performance',
            level: 'debug',
            action: () => Logger.startPerformance(operation)
        }));

        this.registerPattern('performance_end', (operation) => ({
            message: `⚡ Completado ${operation}`,
            category: 'performance',
            level: 'debug',
            action: () => Logger.endPerformance(operation)
        }));

        // Patrones de eventos
        this.registerPattern('event_trigger', (eventName, data) => ({
            message: `🎯 Evento: ${eventName}`,
            category: 'event',
            level: 'debug',
            data
        }));

        this.registerPattern('user_action', (action, context) => ({
            message: `👤 Usuario: ${action}`,
            category: 'event',
            level: 'info',
            data: { action, context }
        }));

        // Patrones de Firebase/Database
        this.registerPattern('firebase_operation', (operation, collection, id) => ({
            message: `🔥 Firebase ${operation}: ${collection}`,
            category: 'data',
            level: 'info',
            data: { operation, collection, id }
        }));

        // Patrones de sistema
        this.registerPattern('system_init', (component, version) => ({
            message: `🚀 ${component} v${version} inicializado`,
            category: 'init',
            level: 'success'
        }));

        this.registerPattern('module_loaded', (module, loadTime) => ({
            message: `📦 Módulo ${module} cargado`,
            category: 'init',
            level: 'success',
            data: { module, loadTime: `${loadTime}ms` }
        }));

        // Patrones de error estándar
        this.registerPattern('validation_error', (field, value, reason) => ({
            message: `⚠️ Error de validación: ${field}`,
            category: 'warning',
            level: 'warning',
            data: { field, value, reason }
        }));

        this.registerPattern('network_error', (url, status, error) => ({
            message: `🌐 Error de red: ${url}`,
            category: 'error',
            level: 'error',
            data: { url, status, error }
        }));

        Logger.init(`📋 ${this.patterns.size} patrones de logging registrados`);
    }

    /**
     * Registra un patrón de logging
     */
    static registerPattern(name, factory) {
        this.patterns.set(name, factory);
    }

    /**
     * Ejecuta un patrón de logging
     */
    static log(patternName, ...args) {
        const pattern = this.patterns.get(patternName);
        if (!pattern) {
            // Usar console original para evitar recursión
            if (LoggingStandardizer.originalConsole) {
                LoggingStandardizer.originalConsole.log(`⚠️ [LoggingStandardizer] Patrón no encontrado: ${patternName}`);
            }
            return;
        }

        const config = pattern(...args);
        
        // Ejecutar acción si existe
        if (config.action) {
            config.action();
        }

        // Mapear niveles a métodos disponibles de Logger
        const levelMap = {
            'info': 'init',
            'debug': 'debug', 
            'warn': 'warning',
            'warning': 'warning',
            'error': 'error',
            'success': 'success'
        };
        
        const loggerMethod = levelMap[config.level] || 'debug';
        
        // Prevenir recursión: usar Logger solo si no estamos procesando console.log
        if (typeof window !== 'undefined' && !window.__processingLogStandardizer) {
            window.__processingLogStandardizer = true;
            try {
                Logger[loggerMethod](config.message, config.data);
            } finally {
                window.__processingLogStandardizer = false;
            }
        }

        // Métricas
        this.metrics.standardized++;
        this.metrics.patterns_used.set(patternName, 
            (this.metrics.patterns_used.get(patternName) || 0) + 1
        );
    }

    /**
     * Métodos convenientes para patrones comunes
     */
    static renderStart(component) {
        this.log('render_start', component);
    }

    static renderSuccess(component) {
        this.log('render_success', component);
    }

    static renderError(component, error) {
        this.log('render_error', component, error);
    }

    static dataLoadStart(source) {
        this.log('data_load_start', source);
    }

    static dataLoadSuccess(source, count = null) {
        this.log('data_load_success', source, count);
    }

    static dataSaveSuccess(type, id = null) {
        this.log('data_save_success', type, id);
    }

    static performanceStart(operation) {
        this.log('performance_start', operation);
    }

    static performanceEnd(operation) {
        this.log('performance_end', operation);
    }

    static moduleLoaded(module, loadTime) {
        this.log('module_loaded', module, loadTime);
    }

    static systemInit(component, version) {
        this.log('system_init', component, version);
    }

    static userAction(action, context = {}) {
        this.log('user_action', action, context);
    }

    static firebaseOperation(operation, collection, id = null) {
        this.log('firebase_operation', operation, collection, id);
    }

    static validationError(field, value, reason) {
        this.log('validation_error', field, value, reason);
    }

    static networkError(url, status, error) {
        this.log('network_error', url, status, error);
    }

    /**
     * Configura migración automática de console.log
     */
    static setupConsoleMigration() {
        // Preservar console original
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
        
        // Hacer originalConsole accesible globalmente para métodos estáticos
        LoggingStandardizer.originalConsole = originalConsole;

        // Flag para prevenir recursión infinita
        let isProcessingConsoleLog = false;
        
        // Interceptar console.log
        console.log = (...args) => {
            // Prevenir recursión infinita
            if (isProcessingConsoleLog) {
                originalConsole.log(...args);
                return;
            }
            
            isProcessingConsoleLog = true;
            
            try {
                const message = args.join(' ');
                
                // Detectar patrones en el mensaje
                const detectedPattern = this.detectPattern(message);
                
                if (detectedPattern) {
                    this.log(detectedPattern.pattern, ...detectedPattern.args);
                } else {
                    // Usar console original directamente para evitar recursión
                    originalConsole.log(`🔄 [MIGRATED] ${message}`, { originalArgs: args });
                }

                this.metrics.console_migrated++;
                
            } finally {
                isProcessingConsoleLog = false;
            }
        };

        Logger.init('🔄 Console.log migration activated');
    }

    /**
     * Detecta patrones en mensajes de console.log
     */
    static detectPattern(message) {
        const msg = message.toLowerCase();

        // Patrones de renderizado
        if (msg.includes('renderizando') && msg.includes('...')) {
            const component = this.extractComponent(message);
            return { pattern: 'render_start', args: [component] };
        }

        if (msg.includes('✅') && msg.includes('renderizado correctamente')) {
            const component = this.extractComponent(message);
            return { pattern: 'render_success', args: [component] };
        }

        // Patrones de datos
        if (msg.includes('cargando') && msg.includes('datos')) {
            const source = this.extractSource(message);
            return { pattern: 'data_load_start', args: [source] };
        }

        // Patrones de módulos
        if (msg.includes('inicializado') || msg.includes('initialized')) {
            const component = this.extractComponent(message);
            return { pattern: 'system_init', args: [component, '2.0.0'] };
        }

        return null;
    }

    /**
     * Extrae componente de un mensaje
     */
    static extractComponent(message) {
        // Buscar patrones como "Renderizando ComponentName..." 
        const match = message.match(/(?:renderizando|renderizado)\s+([^.\s]+)/i);
        return match ? match[1] : 'Unknown Component';
    }

    /**
     * Extrae fuente de datos de un mensaje
     */
    static extractSource(message) {
        const match = message.match(/(?:desde|from)\s+([^.\s]+)/i);
        return match ? match[1] : 'Unknown Source';
    }

    /**
     * Verifica si está en desarrollo
     */
    static isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }

    /**
     * Obtiene métricas de uso
     */
    static getMetrics() {
        return {
            ...this.metrics,
            patterns_available: this.patterns.size,
            most_used: this.getMostUsedPattern(),
            efficiency: this.calculateEfficiency()
        };
    }

    /**
     * Obtiene el patrón más usado
     */
    static getMostUsedPattern() {
        let max = 0;
        let pattern = null;
        
        for (const [name, count] of this.metrics.patterns_used) {
            if (count > max) {
                max = count;
                pattern = name;
            }
        }
        
        return { pattern, count: max };
    }

    /**
     * Calcula eficiencia de estandarización
     */
    static calculateEfficiency() {
        const total = this.metrics.standardized + this.metrics.console_migrated;
        if (total === 0) return 0;
        
        return Math.round((this.metrics.standardized / total) * 100);
    }

    /**
     * Genera reporte de calidad de logging
     */
    static generateQualityReport() {
        const metrics = this.getMetrics();
        
        return {
            status: metrics.efficiency >= 80 ? 'excellent' : 
                   metrics.efficiency >= 60 ? 'good' : 
                   metrics.efficiency >= 40 ? 'fair' : 'poor',
            metrics,
            recommendations: this.getRecommendations(metrics),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtiene recomendaciones de mejora
     */
    static getRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.efficiency < 60) {
            recommendations.push('Migrar más console.log a patrones estandarizados');
        }
        
        if (metrics.console_migrated > metrics.standardized) {
            recommendations.push('Usar métodos específicos en lugar de console.log genérico');
        }
        
        if (metrics.patterns_used.size < metrics.patterns_available * 0.5) {
            recommendations.push('Explorar más patrones de logging disponibles');
        }
        
        return recommendations;
    }

    /**
     * Exporta configuración de patrones
     */
    static exportPatterns() {
        const patterns = {};
        for (const [name, factory] of this.patterns) {
            patterns[name] = factory.toString();
        }
        return patterns;
    }
}
