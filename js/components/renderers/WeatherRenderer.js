/**
 * WeatherRenderer - Renderizador de Información Climática
 * 
 * Módulo especializado para renderizar toda la información climática
 * de forma consistente y responsive.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import { tripConfig } from '../../config/tripConfig.js';
import { HeaderRenderer } from './HeaderRenderer.js';

export class WeatherRenderer {
    
    /**
     * Renderiza la sección completa de información climática
     * 
     * @param {HTMLElement} container - Contenedor donde renderizar
     */
    static renderWeatherSection(container) {
        if (!container) {
            console.error('❌ WeatherRenderer: Contenedor no encontrado');
            return;
        }

        const headerHTML = HeaderRenderer.renderPresetHeader('weather');
        const currentWeatherHTML = this.renderCurrentLocationWeather();
        const citiesWeatherHTML = this.renderCitiesWeatherGrid();
        const infoHTML = this.renderClimateInfo();

        container.innerHTML = `
            ${headerHTML}
            ${currentWeatherHTML}
            ${infoHTML}
            ${citiesWeatherHTML}
        `;

        console.log('✅ WeatherRenderer: Sección climática renderizada');
    }

    /**
     * Renderiza el clima contextual del día actual
     */
    static renderCurrentLocationWeather() {
        return `
            <div class="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl border border-blue-200 dark:border-blue-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">location_on</span>
                        <div>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Katmandú - Clima Actual</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Octubre 2025 - Temporada ideal</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">23°C</div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">Despejado</div>
                    </div>
                </div>
                
                ${this.renderWeatherStats()}
                ${this.renderWeatherRecommendations()}
            </div>
        `;
    }

    /**
     * Renderiza las estadísticas climáticas (responsive)
     */
    static renderWeatherStats() {
        return `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div class="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                    <div class="text-sm text-slate-600 dark:text-slate-400">Sensación</div>
                    <div class="font-semibold text-slate-900 dark:text-white">26°C</div>
                </div>
                <div class="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                    <div class="text-sm text-slate-600 dark:text-slate-400">Humedad</div>
                    <div class="font-semibold text-slate-900 dark:text-white">68%</div>
                </div>
                <div class="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                    <div class="text-sm text-slate-600 dark:text-slate-400">Viento</div>
                    <div class="font-semibold text-slate-900 dark:text-white">12 km/h</div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza recomendaciones climáticas
     */
    static renderWeatherRecommendations() {
        return `
            <div class="pt-3 border-t border-blue-200 dark:border-blue-700">
                <h4 class="font-semibold text-slate-900 dark:text-white mb-2">💡 Recomendaciones para hoy</h4>
                <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Perfecto para explorar templos al aire libre</li>
                    <li>• Lleva una chaqueta ligera para la noche</li>
                    <li>• Excelente visibilidad para fotografía</li>
                </ul>
            </div>
        `;
    }

    /**
     * Renderiza información general del clima
     */
    static renderClimateInfo() {
        return `
            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                        <span class="material-symbols-outlined text-white">info</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-blue-900 dark:text-blue-200 mb-2">Clima del Himalaya en Octubre</h3>
                        <p class="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                            Octubre es una de las mejores épocas para visitar Nepal y Bután. Las temperaturas son agradables, 
                            los cielos están despejados y la visibilidad de las montañas es excelente. En Nepal las temperaturas 
                            oscilan entre 15-25°C, mientras que en Bután pueden ser un poco más frescas (10-20°C) especialmente en las montañas.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el grid de ciudades con información climática completa
     */
    static renderCitiesWeatherGrid() {
        const enhancedWeatherData = this.enhanceWeatherData(tripConfig.weatherLocations);
        
        const weatherHTML = enhancedWeatherData.map(weather => `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                ${this.renderCityHeader(weather)}
                ${this.renderCityTemperatures(weather)}
                ${this.renderCityDetails(weather)}
                ${this.renderCityForecast(weather)}
            </div>
        `).join('');

        return `
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                ${weatherHTML}
            </div>
        `;
    }

    /**
     * Mejora los datos climáticos con información adicional
     */
    static enhanceWeatherData(weatherLocations) {
        return weatherLocations.map(weather => ({
            ...weather,
            feelsLike: this.getFeelsLikeTemp(weather.location),
            humidity: this.getHumidity(weather.location),
            windSpeed: this.getWindSpeed(weather.location),
            condition: this.getCondition(weather.location),
            forecast: this.getForecast(weather.location)
        }));
    }

    /**
     * Renderiza el header de cada ciudad
     */
    static renderCityHeader(weather) {
        const weatherIcon = this.getWeatherIcon(weather.location);
        
        return `
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h4 class="text-lg font-bold text-slate-900 dark:text-white">${weather.location}</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${weather.condition}</p>
                </div>
                <div class="text-3xl">${weatherIcon}</div>
            </div>
        `;
    }

    /**
     * Renderiza las temperaturas de cada ciudad
     */
    static renderCityTemperatures(weather) {
        return `
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <span class="text-sm text-slate-600 dark:text-slate-400 block">Día</span>
                    <span class="text-lg font-bold text-slate-900 dark:text-white">${weather.dayTemp}</span>
                </div>
                <div class="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <span class="text-sm text-slate-600 dark:text-slate-400 block">Noche</span>
                    <span class="text-lg font-bold text-slate-900 dark:text-white">${weather.nightTemp}</span>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza detalles adicionales del clima
     */
    static renderCityDetails(weather) {
        return `
            <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-600 dark:text-slate-400">Sensación térmica:</span>
                    <span class="font-medium text-slate-900 dark:text-white">${weather.feelsLike}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-600 dark:text-slate-400">Humedad:</span>
                    <span class="font-medium text-slate-900 dark:text-white">${weather.humidity}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-600 dark:text-slate-400">Viento:</span>
                    <span class="font-medium text-slate-900 dark:text-white">${weather.windSpeed}</span>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el pronóstico de 3 días
     */
    static renderCityForecast(weather) {
        return `
            <div class="border-t border-slate-200 dark:border-slate-700 pt-3">
                <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Próximos días</h5>
                <div class="space-y-1">
                    ${weather.forecast.map(day => `
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-600 dark:text-slate-400">${day.day}</span>
                            <div class="flex items-center gap-2">
                                <span>${day.icon}</span>
                                <span class="font-medium text-slate-900 dark:text-white">${day.temp}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Métodos utilitarios para datos climáticos
    static getFeelsLikeTemp(location) {
        const temps = {
            'Katmandú': '25-28°C',
            'Pokhara': '24-27°C',
            'Chitwan': '28-32°C',
            'Thimphu': '12-18°C',
            'Paro': '10-16°C'
        };
        return temps[location] || '20-25°C';
    }

    static getHumidity(location) {
        const humidity = {
            'Chitwan': '85%',
            'Katmandú': '70%',
            'Pokhara': '75%'
        };
        return humidity[location] || '60%';
    }

    static getWindSpeed(location) {
        return location === 'Paro' ? '15 km/h' : '8 km/h';
    }

    static getCondition(location) {
        const conditions = {
            'Chitwan': 'Soleado y húmedo',
            'Thimphu': 'Parcialmente nublado',
            'Paro': 'Fresco de montaña'
        };
        return conditions[location] || 'Despejado';
    }

    static getWeatherIcon(location) {
        const icons = {
            'Chitwan': '☀️',
            'Thimphu': '⛅',
            'Paro': '❄️'
        };
        return icons[location] || '☀️';
    }

    static getForecast(location) {
        return [
            { day: 'Mañana', temp: '22-26°C', condition: 'Soleado', icon: '☀️' },
            { day: 'Pasado', temp: '20-24°C', condition: 'Nublado', icon: '☁️' },
            { day: 'Viernes', temp: '23-27°C', condition: 'Despejado', icon: '🌤️' }
        ];
    }
}
