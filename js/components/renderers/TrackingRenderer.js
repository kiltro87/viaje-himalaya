/**
 * TrackingRenderer - Renderizador Especializado de Vista TRACKING
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * relacionada con la vista de seguimiento del viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from UIRenderer.js
 */

import Logger from '../../utils/Logger.js';
import { SummaryRenderer } from './SummaryRenderer.js';
import { mapRenderer } from './MapRenderer.js';

export class TrackingRenderer {
    
    constructor() {
        this.summaryRenderer = new SummaryRenderer();
        Logger.ui('TrackingRenderer initialized');
    }

    /**
     * 🎯 RENDERIZAR VISTA TRACKING COMPLETA
     */
    renderTracking() {
        Logger.ui('📊 Rendering TRACKING view (map + analytics)');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            Logger.error('❌ Main content container not found');
            return;
        }

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">analytics</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Seguimiento</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Analiza tu aventura en tiempo real</p>
                        </div>
                    </div>
                </div>


                <div id="summary-stats" class="mb-8">
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-green-600 dark:text-green-400">currency_exchange</span>
                        Conversor de Moneda
                    </h2>
                    <div id="currency-converter-content"></div>
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-2 relative z-10">
                    <div class="flex items-center gap-3 mb-4 p-4">
                        <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">map</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Mapa del Viaje</h2>
                    </div>
                    <div id="map-container" class="w-full h-[80vh] min-h-[600px] rounded-xl overflow-hidden relative">
                    </div>
                </div>
            </div>
        `;

        this.loadTrackingContent();
    }

    loadTrackingContent() {
        this.loadSummaryStats();
        this.loadCurrencyConverter();
        this.loadMap();
    }

    loadSummaryStats() {
        Logger.ui('📊 Loading summary stats for tracking view');
        
        try {
            const summaryStats = document.getElementById('summary-stats');
            if (!summaryStats) {
                Logger.warning('⚠️ Summary stats container not found');
                return;
            }

            // Generar las secciones de resumen usando el nuevo método
            const sectionsHTML = this.summaryRenderer.generateSummarySections();
            
            // Insertar las secciones en summary-stats
            summaryStats.innerHTML = `
                <div class="space-y-6 md:space-y-8">
                    ${sectionsHTML}
                </div>
            `;
            
            Logger.success('✅ Summary stats loaded in tracking view');
        } catch (error) {
            Logger.error('❌ Error loading summary stats:', error);
        }
    }

    async loadCurrencyConverter() {
        try {
            const currencyContainer = document.getElementById('currency-converter-content');
            if (!currencyContainer) {
                Logger.warning('⚠️ Currency converter container not found');
                return;
            }

            // Importar CurrencyConverter dinámicamente
            const { currencyConverter } = await import('../../utils/CurrencyConverter.js');
            
            // Crear UI del conversor
            currencyContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cantidad</label>
                            <input type="number" id="currency-amount" value="100" min="0" step="0.01"
                                   class="w-full px-4 py-3 radius-standard bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-standard text-slate-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">De</label>
                            <select id="currency-from" class="w-full px-4 py-3 radius-standard bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 text-slate-900 dark:text-white">
                                <option value="EUR">🇪🇺 Euro (EUR)</option>
                                <option value="NPR">🇳🇵 Rupia Nepalí (NPR)</option>
                                <option value="BTN">🇧🇹 Ngultrum Butanés (BTN)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">A</label>
                            <select id="currency-to" class="w-full px-4 py-3 radius-standard bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 text-slate-900 dark:text-white">
                                <option value="NPR">🇳🇵 Rupia Nepalí (NPR)</option>
                                <option value="EUR">🇪🇺 Euro (EUR)</option>
                                <option value="BTN">🇧🇹 Ngultrum Butanés (BTN)</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex items-center justify-center">
                        <div class="text-center p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Resultado</p>
                            <p id="currency-result" class="text-3xl font-bold text-slate-900 dark:text-white">133.33 NPR</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Actualizado automáticamente</p>
                        </div>
                    </div>
                </div>
                <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Información de Cambio</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div class="text-center">
                            <p class="font-medium text-blue-700 dark:text-blue-300">1 EUR</p>
                            <p class="text-blue-600 dark:text-blue-400">≈ 133.33 NPR</p>
                        </div>
                        <div class="text-center">
                            <p class="font-medium text-blue-700 dark:text-blue-300">1 EUR</p>
                            <p class="text-blue-600 dark:text-blue-400">≈ 119.05 BTN</p>
                        </div>
                        <div class="text-center">
                            <p class="font-medium text-blue-700 dark:text-blue-300">1 NPR</p>
                            <p class="text-blue-600 dark:text-blue-400">≈ 0.89 BTN</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Configurar event listeners
            const amountInput = document.getElementById('currency-amount');
            const fromSelect = document.getElementById('currency-from');
            const toSelect = document.getElementById('currency-to');
            const resultElement = document.getElementById('currency-result');
            
            const updateConversion = () => {
                const amount = parseFloat(amountInput.value) || 0;
                const fromCurrency = fromSelect.value;
                const toCurrency = toSelect.value;
                
                if (amount > 0 && fromCurrency !== toCurrency) {
                    const result = currencyConverter.convert(amount, fromCurrency, toCurrency);
                    resultElement.textContent = `${result.toFixed(2)} ${toCurrency}`;
                } else {
                    resultElement.textContent = `${amount.toFixed(2)} ${toCurrency}`;
                }
            };
            
            // Event listeners
            amountInput.addEventListener('input', updateConversion);
            fromSelect.addEventListener('change', updateConversion);
            toSelect.addEventListener('change', updateConversion);
            
            // Conversión inicial
            updateConversion();
            
            Logger.success('💱 Currency converter loaded in tracking section');
        } catch (error) {
            Logger.error('❌ Error loading currency converter:', error);
        }
    }

    loadMap() {
        Logger.ui('🗺️ Loading map for tracking view');
        
        try {
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) {
                Logger.warning('⚠️ Map container not found');
                return;
            }

            // Añadir indicador de carga
            mapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-slate-600 dark:text-slate-400">Cargando mapa...</p>
                    </div>
                </div>
            `;

            // Renderizar el mapa con un pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                // Verificar que el contenedor sigue existiendo después del delay
                const mapContainerCheck = document.getElementById('map-container');
                if (!mapContainerCheck) {
                    Logger.error('❌ Map container disappeared after timeout');
                    return;
                }
                
                if (mapRenderer && typeof mapRenderer.renderMap === 'function') {
                    Logger.debug('🗺️ Calling mapRenderer.renderMap with container:', mapContainerCheck);
                    mapRenderer.renderMap(mapContainerCheck);
                    Logger.success('✅ Map loaded in tracking view');
                } else {
                    Logger.error('❌ MapRenderer not available in tracking view');
                    mapContainerCheck.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center text-slate-500 dark:text-slate-400">
                                <span class="material-symbols-outlined text-4xl mb-4 block">map_off</span>
                                <p>Mapa no disponible</p>
                            </div>
                        </div>
                    `;
                }
            }, 500);
            
        } catch (error) {
            Logger.error('❌ Error loading map:', error);
        }
    }
}

export const trackingRenderer = new TrackingRenderer();
