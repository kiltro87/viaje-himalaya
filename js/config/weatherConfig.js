/**
 * 🌤️ WEATHER API CONFIGURATION
 * 
 * Configuración para el clima en tiempo real.
 * 
 * Para habilitar el clima en tiempo real:
 * 1. Obtén una API key gratuita de OpenWeatherMap: https://openweathermap.org/api
 * 2. Descomenta la línea de abajo y añade tu API key
 * 3. O guárdala en localStorage: localStorage.setItem('weatherApiKey', 'TU_API_KEY')
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

// 🔑 CONFIGURACIÓN DE API KEY
// API key de OpenWeatherMap configurada:
window.WEATHER_API_KEY = '1b1dbbeb6444b4ea9961811467326ea6';

// 🌍 CONFIGURACIÓN ALTERNATIVA
// También puedes configurar la API key dinámicamente:
export const weatherConfig = {
    // API key (opcional - funciona sin ella con datos estáticos)
    apiKey: window.WEATHER_API_KEY || localStorage.getItem('weatherApiKey') || null,
    
    // Configuración de cache (30 minutos)
    cacheExpiry: 30 * 60 * 1000,
    
    // Intervalo de actualización automática (30 minutos)
    updateInterval: 30 * 60 * 1000,
    
    // URLs de la API
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    
    // Configuración por defecto
    defaultUnits: 'metric',
    defaultLang: 'es'
};

// 🛠️ FUNCIÓN DE CONFIGURACIÓN DINÁMICA
export function configureWeatherApi(apiKey) {
    if (apiKey) {
        window.WEATHER_API_KEY = apiKey;
        localStorage.setItem('weatherApiKey', apiKey);
        
        // Reinicializar WeatherManager si existe
        if (window.WeatherManager) {
            window.WeatherManager.configure({ apiKey });
        }
        
        console.log('✅ Weather API key configured successfully');
        return true;
    }
    return false;
}

// 🔍 FUNCIÓN PARA VERIFICAR CONFIGURACIÓN
export function checkWeatherConfig() {
    const hasApiKey = !!(window.WEATHER_API_KEY || localStorage.getItem('weatherApiKey'));
    
    return {
        hasApiKey,
        isRealTimeEnabled: hasApiKey,
        message: hasApiKey 
            ? '✅ Clima en tiempo real habilitado' 
            : '⚠️ Usando datos estáticos (configura API key para tiempo real)'
    };
}

// 🎯 INSTRUCCIONES PARA EL USUARIO
export const weatherInstructions = {
    title: '🌤️ Cómo habilitar clima en tiempo real',
    steps: [
        '1. 🌐 Ve a https://openweathermap.org/api',
        '2. 📝 Crea una cuenta gratuita (1000 calls/día)',
        '3. 🔑 Copia tu API key',
        '4. 💾 Guárdala: localStorage.setItem("weatherApiKey", "TU_API_KEY")',
        '5. 🔄 Recarga la página'
    ],
    benefits: [
        '🌡️ Temperatura actual en tiempo real',
        '📅 Pronóstico de 5 días',
        '🎯 Recomendaciones contextuales por actividad',
        '⚠️ Alertas meteorológicas automáticas',
        '🔄 Actualización automática cada 30 minutos'
    ]
};

console.log('🌤️ Weather config loaded:', checkWeatherConfig().message);
