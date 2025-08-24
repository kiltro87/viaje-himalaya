/**
 * 🌤️ WEATHER MANAGER
 * 
 * Gestiona información climática en tiempo real y pronósticos.
 * Integra múltiples APIs meteorológicas y proporciona datos contextuales
 * basados en el itinerario del viaje.
 * 
 * Funcionalidades:
 * - Clima en tiempo real por geolocalización
 * - Pronóstico para fechas específicas del itinerario
 * - Alertas meteorológicas automáticas
 * - Recomendaciones contextuales de equipaje
 * - Fallback a datos estáticos si no hay conexión
 * - Cache inteligente para optimizar llamadas API
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { Logger } from './Logger.js';

export class WeatherManager {
    constructor() {
        this.apiKey = null; // Se configurará dinámicamente
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
        this.cache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutos
        this.isRealTimeEnabled = false;
        this.updateInterval = null;
        
        // Coordenadas de ciudades del itinerario
        this.cityCoordinates = {
            'Katmandú': { lat: 27.7172, lon: 85.3240, country: 'NP' },
            'Pokhara': { lat: 28.2096, lon: 83.9856, country: 'NP' },
            'Chitwan': { lat: 27.5291, lon: 84.3542, country: 'NP' },
            'Thimphu': { lat: 27.4728, lon: 89.6390, country: 'BT' },
            'Paro': { lat: 27.4315, lon: 89.4119, country: 'BT' },
            'Punakha': { lat: 27.5934, lon: 89.8774, country: 'BT' }
        };

        // Categorías de actividades para recomendaciones inteligentes (del usuario)
        this.activityCategories = {
            'naturaleza': { 
                keywords: ['trekking', 'rafting', 'parque', 'montaña', 'selva', 'río', 'lago'], 
                emoji: '🌲', 
                color: 'text-green-500',
                weatherTips: {
                    rain: 'Actividades de naturaleza pueden ser peligrosas con lluvia',
                    cold: 'Equipo de montaña necesario para actividades al aire libre',
                    hot: 'Hidratación extra importante para actividades de naturaleza'
                }
            },
            'cultura': { 
                keywords: ['templo', 'monasterio', 'museo', 'plaza', 'durbar', 'dzong', 'estupa'], 
                emoji: '🏛️', 
                color: 'text-amber-500',
                weatherTips: {
                    rain: 'Perfecto para visitas a templos y museos cubiertos',
                    cold: 'Ideal para explorar sitios culturales interiores',
                    hot: 'Busca templos con sombra y espacios frescos'
                }
            },
            'ciudad': { 
                keywords: ['thamel', 'pokhara', 'thimphu', 'paro', 'katmandú', 'mercado', 'restaurante'], 
                emoji: '🏙️', 
                color: 'text-red-500',
                weatherTips: {
                    rain: 'Perfecto para explorar mercados cubiertos y restaurantes',
                    cold: 'Ideal para recorrer la ciudad y entrar en tiendas',
                    hot: 'Busca cafés con aire acondicionado y sombra'
                }
            },
            'aventura': { 
                keywords: ['parapente', 'rafting', 'trekking', 'safari'], 
                emoji: '🏔️', 
                color: 'text-purple-500',
                weatherTips: {
                    rain: '⚠️ Actividades de aventura canceladas por seguridad',
                    cold: 'Equipo especializado obligatorio para aventura',
                    hot: 'Actividades de aventura mejor temprano en la mañana'
                }
            },
            'relax': { 
                keywords: ['aguas termales', 'spa', 'descanso', 'tarde libre'], 
                emoji: '🏖️', 
                color: 'text-sky-500',
                weatherTips: {
                    rain: 'Perfecto para spa y relajación en interiores',
                    cold: 'Aguas termales ideales con clima frío',
                    hot: 'Spa con aire acondicionado recomendado'
                }
            }
        };
        
        Logger.info('🌤️ WeatherManager initialized');
    }

    /**
     * 🔧 CONFIGURACIÓN: Configurar API key y habilitar tiempo real
     */
    configure(options = {}) {
        this.apiKey = options.apiKey || this.detectApiKey();
        this.isRealTimeEnabled = !!this.apiKey;
        
        if (this.isRealTimeEnabled) {
            Logger.success('🌤️ Real-time weather enabled');
            this.startAutoUpdate();
        } else {
            Logger.warn('🌤️ Using static weather data (no API key)');
        }
    }

    /**
     * 🔍 DETECTAR API KEY: Buscar API key en variables de entorno o configuración
     */
    detectApiKey() {
        // Intentar obtener API key de diferentes fuentes
        return (
            window.WEATHER_API_KEY ||
            localStorage.getItem('weatherApiKey') ||
            null
        );
    }

    /**
     * 🌍 CLIMA ACTUAL: Obtener clima actual por ciudad
     */
    async getCurrentWeather(cityName) {
        try {
            const cacheKey = `current_${cityName}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            if (!this.isRealTimeEnabled) {
                return this.getStaticWeather(cityName);
            }

            const coords = this.cityCoordinates[cityName];
            if (!coords) {
                Logger.warn(`🌤️ No coordinates for ${cityName}, using static data`);
                return this.getStaticWeather(cityName);
            }

            const url = `${this.baseUrl}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&units=metric&lang=es`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();
            const weatherData = this.parseCurrentWeather(data, cityName);
            
            this.setCache(cacheKey, weatherData);
            Logger.success(`🌤️ Current weather loaded for ${cityName}`);
            
            return weatherData;
            
        } catch (error) {
            Logger.error(`🌤️ Error getting current weather for ${cityName}:`, error);
            return this.getStaticWeather(cityName);
        }
    }

    /**
     * 📅 PRONÓSTICO: Obtener pronóstico de 5 días
     */
    async getForecast(cityName, days = 5) {
        try {
            const cacheKey = `forecast_${cityName}_${days}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            if (!this.isRealTimeEnabled) {
                return this.getStaticForecast(cityName, days);
            }

            const coords = this.cityCoordinates[cityName];
            if (!coords) {
                return this.getStaticForecast(cityName, days);
            }

            const url = `${this.forecastUrl}?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&units=metric&lang=es&cnt=${days * 8}`; // 8 forecasts per day (3h intervals)
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Forecast API error: ${response.status}`);
            }

            const data = await response.json();
            const forecastData = this.parseForecast(data, cityName, days);
            
            this.setCache(cacheKey, forecastData);
            Logger.success(`🌤️ Forecast loaded for ${cityName} (${days} days)`);
            
            return forecastData;
            
        } catch (error) {
            Logger.error(`🌤️ Error getting forecast for ${cityName}:`, error);
            return this.getStaticForecast(cityName, days);
        }
    }

    /**
     * 🎯 CLIMA CONTEXTUAL: Clima para el día actual del itinerario
     */
    async getContextualWeather() {
        try {
            const currentDay = this.getCurrentItineraryDay();
            if (!currentDay) {
                Logger.info('🌤️ No current itinerary day found');
                return null;
            }

            const weather = await this.getCurrentWeather(currentDay.location);
            
            return {
                ...weather,
                context: {
                    day: currentDay.day,
                    location: currentDay.location,
                    activities: currentDay.activities || [],
                    recommendations: this.getActivityRecommendations(weather, currentDay.activities)
                }
            };
            
        } catch (error) {
            Logger.error('🌤️ Error getting contextual weather:', error);
            return null;
        }
    }

    /**
     * 📍 DÍA ACTUAL DEL ITINERARIO: Detectar dónde estás según fechas
     */
    getCurrentItineraryDay() {
        try {
            const today = new Date();
            const tripStart = new Date(window.tripConfig?.calendarData?.startDate || '2024-10-12');
            const daysDiff = Math.floor((today - tripStart) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 0) {
                // Antes del viaje - mostrar primer destino
                return {
                    day: 0,
                    location: 'Katmandú',
                    activities: ['Llegada', 'Descanso']
                };
            }

            // Durante el viaje - calcular día actual
            const itinerary = window.tripConfig?.itineraryData || [];
            const currentDayData = itinerary[daysDiff];
            
            if (currentDayData) {
                return {
                    day: daysDiff + 1,
                    location: this.extractLocation(currentDayData.location || currentDayData.title),
                    activities: currentDayData.activities || [currentDayData.title]
                };
            }

            // Después del viaje
            return null;
            
        } catch (error) {
            Logger.error('🌤️ Error getting current itinerary day:', error);
            return null;
        }
    }

    /**
     * 🎯 RECOMENDACIONES: Sugerencias basadas en clima y actividades
     */
    getActivityRecommendations(weather, activities = []) {
        const recommendations = [];
        const temp = weather.temperature;
        const condition = weather.condition.toLowerCase();
        
        // Determinar condición climática general
        let weatherCondition = 'normal';
        if (condition.includes('lluvia') || condition.includes('rain') || condition.includes('tormenta')) {
            weatherCondition = 'rain';
        } else if (temp < 5) {
            weatherCondition = 'cold';
        } else if (temp > 30) {
            weatherCondition = 'hot';
        }

        // 🌡️ RECOMENDACIONES POR TEMPERATURA
        if (temp < 0) {
            recommendations.push('❄️ ¡Temperatura bajo cero! Equipo de protección extrema');
            recommendations.push('🧤 Guantes, gorro y ropa térmica obligatorios');
        } else if (temp < 5) {
            recommendations.push('🧥 Ropa de abrigo imprescindible');
            recommendations.push('🧤 No olvides guantes y gorro');
        } else if (temp < 15) {
            recommendations.push('🧥 Lleva una chaqueta ligera');
            recommendations.push('👕 Vístete por capas');
        } else if (temp > 30) {
            recommendations.push('👕 Ropa ligera y transpirable');
            recommendations.push('🧴 Protector solar obligatorio');
            recommendations.push('💧 Hidratación constante');
        } else if (temp > 25) {
            recommendations.push('👕 Ropa cómoda y transpirable');
            recommendations.push('🧴 Protector solar recomendado');
        }

        // 🌧️ RECOMENDACIONES POR CONDICIÓN CLIMÁTICA
        if (condition.includes('lluvia') || condition.includes('rain')) {
            recommendations.push('☔ Impermeable o paraguas necesario');
            recommendations.push('👟 Calzado antideslizante');
        }

        if (condition.includes('nieve') || condition.includes('snow')) {
            recommendations.push('❄️ Equipo para nieve');
            recommendations.push('👟 Botas impermeables y antideslizantes');
        }

        if (condition.includes('tormenta') || condition.includes('storm')) {
            recommendations.push('⛈️ Evita actividades al aire libre');
            recommendations.push('🏠 Busca refugio seguro');
        }

        if (weather.windSpeed > 40) {
            recommendations.push('💨 Vientos fuertes - precaución al caminar');
        }

        // 🎯 RECOMENDACIONES POR CATEGORÍA DE ACTIVIDAD
        const detectedCategories = this.detectActivityCategories(activities);
        
        detectedCategories.forEach(({ category, categoryData, matchedActivities }) => {
            // Añadir emoji de la categoría
            recommendations.push(`${categoryData.emoji} Actividades de ${category} detectadas`);
            
            // Recomendaciones específicas por clima y categoría
            if (weatherCondition !== 'normal' && categoryData.weatherTips[weatherCondition]) {
                recommendations.push(`💡 ${categoryData.weatherTips[weatherCondition]}`);
            }

            // Recomendaciones específicas por actividad
            matchedActivities.forEach(activity => {
                const activityLower = activity.toLowerCase();
                
                if (activityLower.includes('trekking') || activityLower.includes('senderismo')) {
                    recommendations.push('🥾 Botas de trekking obligatorias');
                    recommendations.push('🎒 Mochila con agua extra');
                    
                    if (weatherCondition === 'rain') {
                        recommendations.push('⚠️ Considera posponer el trekking por seguridad');
                    } else if (weatherCondition === 'cold') {
                        recommendations.push('🧥 Ropa térmica para trekking en montaña');
                    }
                }
                
                if (activityLower.includes('parapente')) {
                    if (weather.windSpeed > 25 || weatherCondition === 'rain') {
                        recommendations.push('⚠️ Parapente cancelado por condiciones climáticas');
                    } else {
                        recommendations.push('🪂 Condiciones buenas para parapente');
                    }
                }
                
                if (activityLower.includes('rafting')) {
                    if (weatherCondition === 'rain') {
                        recommendations.push('⚠️ Rafting puede ser peligroso con lluvia');
                    } else {
                        recommendations.push('🚣 Ropa que se pueda mojar para rafting');
                    }
                }
                
                if (activityLower.includes('safari')) {
                    if (weatherCondition === 'rain') {
                        recommendations.push('📷 Protege la cámara de la lluvia en safari');
                    } else {
                        recommendations.push('🔍 Prismáticos recomendados para safari');
                    }
                }
                
                if (activityLower.includes('vuelo') || activityLower.includes('aeropuerto')) {
                    recommendations.push('✈️ Verifica estado del vuelo');
                    
                    if (condition.includes('tormenta') || weather.windSpeed > 50) {
                        recommendations.push('⚠️ Posibles retrasos por condiciones meteorológicas');
                    }
                }
            });
        });

        // 🏥 RECOMENDACIONES DE SALUD
        if (temp < 5 || temp > 35) {
            recommendations.push('🏥 Precaución extra - temperaturas extremas');
        }

        if (weather.humidity > 80) {
            recommendations.push('💧 Alta humedad - mantente hidratado');
        }

        return [...new Set(recommendations)]; // Eliminar duplicados
    }

    /**
     * 🔍 DETECTAR CATEGORÍAS: Identificar categorías de actividades en el texto
     */
    detectActivityCategories(activities = []) {
        const detectedCategories = [];
        
        Object.entries(this.activityCategories).forEach(([categoryName, categoryData]) => {
            const matchedActivities = [];
            
            activities.forEach(activity => {
                const activityLower = activity.toLowerCase();
                
                const hasMatch = categoryData.keywords.some(keyword => 
                    activityLower.includes(keyword.toLowerCase())
                );
                
                if (hasMatch) {
                    matchedActivities.push(activity);
                }
            });
            
            if (matchedActivities.length > 0) {
                detectedCategories.push({
                    category: categoryName,
                    categoryData,
                    matchedActivities
                });
            }
        });
        
        return detectedCategories;
    }

    /**
     * 🔄 AUTO-UPDATE: Actualización automática cada 30 minutos
     */
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            try {
                Logger.info('🌤️ Auto-updating weather data');
                await this.updateAllWeatherData();
            } catch (error) {
                Logger.error('🌤️ Error in auto-update:', error);
            }
        }, this.cacheExpiry);
    }

    /**
     * 🔄 UPDATE ALL: Actualizar todos los datos climáticos
     */
    async updateAllWeatherData() {
        const cities = Object.keys(this.cityCoordinates);
        const promises = cities.map(city => this.getCurrentWeather(city));
        
        try {
            await Promise.all(promises);
            
            // Actualizar UI si está visible
            const weatherContainer = document.getElementById('weather');
            if (weatherContainer && weatherContainer.offsetParent !== null) {
                this.renderEnhancedWeather();
            }
            
            Logger.success('🌤️ All weather data updated');
        } catch (error) {
            Logger.error('🌤️ Error updating weather data:', error);
        }
    }

    /**
     * 🎨 RENDER MEJORADO: Renderizar clima mejorado con datos en tiempo real
     */
    async renderEnhancedWeather() {
        const container = document.getElementById('weather');
        if (!container) return;

        try {
            // Mostrar indicador de carga
            container.innerHTML = `
                <div class="flex items-center justify-center p-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span class="ml-3 text-slate-600 dark:text-slate-400">Cargando clima en tiempo real...</span>
                </div>
            `;

            // Si no hay API key, mostrar demo mejorada
            if (!this.isRealTimeEnabled) {
                this.renderEnhancedStaticWeather();
                return;
            }

            // Obtener clima contextual (ubicación actual)
            const contextualWeather = await this.getContextualWeather();
            
            // Obtener clima de todas las ciudades
            const cities = Object.keys(this.cityCoordinates);
            const weatherPromises = cities.map(async city => {
                const current = await this.getCurrentWeather(city);
                const forecast = await this.getForecast(city, 3);
                return { city, current, forecast };
            });

            const allWeatherData = await Promise.all(weatherPromises);

            // Renderizar
            container.innerHTML = `
                ${contextualWeather ? this.renderCurrentLocationWeather(contextualWeather) : ''}
                ${this.renderWeatherGrid(allWeatherData)}
                ${this.renderWeatherAlerts(allWeatherData)}
            `;

            Logger.success('🌤️ Enhanced weather rendered');
            
        } catch (error) {
            Logger.error('🌤️ Error rendering enhanced weather:', error);
            this.renderEnhancedStaticWeather();
        }
    }

    /**
     * 🎨 RENDER DEMO: Renderizar versión mejorada con datos estáticos
     */
    renderEnhancedStaticWeather() {
        const container = document.getElementById('weather');
        if (!container) return;

        // Simular clima contextual para demo usando categorías reales
        const demoActivities = ['Visita al Templo de Swayambhunath', 'Explorar Thamel', 'Trekking por la ciudad'];
        const demoWeather = {
            temperature: 23,
            feelsLike: 25,
            condition: 'Parcialmente nublado',
            humidity: 68,
            windSpeed: 12,
            icon: '⛅'
        };
        
        const demoContextualWeather = {
            city: 'Katmandú',
            ...demoWeather,
            context: {
                day: 3,
                location: 'Katmandú',
                activities: demoActivities,
                recommendations: this.getActivityRecommendations(demoWeather, demoActivities)
            }
        };

        // Simular datos de todas las ciudades
        const demoAllWeatherData = Object.keys(this.cityCoordinates).map(city => {
            const baseTemp = city === 'Katmandú' ? 23 : 
                           city === 'Pokhara' ? 21 : 
                           city === 'Chitwan' ? 28 : 
                           city === 'Thimphu' ? 15 : 
                           city === 'Paro' ? 12 : 18;
            
            return {
                city,
                current: {
                    city,
                    temperature: baseTemp,
                    feelsLike: baseTemp + 2,
                    condition: city === 'Paro' ? 'Frío de montaña' : 'Clima templado',
                    humidity: 65,
                    windSpeed: 10,
                    icon: city === 'Paro' ? '❄️' : city === 'Chitwan' ? '☀️' : '⛅',
                    isRealTime: false
                },
                forecast: [
                    { date: 'Mañana', maxTemp: baseTemp + 2, minTemp: baseTemp - 5, condition: 'Soleado', icon: '☀️' },
                    { date: 'Pasado', maxTemp: baseTemp + 1, minTemp: baseTemp - 4, condition: 'Nublado', icon: '☁️' },
                    { date: 'Viernes', maxTemp: baseTemp - 1, minTemp: baseTemp - 6, condition: 'Despejado', icon: '🌤️' }
                ]
            };
        });

        // Renderizar con datos demo
        container.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                <div class="flex items-center gap-3 mb-6">
                    <span class="material-symbols-outlined text-2xl text-yellow-600 dark:text-yellow-400">wb_sunny</span>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información Climática</h2>
                    <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Demo mejorada</span>
                </div>
                
                <div class="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">api</span>
                        <h3 class="font-semibold text-blue-800 dark:text-blue-300">🌤️ Clima en Tiempo Real Disponible</h3>
                    </div>
                    <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Esta es una <strong>demo mejorada</strong> con recomendaciones inteligentes por actividad.
                        Para habilitar datos reales:
                    </p>
                    <div class="bg-slate-800 text-green-400 p-3 rounded-lg text-sm font-mono">
                        localStorage.setItem('weatherApiKey', 'TU_API_KEY_DE_OPENWEATHERMAP')
                    </div>
                    <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        💡 API gratuita: 1000 llamadas/día en <a href="https://openweathermap.org/api" target="_blank" class="underline">openweathermap.org</a>
                    </p>
                </div>

                ${this.renderCurrentLocationWeather(demoContextualWeather)}
                ${this.renderWeatherGrid(demoAllWeatherData)}
                
                <div class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <h4 class="font-semibold text-green-800 dark:text-green-200 mb-2">✨ Funcionalidades del Clima en Tiempo Real:</h4>
                    <ul class="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>🌡️ Temperatura actual y sensación térmica</li>
                        <li>📅 Pronóstico de 5 días con intervalos de 3 horas</li>
                        <li>🎯 Recomendaciones automáticas por actividad del itinerario</li>
                        <li>⚠️ Alertas meteorológicas para actividades de aventura</li>
                        <li>🔄 Actualización automática cada 30 minutos</li>
                        <li>📍 Clima contextual según tu día actual del viaje</li>
                    </ul>
                </div>
            </div>
        `;

        Logger.info('🌤️ Enhanced static weather demo rendered');
    }

    /**
     * 🎯 RENDER UBICACIÓN ACTUAL: Clima contextual destacado
     */
    renderCurrentLocationWeather(contextualWeather) {
        const { context, ...weather } = contextualWeather;
        
        return `
            <div class="mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-xl">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold">📍 ${context.location}</h3>
                        <p class="text-blue-100">Día ${context.day} del viaje</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold">${weather.temperature}°C</div>
                        <div class="text-blue-100">${weather.condition}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-white/20 rounded-lg p-3">
                        <div class="text-sm text-blue-100">Sensación térmica</div>
                        <div class="font-semibold">${weather.feelsLike}°C</div>
                    </div>
                    <div class="bg-white/20 rounded-lg p-3">
                        <div class="text-sm text-blue-100">Humedad</div>
                        <div class="font-semibold">${weather.humidity}%</div>
                    </div>
                </div>

                ${context.recommendations.length > 0 ? `
                    <div class="bg-white/20 rounded-lg p-3">
                        <h4 class="font-semibold mb-2">💡 Recomendaciones</h4>
                        <ul class="text-sm space-y-1">
                            ${context.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 📊 RENDER GRID: Grid de todas las ciudades
     */
    renderWeatherGrid(allWeatherData) {
        const weatherCards = allWeatherData.map(({ city, current, forecast }) => `
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div class="p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-slate-900 dark:text-white">${city}</h4>
                        <span class="text-2xl">${current.icon}</span>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-2xl font-bold text-slate-900 dark:text-white">${current.temperature}°C</span>
                            <span class="text-sm text-slate-600 dark:text-slate-400">${current.condition}</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500">Sensación:</span>
                                <span class="text-slate-700 dark:text-slate-300">${current.feelsLike}°C</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Humedad:</span>
                                <span class="text-slate-700 dark:text-slate-300">${current.humidity}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${forecast.length > 0 ? `
                    <div class="bg-slate-50 dark:bg-slate-700/50 p-3 border-t border-slate-200 dark:border-slate-600">
                        <div class="text-xs text-slate-600 dark:text-slate-400 mb-2">Próximos días</div>
                        <div class="flex justify-between">
                            ${forecast.slice(0, 3).map(day => `
                                <div class="text-center">
                                    <div class="text-xs text-slate-500">${day.date}</div>
                                    <div class="text-sm font-medium">${day.maxTemp}°</div>
                                    <div class="text-xs text-slate-500">${day.minTemp}°</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                ${weatherCards}
            </div>
        `;
    }

    /**
     * ⚠️ RENDER ALERTAS: Alertas meteorológicas importantes
     */
    renderWeatherAlerts(allWeatherData) {
        const alerts = [];
        
        allWeatherData.forEach(({ city, current }) => {
            // Alertas por temperatura extrema
            if (current.temperature < 0) {
                alerts.push({
                    type: 'warning',
                    icon: '❄️',
                    title: `Temperatura bajo cero en ${city}`,
                    message: 'Riesgo de congelación. Equipo de protección necesario.'
                });
            }
            
            if (current.temperature > 35) {
                alerts.push({
                    type: 'warning',
                    icon: '🌡️',
                    title: `Temperatura muy alta en ${city}`,
                    message: 'Riesgo de deshidratación. Mantente hidratado.'
                });
            }

            // Alertas por condiciones adversas
            if (current.condition.toLowerCase().includes('tormenta')) {
                alerts.push({
                    type: 'danger',
                    icon: '⛈️',
                    title: `Tormenta en ${city}`,
                    message: 'Evita actividades al aire libre. Busca refugio.'
                });
            }
        });

        if (alerts.length === 0) return '';

        return `
            <div class="space-y-3">
                <h3 class="font-semibold text-slate-900 dark:text-white">⚠️ Alertas Meteorológicas</h3>
                ${alerts.map(alert => `
                    <div class="bg-${alert.type === 'danger' ? 'red' : 'yellow'}-50 dark:bg-${alert.type === 'danger' ? 'red' : 'yellow'}-900/20 border border-${alert.type === 'danger' ? 'red' : 'yellow'}-200 dark:border-${alert.type === 'danger' ? 'red' : 'yellow'}-800 rounded-lg p-4">
                        <div class="flex items-start gap-3">
                            <span class="text-xl">${alert.icon}</span>
                            <div>
                                <h4 class="font-semibold text-${alert.type === 'danger' ? 'red' : 'yellow'}-800 dark:text-${alert.type === 'danger' ? 'red' : 'yellow'}-200">${alert.title}</h4>
                                <p class="text-sm text-${alert.type === 'danger' ? 'red' : 'yellow'}-700 dark:text-${alert.type === 'danger' ? 'red' : 'yellow'}-300">${alert.message}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 🔄 PARSERS: Convertir datos de API a formato interno
     */
    parseCurrentWeather(apiData, cityName) {
        return {
            city: cityName,
            temperature: Math.round(apiData.main.temp),
            feelsLike: Math.round(apiData.main.feels_like),
            condition: apiData.weather[0].description,
            humidity: apiData.main.humidity,
            windSpeed: Math.round(apiData.wind?.speed * 3.6 || 0), // m/s to km/h
            icon: this.getWeatherIcon(apiData.weather[0].icon),
            timestamp: Date.now(),
            isRealTime: true
        };
    }

    parseForecast(apiData, cityName, days) {
        const dailyForecasts = [];
        const processedDays = new Set();
        
        apiData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!processedDays.has(dayKey) && dailyForecasts.length < days) {
                dailyForecasts.push({
                    date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                    maxTemp: Math.round(item.main.temp_max),
                    minTemp: Math.round(item.main.temp_min),
                    condition: item.weather[0].description,
                    icon: this.getWeatherIcon(item.weather[0].icon)
                });
                processedDays.add(dayKey);
            }
        });
        
        return dailyForecasts;
    }

    /**
     * 🎨 ICONOS: Convertir códigos de API a iconos Material
     */
    getWeatherIcon(apiIcon) {
        const iconMap = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };
        
        return iconMap[apiIcon] || '🌤️';
    }

    /**
     * 📚 DATOS ESTÁTICOS: Fallback cuando no hay API
     */
    getStaticWeather(cityName) {
        const staticData = window.tripConfig?.weatherLocations?.find(w => w.location === cityName);
        
        if (staticData) {
            const tempRange = staticData.dayTemp.split('-');
            return {
                city: cityName,
                temperature: parseInt(tempRange[0]),
                feelsLike: parseInt(tempRange[0]),
                condition: 'Clima típico',
                humidity: 65,
                windSpeed: 10,
                icon: '🌤️',
                timestamp: Date.now(),
                isRealTime: false
            };
        }

        return {
            city: cityName,
            temperature: 20,
            feelsLike: 20,
            condition: 'Información no disponible',
            humidity: 50,
            windSpeed: 5,
            icon: '❓',
            timestamp: Date.now(),
            isRealTime: false
        };
    }

    getStaticForecast(cityName, days) {
        // Generar pronóstico básico basado en datos estáticos
        const baseTemp = this.getStaticWeather(cityName).temperature;
        const forecast = [];
        
        for (let i = 1; i <= days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
                date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                maxTemp: baseTemp + Math.floor(Math.random() * 6) - 3,
                minTemp: baseTemp - Math.floor(Math.random() * 8) - 2,
                condition: 'Pronóstico estimado',
                icon: '🌤️'
            });
        }
        
        return forecast;
    }

    /**
     * 💾 CACHE: Gestión de cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheExpiry;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * 🧹 CLEANUP: Limpiar recursos
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.cache.clear();
        Logger.info('🌤️ WeatherManager cleaned up');
    }

    /**
     * 🔧 UTILS: Utilidades auxiliares
     */
    extractLocation(locationString) {
        // Extraer ciudad principal de strings como "Katmandú - Hotel Himalaya"
        const cities = Object.keys(this.cityCoordinates);
        const found = cities.find(city => 
            locationString.toLowerCase().includes(city.toLowerCase())
        );
        return found || cities[0]; // Default a primera ciudad
    }
}

// Singleton instance
let weatherManagerInstance = null;

export function getWeatherManager() {
    if (!weatherManagerInstance) {
        weatherManagerInstance = new WeatherManager();
    }
    return weatherManagerInstance;
}
