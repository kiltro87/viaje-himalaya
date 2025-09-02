/**
 * PerformanceOptimizer - Performance Enhancements
 * 
 * Implements lazy loading, code splitting, image optimization,
 * and other performance improvements for better user experience.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class PerformanceOptimizer {
    constructor() {
        this.intersectionObserver = null;
        this.loadedModules = new Map();
        this.imageCache = new Map();
        this.performanceMetrics = {
            moduleLoadTimes: {},
            imageLoadTimes: {},
            totalOptimizations: 0
        };
        
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCodeSplitting();
        this.setupResourcePreloading();
        this.monitorPerformance();
        
        Logger.success('PerformanceOptimizer initialized');
    }

    setupLazyLoading() {
        // Intersection Observer for lazy loading
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observe lazy elements
        this.observeLazyElements();
        
        // Re-observe when new content is added
        const observer = new MutationObserver(() => {
            this.observeLazyElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    observeLazyElements() {
        // Lazy load images
        const lazyImages = document.querySelectorAll('img[data-src]:not([data-observed])');
        lazyImages.forEach(img => {
            img.setAttribute('data-observed', 'true');
            this.intersectionObserver.observe(img);
        });

        // Lazy load sections
        const lazySections = document.querySelectorAll('[data-lazy-module]:not([data-observed])');
        lazySections.forEach(section => {
            section.setAttribute('data-observed', 'true');
            this.intersectionObserver.observe(section);
        });
    }

    async loadElement(element) {
        const startTime = performance.now();
        
        try {
            if (element.tagName === 'IMG') {
                await this.loadImage(element);
            } else if (element.hasAttribute('data-lazy-module')) {
                await this.loadModule(element);
            }
            
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.totalOptimizations++;
            
            if (Logger && Logger.info) Logger.info('Lazy loaded element', {
                type: element.tagName,
                loadTime: Math.round(loadTime),
                src: element.dataset.src || element.dataset.lazyModule
            });
            
        } catch (error) {
            Logger.error('Failed to lazy load element', error);
        }
    }

    async loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        const startTime = performance.now();
        
        // Check cache first
        if (this.imageCache.has(src)) {
            const cachedImage = this.imageCache.get(src);
            img.src = cachedImage.src;
            img.classList.add('loaded');
            return;
        }

        // Create optimized image
        const optimizedSrc = this.getOptimizedImageUrl(src, img);
        
        return new Promise((resolve, reject) => {
            const tempImg = new Image();
            
            tempImg.onload = () => {
                img.src = optimizedSrc;
                img.classList.add('loaded');
                
                // Cache the loaded image
                this.imageCache.set(src, tempImg);
                
                const loadTime = performance.now() - startTime;
                this.performanceMetrics.imageLoadTimes[src] = loadTime;
                
                resolve();
            };
            
            tempImg.onerror = reject;
            tempImg.src = optimizedSrc;
        });
    }

    getOptimizedImageUrl(src, imgElement) {
        // Get element dimensions for responsive images
        const rect = imgElement.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        const targetWidth = Math.ceil(rect.width * devicePixelRatio);
        const targetHeight = Math.ceil(rect.height * devicePixelRatio);

        // For Unsplash images, add optimization parameters
        if (src.includes('unsplash.com')) {
            const url = new URL(src);
            url.searchParams.set('w', targetWidth.toString());
            url.searchParams.set('h', targetHeight.toString());
            url.searchParams.set('fit', 'crop');
            url.searchParams.set('auto', 'format');
            return url.toString();
        }

        // For other images, return as-is (could implement other optimizations)
        return src;
    }

    async loadModule(element) {
        const moduleName = element.dataset.lazyModule;
        if (!moduleName || this.loadedModules.has(moduleName)) return;

        const startTime = performance.now();
        
        try {
            let module;
            
            // Dynamic import based on module name
            switch (moduleName) {
                case 'spending-insights':
                    module = await import('../components/SpendingInsights.js');
                    break;
                case 'map-renderer':
                    module = await import('../components/renderers/MapRenderer.js');
                    break;
                case 'chart-components':
                    module = await this.loadChartComponents();
                    break;
                default:
                    throw new Error(`Unknown module: ${moduleName}`);
            }
            
            this.loadedModules.set(moduleName, module);
            
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.moduleLoadTimes[moduleName] = loadTime;
            
            // Trigger module initialization if needed
            if (element.dataset.lazyInit) {
                this.initializeModule(moduleName, module, element);
            }
            
        } catch (error) {
            Logger.error(`Failed to load module: ${moduleName}`, error);
        }
    }

    async loadChartComponents() {
        // Dynamically load chart library only when needed
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            
            return new Promise((resolve, reject) => {
                script.onload = () => resolve({ Chart: window.Chart });
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        return { Chart: window.Chart };
    }

    initializeModule(moduleName, module, element) {
        switch (moduleName) {
            case 'spending-insights':
                if (window.spendingInsights) {
                    window.renderSpendingInsights(element);
                }
                break;
            case 'map-renderer':
                // Initialize map in element
                break;
        }
    }

    setupImageOptimization() {
        // Convert existing images to lazy loading
        const images = document.querySelectorAll('img[src]:not([data-src])');
        images.forEach(img => {
            if (this.shouldLazyLoad(img)) {
                img.dataset.src = img.src;
                img.removeAttribute('src');
                img.classList.add('lazy');
            }
        });

        // Add CSS for smooth loading transitions
        this.addImageLoadingStyles();
    }

    shouldLazyLoad(img) {
        // Don't lazy load images that are immediately visible
        const rect = img.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        return rect.top > viewportHeight * 0.5;
    }

    addImageLoadingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            img.lazy {
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading-shimmer 1.5s infinite;
            }
            
            img.lazy.loaded {
                opacity: 1;
                background: none;
                animation: none;
            }
            
            @keyframes loading-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            .dark img.lazy {
                background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
                background-size: 200% 100%;
            }
        `;
        document.head.appendChild(style);
    }

    setupCodeSplitting() {
        // Preload critical modules
        this.preloadCriticalModules();
        
        // Setup route-based code splitting
        this.setupRouteSplitting();
    }

    async preloadCriticalModules() {
        const criticalModules = [
            '../utils/Logger.js',
            '../config/DesignTokens.js',
            '../utils/StateManager.js'
        ];

        const preloadPromises = criticalModules.map(module => {
            return import(/* @vite-ignore */ module).catch(error => {
                Logger.warn(`Failed to preload critical module: ${module}`, error);
            });
        });

        await Promise.allSettled(preloadPromises);
        if (Logger && Logger.info) Logger.info('Critical modules preloaded');
    }

    setupRouteSplitting() {
        // Listen for view changes to load modules on demand
        document.addEventListener('viewchange', async (e) => {
            const view = e.detail?.view;
            await this.loadViewModules(view);
        });
    }

    async loadViewModules(view) {
        const moduleMap = {
            'planificacion': ['spending-insights'],
            'seguimiento': ['chart-components'],
            'mapas-offline': ['map-renderer']
        };

        const modules = moduleMap[view];
        if (!modules) return;

        const loadPromises = modules.map(moduleName => {
            if (!this.loadedModules.has(moduleName)) {
                return this.loadModuleByName(moduleName);
            }
        });

        await Promise.allSettled(loadPromises);
    }

    async loadModuleByName(moduleName) {
        const startTime = performance.now();
        
        try {
            let module;
            
            switch (moduleName) {
                case 'spending-insights':
                    module = await import(/* @vite-ignore */ '../components/SpendingInsights.js');
                    break;
                case 'chart-components':
                    module = await this.loadChartComponents();
                    break;
                case 'map-renderer':
                    module = await import(/* @vite-ignore */ '../components/renderers/MapRenderer.js');
                    break;
            }
            
            if (module) {
                this.loadedModules.set(moduleName, module);
                const loadTime = performance.now() - startTime;
                this.performanceMetrics.moduleLoadTimes[moduleName] = loadTime;
            }
            
        } catch (error) {
            Logger.error(`Failed to load module: ${moduleName}`, error);
        }
    }

    setupResourcePreloading() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Prefetch likely next resources
        this.setupPrefetching();
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap', as: 'style' },
            { href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    setupPrefetching() {
        // Prefetch resources when user hovers over navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                const view = button.dataset.view;
                this.prefetchViewResources(view);
            }, { once: true });
        });
    }

    prefetchViewResources(view) {
        const resourceMap = {
            'mapas-offline': [
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            ]
        };

        const resources = resourceMap[view];
        if (!resources) return;

        resources.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        });
    }

    monitorPerformance() {
        // Monitor Core Web Vitals
        this.measureWebVitals();
        
        // Monitor custom metrics
        this.trackCustomMetrics();
        
        // Report performance periodically
        setInterval(() => {
            this.reportPerformance();
        }, 30000); // Every 30 seconds
    }

    measureWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (Logger && Logger.info) Logger.info('LCP', { value: lastEntry.startTime });
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (Logger && Logger.info) Logger.info('FID', { value: entry.processingStart - entry.startTime });
            });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            if (Logger && Logger.info) Logger.info('CLS', { value: clsValue });
        }).observe({ entryTypes: ['layout-shift'] });
    }

    trackCustomMetrics() {
        // Track module load times
        const moduleLoadTime = Object.values(this.performanceMetrics.moduleLoadTimes)
            .reduce((sum, time) => sum + time, 0);
        
        // Track image optimization savings
        const imageOptimizations = this.performanceMetrics.totalOptimizations;
        
        if (Logger && Logger.info) Logger.info('Custom Performance Metrics', {
            moduleLoadTime: Math.round(moduleLoadTime),
            imageOptimizations,
            totalOptimizations: this.performanceMetrics.totalOptimizations,
            cachedImages: this.imageCache.size,
            loadedModules: this.loadedModules.size
        });
    }

    reportPerformance() {
        const report = {
            timestamp: Date.now(),
            metrics: this.performanceMetrics,
            memory: this.getMemoryInfo(),
            network: this.getNetworkInfo()
        };
        
        if (Logger && Logger.info) Logger.info('Performance Report', report);
    }

    getMemoryInfo() {
        if ('memory' in performance) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    getNetworkInfo() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }

    // Public methods
    preloadModule(moduleName) {
        return this.loadModuleByName(moduleName);
    }

    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    clearImageCache() {
        this.imageCache.clear();
        if (Logger && Logger.info) Logger.info('Image cache cleared');
    }

    optimizeImage(imgElement) {
        if (imgElement.src && !imgElement.dataset.src) {
            imgElement.dataset.src = imgElement.src;
            imgElement.removeAttribute('src');
            imgElement.classList.add('lazy');
            this.intersectionObserver.observe(imgElement);
        }
    }
}

export default PerformanceOptimizer;
