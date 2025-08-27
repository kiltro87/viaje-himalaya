/**
 * ModuleManager - Gestor Central de Módulos
 * 
 * Sistema centralizado para gestión de módulos, lazy loading,
 * control de dependencias y métricas de rendimiento.
 * 
 * Características:
 * - Lazy loading de módulos pesados
 * - Control de dependencias
 * - Métricas de carga y uso
 * - Sistema de plugins extensible
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import Logger from '../utils/Logger.js';
import { LoggerEnhancer } from '../utils/LoggerEnhancer.js';

export class ModuleManager {
    
    static instance = null;
    static loadedModules = new Map();
    static pendingLoads = new Map();
    static moduleMetrics = new Map();
    static dependencies = new Map();

    /**
     * Singleton pattern para ModuleManager
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new ModuleManager();
        }
        return this.instance;
    }

    constructor() {
        if (ModuleManager.instance) {
            return ModuleManager.instance;
        }
        
        this.initializeCore();
        ModuleManager.instance = this;
    }

    /**
     * Inicializa el sistema core
     */
    async initializeCore() {
        Logger.startPerformance('module-manager-init');
        
        // Inicializar LoggerEnhancer
        LoggerEnhancer.init();
        
        // Registrar módulos core
        this.registerCoreModules();
        
        // Configurar lazy loading
        this.setupLazyLoading();
        
        Logger.endPerformance('module-manager-init');
        Logger.success('ModuleManager initialized successfully');
    }

    /**
     * Registra módulos core del sistema
     */
    registerCoreModules() {
        const coreModules = {
            'header-renderer': {
                path: './components/renderers/HeaderRenderer.js',
                dependencies: [],
                lazy: false,
                critical: true
            },
            'ui-helpers': {
                path: './utils/UIHelpers.js',
                dependencies: [],
                lazy: false,
                critical: true
            },
            'weather-renderer': {
                path: './components/renderers/WeatherRenderer.js',
                dependencies: ['header-renderer'],
                lazy: true,
                critical: false
            },
            'itinerary-renderer': {
                path: './components/renderers/ItineraryRenderer.js',
                dependencies: ['header-renderer', 'ui-helpers'],
                lazy: true,
                critical: false
            },
            'budget-manager': {
                path: './components/BudgetManager.js',
                dependencies: ['header-renderer'],
                lazy: true,
                critical: false
            },
            'weather-manager': {
                path: './utils/WeatherManager.js',
                dependencies: [],
                lazy: true,
                critical: false
            },
            'firebase-manager': {
                path: './utils/FirebaseManager.js',
                dependencies: [],
                lazy: true,
                critical: false
            }
        };

        for (const [name, config] of Object.entries(coreModules)) {
            this.registerModule(name, config);
        }
    }

    /**
     * Registra un módulo en el sistema
     */
    registerModule(name, config) {
        ModuleManager.dependencies.set(name, {
            ...config,
            registered: Date.now(),
            loaded: false,
            loadTime: null,
            size: null
        });

        Logger.debug(`📦 Module registered: ${name}`);
    }

    /**
     * Carga un módulo de forma asíncrona
     */
    async loadModule(name, options = {}) {
        // Si ya está cargado, retornarlo
        if (ModuleManager.loadedModules.has(name)) {
            return ModuleManager.loadedModules.get(name);
        }

        // Si está siendo cargado, esperar a que termine
        if (ModuleManager.pendingLoads.has(name)) {
            return ModuleManager.pendingLoads.get(name);
        }

        const moduleConfig = ModuleManager.dependencies.get(name);
        if (!moduleConfig) {
            throw new Error(`Module ${name} not registered`);
        }

        Logger.startPerformance(`load-module-${name}`);
        Logger.data(`📦 Loading module: ${name}`);

        // Crear promise de carga
        const loadPromise = this.performModuleLoad(name, moduleConfig, options);
        ModuleManager.pendingLoads.set(name, loadPromise);

        try {
            const module = await loadPromise;
            ModuleManager.pendingLoads.delete(name);
            return module;
        } catch (error) {
            ModuleManager.pendingLoads.delete(name);
            Logger.error(`Failed to load module: ${name}`, error);
            throw error;
        }
    }

    /**
     * Realiza la carga real del módulo
     */
    async performModuleLoad(name, config, options) {
        const startTime = performance.now();

        try {
            // Cargar dependencias primero
            await this.loadDependencies(config.dependencies);

            // Cargar el módulo
            const module = await import(config.path);
            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // Almacenar módulo cargado
            ModuleManager.loadedModules.set(name, module);

            // Actualizar métricas
            const moduleInfo = ModuleManager.dependencies.get(name);
            moduleInfo.loaded = true;
            moduleInfo.loadTime = loadTime;

            // Guardar métricas
            ModuleManager.moduleMetrics.set(name, {
                loadTime,
                loadedAt: Date.now(),
                size: this.estimateModuleSize(module),
                dependencies: config.dependencies.length
            });

            Logger.endPerformance(`load-module-${name}`);
            Logger.success(`✅ Module loaded: ${name} (${loadTime.toFixed(2)}ms)`);

            return module;

        } catch (error) {
            Logger.error(`❌ Failed to load module: ${name}`, error);
            throw error;
        }
    }

    /**
     * Carga las dependencias de un módulo
     */
    async loadDependencies(dependencies) {
        if (!dependencies || dependencies.length === 0) return;

        const dependencyPromises = dependencies.map(dep => this.loadModule(dep));
        await Promise.all(dependencyPromises);
    }

    /**
     * Configura lazy loading para módulos no críticos
     */
    setupLazyLoading() {
        // Observar elementos que requieren módulos específicos
        const observers = new Map();

        // Lazy load para weather cuando se navegue a weather
        this.observeNavigation('weather', 'weather-renderer');
        this.observeNavigation('itinerary', 'itinerary-renderer');
        this.observeNavigation('gastos', 'budget-manager');

        Logger.info('🔄 Lazy loading configured for non-critical modules');
    }

    /**
     * Observa navegación para cargar módulos bajo demanda
     */
    observeNavigation(route, moduleName) {
        // Escuchar eventos de navegación
        document.addEventListener('navigation-change', (event) => {
            if (event.detail.route === route) {
                this.loadModule(moduleName).catch(error => {
                    Logger.error(`Failed to lazy load ${moduleName}`, error);
                });
            }
        });
    }

    /**
     * Obtiene métricas de rendimiento de módulos
     */
    getPerformanceMetrics() {
        const metrics = {
            totalModules: ModuleManager.dependencies.size,
            loadedModules: ModuleManager.loadedModules.size,
            averageLoadTime: 0,
            totalLoadTime: 0,
            moduleDetails: []
        };

        let totalTime = 0;
        let loadedCount = 0;

        for (const [name, moduleMetrics] of ModuleManager.moduleMetrics) {
            const config = ModuleManager.dependencies.get(name);
            
            metrics.moduleDetails.push({
                name,
                loadTime: moduleMetrics.loadTime,
                size: moduleMetrics.size,
                dependencies: moduleMetrics.dependencies,
                critical: config.critical,
                lazy: config.lazy
            });

            totalTime += moduleMetrics.loadTime;
            loadedCount++;
        }

        metrics.totalLoadTime = totalTime;
        metrics.averageLoadTime = loadedCount > 0 ? totalTime / loadedCount : 0;

        return metrics;
    }

    /**
     * Estima el tamaño de un módulo cargado
     */
    estimateModuleSize(module) {
        try {
            return JSON.stringify(module).length;
        } catch {
            return 'unknown';
        }
    }

    /**
     * Descarga módulos no utilizados
     */
    unloadUnusedModules() {
        const now = Date.now();
        const unusedThreshold = 5 * 60 * 1000; // 5 minutos

        for (const [name, metrics] of ModuleManager.moduleMetrics) {
            const config = ModuleManager.dependencies.get(name);
            
            if (!config.critical && (now - metrics.loadedAt) > unusedThreshold) {
                ModuleManager.loadedModules.delete(name);
                ModuleManager.moduleMetrics.delete(name);
                config.loaded = false;
                
                Logger.info(`🗑️ Unloaded unused module: ${name}`);
            }
        }
    }

    /**
     * Obtiene el estado actual del sistema
     */
    getSystemStatus() {
        return {
            moduleManager: {
                initialized: true,
                version: '2.0.0',
                uptime: Date.now() - (ModuleManager.dependencies.get('header-renderer')?.registered || Date.now())
            },
            modules: {
                registered: ModuleManager.dependencies.size,
                loaded: ModuleManager.loadedModules.size,
                pending: ModuleManager.pendingLoads.size
            },
            performance: this.getPerformanceMetrics(),
            memory: {
                estimated: this.getEstimatedMemoryUsage(),
                cleanup: 'automatic'
            }
        };
    }

    /**
     * Estima el uso de memoria
     */
    getEstimatedMemoryUsage() {
        if (performance.memory) {
            return {
                used: this.formatBytes(performance.memory.usedJSHeapSize),
                total: this.formatBytes(performance.memory.totalJSHeapSize),
                limit: this.formatBytes(performance.memory.jsHeapSizeLimit)
            };
        }
        return 'unavailable';
    }

    /**
     * Formatea bytes en formato legible
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
