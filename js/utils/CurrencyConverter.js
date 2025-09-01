/**
 * 💱 CURRENCY CONVERTER - CONVERSIÓN DE MONEDAS EN TIEMPO REAL
 * 
 * Convierte entre NPR (Rupia Nepalí), BTN (Ngultrum Butanés) y EUR (Euro)
 * Actualiza tasas automáticamente y funciona offline con caché
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class CurrencyConverter {
    constructor() {
        this.rates = {
            NPR: { EUR: 0.0075, BTN: 0.89 }, // Rupia Nepalí
            BTN: { EUR: 0.0084, NPR: 1.12 }, // Ngultrum Butanés
            EUR: { NPR: 133.33, BTN: 119.05 } // Euro
        };
        
        this.lastUpdate = null;
        this.updateInterval = 6 * 60 * 60 * 1000; // 6 horas
        this.apiKey = null; // Se puede configurar para APIs premium
        
        this.init();
    }
    
    async init() {
        await this.loadCachedRates();
        this.scheduleUpdates();
        Logger.success('CurrencyConverter initialized');
    }
    
    async loadCachedRates() {
        try {
            const cached = localStorage.getItem('currency_rates');
            const lastUpdate = localStorage.getItem('currency_last_update');
            
            if (cached && lastUpdate) {
                this.rates = JSON.parse(cached);
                this.lastUpdate = parseInt(lastUpdate);
                
                Logger.info('Loaded cached currency rates');
                
                // Actualizar si han pasado más de 6 horas
                if (Date.now() - this.lastUpdate > this.updateInterval) {
                    this.updateRates();
                }
            } else {
                // Primera vez, intentar actualizar
                await this.updateRates();
            }
        } catch (error) {
            Logger.warn('Failed to load cached rates, using defaults', error);
        }
    }
    
    async updateRates() {
        if (!navigator.onLine) {
            Logger.info('Offline - using cached rates');
            return;
        }
        
        try {
            // Usar API gratuita de exchangerate-api
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Actualizar tasas basadas en EUR
            this.rates.EUR.NPR = data.rates.NPR || 133.33;
            this.rates.EUR.BTN = data.rates.BTN || 119.05;
            
            // Calcular tasas inversas
            this.rates.NPR.EUR = 1 / this.rates.EUR.NPR;
            this.rates.BTN.EUR = 1 / this.rates.EUR.BTN;
            
            // Calcular NPR ↔ BTN (vía EUR)
            this.rates.NPR.BTN = this.rates.NPR.EUR * this.rates.EUR.BTN;
            this.rates.BTN.NPR = this.rates.BTN.EUR * this.rates.EUR.NPR;
            
            // Guardar en caché
            this.lastUpdate = Date.now();
            localStorage.setItem('currency_rates', JSON.stringify(this.rates));
            localStorage.setItem('currency_last_update', this.lastUpdate.toString());
            
            Logger.success('Currency rates updated successfully');
            
        } catch (error) {
            Logger.warn('Failed to update currency rates', error);
            
            // Fallback: usar tasas aproximadas fijas
            this.rates = {
                NPR: { EUR: 0.0075, BTN: 0.89 },
                BTN: { EUR: 0.0084, NPR: 1.12 },
                EUR: { NPR: 133.33, BTN: 119.05 }
            };
        }
    }
    
    scheduleUpdates() {
        // Actualizar cada 6 horas
        setInterval(() => {
            this.updateRates();
        }, this.updateInterval);
        
        // Actualizar cuando se recupere la conexión
        window.addEventListener('online', () => {
            Logger.info('Connection restored - updating currency rates');
            this.updateRates();
        });
    }
    
    /**
     * Convierte cantidad entre monedas
     * @param {number} amount - Cantidad a convertir
     * @param {string} from - Moneda origen (NPR, BTN, EUR)
     * @param {string} to - Moneda destino (NPR, BTN, EUR)
     * @returns {number} Cantidad convertida
     */
    convert(amount, from, to) {
        if (!amount || amount <= 0) return 0;
        if (from === to) return amount;
        
        const fromUpper = from.toUpperCase();
        const toUpper = to.toUpperCase();
        
        if (!this.rates[fromUpper] || !this.rates[fromUpper][toUpper]) {
            Logger.warn(`Conversion rate not available: ${fromUpper} → ${toUpper}`);
            return amount; // Devolver cantidad original si no hay tasa
        }
        
        const rate = this.rates[fromUpper][toUpper];
        const converted = amount * rate;
        
        return Math.round(converted * 100) / 100; // Redondear a 2 decimales
    }
    
    /**
     * Formatea cantidad con símbolo de moneda
     * @param {number} amount - Cantidad
     * @param {string} currency - Moneda (NPR, BTN, EUR)
     * @returns {string} Cantidad formateada
     */
    format(amount, currency) {
        const symbols = {
            NPR: '₨',
            BTN: 'Nu.',
            EUR: '€'
        };
        
        const symbol = symbols[currency.toUpperCase()] || currency;
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
        
        if (currency.toUpperCase() === 'EUR') {
            return `${formatted}${symbol}`;
        } else {
            return `${symbol}${formatted}`;
        }
    }
    
    /**
     * Obtiene todas las conversiones para una cantidad
     * @param {number} amount - Cantidad
     * @param {string} from - Moneda origen
     * @returns {object} Objeto con todas las conversiones
     */
    convertAll(amount, from) {
        const currencies = ['NPR', 'BTN', 'EUR'];
        const result = {};
        
        currencies.forEach(to => {
            if (to !== from.toUpperCase()) {
                const converted = this.convert(amount, from, to);
                result[to] = {
                    amount: converted,
                    formatted: this.format(converted, to)
                };
            }
        });
        
        return result;
    }
    
    /**
     * Obtiene la tasa de cambio entre dos monedas
     * @param {string} from - Moneda origen
     * @param {string} to - Moneda destino
     * @returns {number} Tasa de cambio
     */
    getRate(from, to) {
        const fromUpper = from.toUpperCase();
        const toUpper = to.toUpperCase();
        
        if (fromUpper === toUpper) return 1;
        
        return this.rates[fromUpper]?.[toUpper] || 0;
    }
    
    /**
     * Obtiene información sobre la última actualización
     * @returns {object} Info de actualización
     */
    getUpdateInfo() {
        return {
            lastUpdate: this.lastUpdate,
            lastUpdateFormatted: this.lastUpdate ? 
                new Date(this.lastUpdate).toLocaleString('es-ES') : 'Nunca',
            nextUpdate: this.lastUpdate ? 
                new Date(this.lastUpdate + this.updateInterval).toLocaleString('es-ES') : 'Pendiente',
            isOnline: navigator.onLine,
            cacheAge: this.lastUpdate ? Date.now() - this.lastUpdate : 0
        };
    }
    
    /**
     * Crea widget de conversión para la UI
     * @param {string} containerId - ID del contenedor
     */
    createWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="currency-widget">
                <div class="widget-header">
                    <h3>💱 Conversor de Monedas</h3>
                    <span class="update-info" id="currency-update-info">
                        ${this.getUpdateInfo().lastUpdateFormatted}
                    </span>
                </div>
                
                <div class="conversion-input">
                    <input type="number" id="currency-amount" placeholder="Cantidad" min="0" step="0.01">
                    <select id="currency-from">
                        <option value="EUR">Euro (€)</option>
                        <option value="NPR">Rupia Nepalí (₨)</option>
                        <option value="BTN">Ngultrum Butanés (Nu.)</option>
                    </select>
                </div>
                
                <div class="conversion-results" id="currency-results">
                    <!-- Resultados aparecerán aquí -->
                </div>
                
                <div class="widget-footer">
                    <button id="currency-refresh" class="refresh-btn">🔄 Actualizar</button>
                    <span class="rates-info">Tasas actualizadas cada 6h</span>
                </div>
            </div>
        `;
        
        this.bindWidgetEvents();
    }
    
    bindWidgetEvents() {
        const amountInput = document.getElementById('currency-amount');
        const fromSelect = document.getElementById('currency-from');
        const refreshBtn = document.getElementById('currency-refresh');
        
        if (amountInput && fromSelect) {
            const updateResults = () => {
                const amount = parseFloat(amountInput.value) || 0;
                const from = fromSelect.value;
                
                if (amount > 0) {
                    const conversions = this.convertAll(amount, from);
                    this.displayResults(conversions, from);
                } else {
                    document.getElementById('currency-results').innerHTML = '';
                }
            };
            
            amountInput.addEventListener('input', updateResults);
            fromSelect.addEventListener('change', updateResults);
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.textContent = '⏳ Actualizando...';
                refreshBtn.disabled = true;
                
                await this.updateRates();
                
                refreshBtn.textContent = '🔄 Actualizar';
                refreshBtn.disabled = false;
                
                // Actualizar info de actualización
                const updateInfo = document.getElementById('currency-update-info');
                if (updateInfo) {
                    updateInfo.textContent = this.getUpdateInfo().lastUpdateFormatted;
                }
            });
        }
    }
    
    displayResults(conversions, fromCurrency) {
        const resultsContainer = document.getElementById('currency-results');
        if (!resultsContainer) return;
        
        const html = Object.entries(conversions).map(([currency, data]) => `
            <div class="conversion-result">
                <span class="currency-label">${this.getCurrencyName(currency)}</span>
                <span class="currency-amount">${data.formatted}</span>
                <span class="currency-rate">1 ${fromCurrency} = ${this.format(this.getRate(fromCurrency, currency), currency)}</span>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = html;
    }
    
    getCurrencyName(code) {
        const names = {
            NPR: 'Rupia Nepalí',
            BTN: 'Ngultrum Butanés', 
            EUR: 'Euro'
        };
        return names[code] || code;
    }
    
    /**
     * Obtiene estadísticas de uso
     * @returns {object} Estadísticas
     */
    getStats() {
        return {
            availableCurrencies: Object.keys(this.rates),
            totalRates: Object.values(this.rates).reduce((sum, rates) => sum + Object.keys(rates).length, 0),
            lastUpdate: this.getUpdateInfo(),
            cacheStatus: this.lastUpdate ? 'active' : 'empty'
        };
    }
}

// Exportar instancia singleton
export const currencyConverter = new CurrencyConverter();
export default currencyConverter;
