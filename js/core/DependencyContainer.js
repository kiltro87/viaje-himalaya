/**
 * DependencyContainer - Contenedor de Inyección de Dependencias
 * 
 * Sistema centralized de IoC (Inversion of Control) para reducir acoplamiento
 * y mejorar testabilidad. Gestiona dependencias de forma declarativa.
 * 
 * Características:
 * - Singleton y Factory patterns
 * - Lazy loading de dependencias
 * - Resolución automática de dependencias circulares
 * - Configuración declarativa
 * 
 * @author David Ferrer Figueroa  
 * @version 2.0.0
 * @since 2024
 */

import Logger from '../utils/Logger.js';

export class DependencyContainer {
    
    static instance = null;
    static dependencies = new Map();
    static singletons = new Map();
    static factories = new Map();
    static configurations = new Map();

    /**
     * Singleton pattern para DependencyContainer
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new DependencyContainer();
            this.instance.initializeCore();
        }
        return this.instance;
    }

    /**
     * Inicializa configuraciones core del sistema
     */
    initializeCore() {
        Logger.startPerformance('dependency-container-init');
        
        // Configuraciones core
        this.registerConfiguration('app', {
            name: 'Viaje Himalaya',
            version: '2.0.0',
            environment: this.detectEnvironment(),
            features: {
                firebase: true,
                offline: true,
                pwa: true,
                logging: true
            }
        });

        // Servicios core
        this.registerSingleton('logger', () => Logger);
        this.registerSingleton('tripConfig', () => import('../config/tripConfig.js').then(m => m.tripConfig));
        
        Logger.endPerformance('dependency-container-init');
        Logger.success('DependencyContainer initialized');
    }

    /**
     * Registra una dependencia singleton
     */
    registerSingleton(name, factory) {
        DependencyContainer.singletons.set(name, {
            factory,
            instance: null,
            type: 'singleton'
        });
        Logger.debug(`📦 Singleton registered: ${name}`);
    }

    /**
     * Registra una factory para instancias nuevas
     */
    registerFactory(name, factory) {
        DependencyContainer.factories.set(name, {
            factory,
            type: 'factory'
        });
        Logger.debug(`🏭 Factory registered: ${name}`);
    }

    /**
     * Registra una configuración
     */
    registerConfiguration(name, config) {
        DependencyContainer.configurations.set(name, config);
        Logger.debug(`⚙️ Configuration registered: ${name}`);
    }

    /**
     * Resuelve una dependencia
     */
    async resolve(name) {
        Logger.startPerformance(`resolve-${name}`);
        
        try {
            // Buscar en singletons
            if (DependencyContainer.singletons.has(name)) {
                const singleton = DependencyContainer.singletons.get(name);
                
                if (!singleton.instance) {
                    Logger.data(`🔧 Creating singleton: ${name}`);
                    const factory = singleton.factory;
                    singleton.instance = typeof factory === 'function' ? await factory() : factory;
                }
                
                Logger.endPerformance(`resolve-${name}`);
                return singleton.instance;
            }

            // Buscar en factories
            if (DependencyContainer.factories.has(name)) {
                const factory = DependencyContainer.factories.get(name);
                Logger.data(`🏭 Creating instance: ${name}`);
                const instance = await factory.factory();
                Logger.endPerformance(`resolve-${name}`);
                return instance;
            }

            // Buscar en configuraciones
            if (DependencyContainer.configurations.has(name)) {
                const config = DependencyContainer.configurations.get(name);
                Logger.endPerformance(`resolve-${name}`);
                return config;
            }

            throw new Error(`Dependency '${name}' not registered`);

        } catch (error) {
            Logger.error(`Failed to resolve dependency: ${name}`, error);
            Logger.endPerformance(`resolve-${name}`);
            throw error;
        }
    }

    /**
     * Inyecta dependencias en una instancia
     */
    async inject(instance, dependencies = []) {
        if (!dependencies.length) return instance;

        Logger.data(`💉 Injecting dependencies: ${dependencies.join(', ')}`);

        const resolved = {};
        for (const dep of dependencies) {
            resolved[dep] = await this.resolve(dep);
        }

        // Si la instancia tiene un método setDependencies, usarlo
        if (typeof instance.setDependencies === 'function') {
            instance.setDependencies(resolved);
        } else {
            // Inyección directa de propiedades
            Object.assign(instance, resolved);
        }

        return instance;
    }

    /**
     * Crea e inyecta dependencias en una clase
     */
    async create(ClassConstructor, dependencies = [], ...args) {
        Logger.startPerformance(`create-${ClassConstructor.name}`);
        
        const instance = new ClassConstructor(...args);
        await this.inject(instance, dependencies);
        
        Logger.endPerformance(`create-${ClassConstructor.name}`);
        Logger.success(`✅ Created ${ClassConstructor.name} with dependencies`);
        
        return instance;
    }

    /**
     * Registra servicios de dominio específico
     */
    registerDomainServices() {
        // Weather services
        this.registerSingleton('weatherConfig', () => 
            import('../config/weatherConfig.js').then(m => m.weatherConfig)
        );
        
        this.registerFactory('weatherManager', () => 
            import('../utils/WeatherManager.js').then(m => new m.WeatherManager())
        );

        // Budget services  
        this.registerFactory('budgetManager', async () => {
            // Importar managers
            const { BudgetManager } = await import('../components/BudgetManager.js');
            const { FirebaseManager } = await import('../utils/FirebaseManager.js');
            return new BudgetManager();
        });

        this.registerFactory('packingListManager', async () => {
            const PackingListManager = (await import('../utils/PackingListManager.js')).default;
            return new PackingListManager();
        });

        this.registerFactory('hotelManager', async () => {
            const { HotelManager } = await import('../utils/HotelManager.js');
            return new HotelManager();
        });

        this.registerFactory('expenseOrchestrator', async () => {
            const { ExpenseOrchestrator } = await import('../utils/ExpenseOrchestrator.js');
            const budgetManager = await this.resolve('budgetManager');
            return new ExpenseOrchestrator(budgetManager);
        });

        // Firebase services
        this.registerSingleton('firebaseManager', () =>
            import('../utils/FirebaseManager.js').then(m => new m.FirebaseManager())
        );

        // UI services
        this.registerSingleton('uiRenderer', async () => {
            const { UIRenderer } = await import('../components/UIRenderer.js');
            return new UIRenderer();
        });

        if (Logger && Logger.info) {
            Logger.info('🏗️ Domain services registered');
        }
    }

    /**
     * Obtiene todas las dependencias registradas
     */
    getRegistered() {
        return {
            singletons: Array.from(DependencyContainer.singletons.keys()),
            factories: Array.from(DependencyContainer.factories.keys()),
            configurations: Array.from(DependencyContainer.configurations.keys())
        };
    }

    /**
     * Limpia instancias singleton (útil para testing)
     */
    clearSingletons() {
        DependencyContainer.singletons.forEach(singleton => {
            singleton.instance = null;
        });
        Logger.warning('🧹 Singletons cleared');
    }

    /**
     * Detecta el entorno de ejecución
     */
    detectEnvironment() {
        if (typeof window === 'undefined') return 'node';
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        }
        if (window.location.hostname.includes('github.io')) {
            return 'production';
        }
        return 'unknown';
    }

    /**
     * Verifica la salud del contenedor
     */
    async healthCheck() {
        const health = {
            status: 'healthy',
            dependencies: {
                registered: this.getRegistered(),
                failed: []
            },
            performance: {
                environment: await this.resolve('app').then(app => app.environment),
                uptime: performance.now()
            }
        };

        // Intentar resolver dependencias críticas
        const critical = ['logger', 'app'];
        for (const dep of critical) {
            try {
                await this.resolve(dep);
            } catch (error) {
                health.status = 'unhealthy';
                health.dependencies.failed.push({ name: dep, error: error.message });
            }
        }

        return health;
    }

    /**
     * Obtiene métricas del contenedor
     */
    getMetrics() {
        const singletonInstances = Array.from(DependencyContainer.singletons.values())
            .filter(s => s.instance !== null).length;
        
        return {
            registered: {
                singletons: DependencyContainer.singletons.size,
                factories: DependencyContainer.factories.size,
                configurations: DependencyContainer.configurations.size
            },
            runtime: {
                singletonInstances,
                memoryEstimate: this.estimateMemoryUsage()
            },
            version: '2.0.0'
        };
    }

    /**
     * Estima el uso de memoria
     */
    estimateMemoryUsage() {
        if (performance.memory) {
            return {
                used: this.formatBytes(performance.memory.usedJSHeapSize),
                total: this.formatBytes(performance.memory.totalJSHeapSize)
            };
        }
        return 'unavailable';
    }

    /**
     * Formatea bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export tanto la clase como una instancia singleton
export const container = DependencyContainer.getInstance();
export default container;
