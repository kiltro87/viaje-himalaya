/**
 * Sistema de Logging y Trazabilidad Completo
 * 
 * Categorías de Trazas:
 * - 🚀 INIT: Inicialización de componentes y aplicación
 * - 📊 DATA: Operaciones con datos (CRUD, transformaciones)
 * - 🎨 UI: Renderizado y actualizaciones de interfaz
 * - 🔄 EVENT: Eventos de usuario y navegación
 * - 🗺️ MAP: Operaciones específicas del mapa
 * - 💰 BUDGET: Operaciones de presupuesto y gastos
 * - 📱 RESPONSIVE: Adaptaciones responsive y breakpoints
 * - ⚠️ WARNING: Advertencias y situaciones inesperadas
 * - ❌ ERROR: Errores y excepciones
 * - ✅ SUCCESS: Operaciones completadas exitosamente
 * - 🔍 DEBUG: Información de depuración detallada
 * - 📈 PERFORMANCE: Métricas de rendimiento
 */

class Logger {
    constructor() {
        // Detectar si estamos en móvil para reducir logging
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isEnabled = true;
        this.logLevel = this.isMobile ? 'ERROR' : 'DEBUG'; // Menos logging en móvil
        this.categories = {
            INIT: { emoji: '🚀', color: '#3B82F6', enabled: true },
            DATA: { emoji: '📊', color: '#10B981', enabled: true },
            UI: { emoji: '🎨', color: '#8B5CF6', enabled: true },
            EVENT: { emoji: '🔄', color: '#F59E0B', enabled: true },
            MAP: { emoji: '🗺️', color: '#06B6D4', enabled: true },
            BUDGET: { emoji: '💰', color: '#059669', enabled: true },
            RESPONSIVE: { emoji: '📱', color: '#EC4899', enabled: true },
            WARNING: { emoji: '⚠️', color: '#F59E0B', enabled: true },
            ERROR: { emoji: '❌', color: '#EF4444', enabled: true },
            SUCCESS: { emoji: '✅', color: '#10B981', enabled: true },
            DEBUG: { emoji: '🔍', color: '#6B7280', enabled: true },
            PERFORMANCE: { emoji: '📈', color: '#7C3AED', enabled: true }
        };
        
        this.startTime = Date.now();
        this.performanceMarks = new Map();
    }

    /**
     * Log genérico con categoría
     */
    log(category, message, data = null, level = 'INFO') {
        if (!this.isEnabled || !this.categories[category]?.enabled) return;
        
        const categoryInfo = this.categories[category];
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const elapsed = Date.now() - this.startTime;
        
        const logMessage = `${categoryInfo.emoji} [${category}] ${message}`;
        
        // Aplicar color en consola si es posible
        if (typeof window !== 'undefined' && window.console) {
            console.log(
                `%c${logMessage} %c(+${elapsed}ms)`,
                `color: ${categoryInfo.color}; font-weight: bold;`,
                'color: #6B7280; font-size: 0.8em;',
                data || ''
            );
        } else {
            console.log(`${timestamp} ${logMessage} (+${elapsed}ms)`, data || '');
        }
    }

    // Métodos específicos por categoría
    init(message, data) { this.log('INIT', message, data); }
    data(message, data) { this.log('DATA', message, data); }
    ui(message, data) { this.log('UI', message, data); }
    event(message, data) { this.log('EVENT', message, data); }
    map(message, data) { this.log('MAP', message, data); }
    budget(message, data) { this.log('BUDGET', message, data); }
    responsive(message, data) { this.log('RESPONSIVE', message, data); }
    warning(message, data) { this.log('WARNING', message, data, 'WARNING'); }
    error(message, data) { this.log('ERROR', message, data, 'ERROR'); }
    success(message, data) { this.log('SUCCESS', message, data); }
    debug(message, data) { this.log('DEBUG', message, data, 'DEBUG'); }
    
    /**
     * Sistema de métricas de rendimiento
     */
    startPerformance(markName) {
        this.performanceMarks.set(markName, Date.now());
        this.log('PERFORMANCE', `Started: ${markName}`);
    }
    
    endPerformance(markName) {
        const startTime = this.performanceMarks.get(markName);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.performanceMarks.delete(markName);
            this.log('PERFORMANCE', `Completed: ${markName} in ${duration}ms`, { duration });
            return duration;
        }
        return null;
    }

    /**
     * Logging de operaciones CRUD
     */
    crud(operation, entity, data) {
        const operations = {
            CREATE: '➕',
            READ: '👁️',
            UPDATE: '✏️',
            DELETE: '🗑️'
        };
        this.data(`${operations[operation]} ${operation} ${entity}`, data);
    }

    /**
     * Logging de navegación
     */
    navigation(from, to, data) {
        this.event(`Navigation: ${from} → ${to}`, data);
    }

    /**
     * Logging de responsive breakpoints
     */
    breakpoint(breakpoint, action) {
        this.responsive(`Breakpoint ${breakpoint}: ${action}`);
    }

    /**
     * Configuración dinámica
     */
    configure(options) {
        if (options.enabled !== undefined) this.isEnabled = options.enabled;
        if (options.logLevel) this.logLevel = options.logLevel;
        if (options.categories) {
            Object.keys(options.categories).forEach(cat => {
                if (this.categories[cat]) {
                    this.categories[cat].enabled = options.categories[cat];
                }
            });
        }
    }

    /**
     * Resumen de rendimiento
     */
    getPerformanceSummary() {
        const totalTime = Date.now() - this.startTime;
        return {
            totalRuntime: totalTime,
            activeMarks: Array.from(this.performanceMarks.keys()),
            timestamp: new Date().toISOString()
        };
    }
}

// Crear instancia global del logger
const loggerInstance = new Logger();

// Configuración por defecto para desarrollo
if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        loggerInstance.configure({
            enabled: true,
            logLevel: 'DEBUG'
        });
    } else {
        // Configuración para producción
        loggerInstance.configure({
            enabled: true,
            logLevel: 'WARNING',
            categories: {
                DEBUG: false,
                PERFORMANCE: false
            }
        });
    }
    
    // También disponible globalmente
    window.Logger = loggerInstance;
}

export default loggerInstance;
