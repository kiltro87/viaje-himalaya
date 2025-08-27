/**
 * LoggerEnhancer - Mejoras para el Sistema de Logging
 * 
 * Extiende el Logger básico con funcionalidades avanzadas:
 * - Migración automática de console.log a Logger
 * - Contexto automático de llamadas
 * - Filtros dinámicos
 * - Métricas de performance
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class LoggerEnhancer {
    
    static isInitialized = false;
    static performanceMetrics = new Map();
    static logBuffer = [];
    static maxBufferSize = 1000;

    /**
     * Inicializa las mejoras del Logger
     */
    static init() {
        if (this.isInitialized) return;
        
        this.setupConsoleOverride();
        this.setupPerformanceTracking();
        this.setupContextualLogging();
        
        this.isInitialized = true;
        Logger.success('LoggerEnhancer initialized successfully');
    }

    /**
     * Sobrescribe console.log para redirigir a Logger
     */
    static setupConsoleOverride() {
        // Guardar referencias originales
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };

        // Función para extraer contexto de la llamada
        const getCallContext = () => {
            const stack = new Error().stack;
            const lines = stack.split('\n');
            // Buscar la línea que no sea del LoggerEnhancer
            for (let i = 3; i < lines.length; i++) {
                const line = lines[i];
                if (!line.includes('LoggerEnhancer') && !line.includes('console.')) {
                    const match = line.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
                    if (match) {
                        const [, func, file, lineNum] = match;
                        const fileName = file.split('/').pop();
                        return `${fileName}:${lineNum} (${func})`;
                    }
                }
            }
            return 'unknown';
        };

        // Sobrescribir console.log
        console.log = (...args) => {
            const context = getCallContext();
            const message = args.join(' ');
            
            // Determinar categoría basada en el contenido
            const category = this.inferCategory(message, context);
            
            Logger[category](`[AUTO] ${message}`, { context, args });
            
            // También llamar al console original en desarrollo
            if (process.env.NODE_ENV === 'development') {
                originalConsole.log(...args);
            }
        };

        // Sobrescribir console.warn
        console.warn = (...args) => {
            const context = getCallContext();
            Logger.warning(args.join(' '), { context, args });
            originalConsole.warn(...args);
        };

        // Sobrescribir console.error
        console.error = (...args) => {
            const context = getCallContext();
            Logger.error(args.join(' '), { context, args });
            originalConsole.error(...args);
        };

        Logger.info('Console override activated - redirecting to Logger');
    }

    /**
     * Infiere la categoría de log basada en el contenido
     */
    static inferCategory(message, context) {
        const msg = message.toLowerCase();
        const ctx = context.toLowerCase();

        // Inferencia basada en contenido
        if (msg.includes('error') || msg.includes('fail') || msg.includes('❌')) return 'error';
        if (msg.includes('warn') || msg.includes('⚠️')) return 'warning';
        if (msg.includes('success') || msg.includes('✅') || msg.includes('completed')) return 'success';
        if (msg.includes('render') || msg.includes('🎨') || msg.includes('ui')) return 'ui';
        if (msg.includes('event') || msg.includes('click') || msg.includes('🎯')) return 'event';
        if (msg.includes('data') || msg.includes('load') || msg.includes('fetch')) return 'data';
        if (msg.includes('budget') || msg.includes('💰') || msg.includes('expense')) return 'budget';
        if (msg.includes('map') || msg.includes('🗺️') || msg.includes('location')) return 'map';
        if (msg.includes('performance') || msg.includes('⚡')) return 'performance';
        if (msg.includes('init') || msg.includes('start') || msg.includes('🚀')) return 'init';

        // Inferencia basada en contexto (archivo)
        if (ctx.includes('uirenderer')) return 'ui';
        if (ctx.includes('budgetmanager')) return 'budget';
        if (ctx.includes('weather')) return 'data';
        if (ctx.includes('map')) return 'map';
        if (ctx.includes('firebase')) return 'data';

        return 'debug'; // Categoría por defecto
    }

    /**
     * Configura tracking de performance automático
     */
    static setupPerformanceTracking() {
        const originalStartPerformance = Logger.startPerformance;
        const originalEndPerformance = Logger.endPerformance;

        Logger.startPerformance = (operation) => {
            this.performanceMetrics.set(operation, {
                startTime: performance.now(),
                startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0
            });
            return originalStartPerformance.call(Logger, operation);
        };

        Logger.endPerformance = (operation) => {
            const metrics = this.performanceMetrics.get(operation);
            if (metrics) {
                const endTime = performance.now();
                const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                
                const duration = endTime - metrics.startTime;
                const memoryDelta = endMemory - metrics.startMemory;

                // Log detallado de performance
                Logger.performance(`Performance: ${operation}`, {
                    duration: `${duration.toFixed(2)}ms`,
                    memory: this.formatBytes(memoryDelta),
                    timestamp: new Date().toISOString()
                });

                this.performanceMetrics.delete(operation);
            }
            return originalEndPerformance.call(Logger, operation);
        };
    }

    /**
     * Configura logging contextual automático
     */
    static setupContextualLogging() {
        // Wrapper para funciones críticas
        this.wrapCriticalFunctions();
        
        // Auto-logging para errores no capturados
        window.addEventListener('error', (event) => {
            Logger.error('Uncaught error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        // Auto-logging para promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            Logger.error('Unhandled promise rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
    }

    /**
     * Envuelve funciones críticas para logging automático
     */
    static wrapCriticalFunctions() {
        // Wrapper para fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            Logger.data(`🌐 Fetch: ${url}`);
            
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    Logger.warning(`Fetch failed: ${response.status} ${response.statusText}`, { url });
                }
                return response;
            } catch (error) {
                Logger.error(`Fetch error: ${url}`, error);
                throw error;
            }
        };
    }

    /**
     * Obtiene métricas de logging
     */
    static getMetrics() {
        return {
            bufferSize: this.logBuffer.length,
            activePerformanceTracking: this.performanceMetrics.size,
            categories: Logger.getCategories ? Logger.getCategories() : {},
            uptime: performance.now()
        };
    }

    /**
     * Exporta logs para análisis
     */
    static exportLogs(format = 'json') {
        const logs = this.logBuffer;
        const timestamp = new Date().toISOString();
        
        if (format === 'json') {
            return JSON.stringify({
                timestamp,
                logs,
                metrics: this.getMetrics()
            }, null, 2);
        }
        
        if (format === 'csv') {
            const headers = 'timestamp,category,message,level\n';
            const rows = logs.map(log => 
                `${log.timestamp},${log.category},${log.message},${log.level}`
            ).join('\n');
            return headers + rows;
        }
        
        return logs;
    }

    /**
     * Limpia el buffer de logs
     */
    static clearBuffer() {
        this.logBuffer = [];
        Logger.info('Log buffer cleared');
    }

    /**
     * Formatea bytes en formato legible
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Configura filtros dinámicos de logging
     */
    static setLogLevel(level) {
        // Implementar filtros por nivel
        Logger.setLevel?.(level);
    }

    /**
     * Estadísticas de uso de logging
     */
    static getLogStats() {
        return {
            ...this.getMetrics(),
            enhancement: 'active',
            version: '2.0.0',
            features: [
                'Console override',
                'Performance tracking',
                'Contextual logging',
                'Error capture',
                'Category inference'
            ]
        };
    }
}
