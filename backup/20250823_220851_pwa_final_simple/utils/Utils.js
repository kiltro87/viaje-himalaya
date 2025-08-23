// Utilidades generales de la aplicación
export class Utils {
    /**
     * Formatea un número como moneda
     * @param {number} amount - Cantidad a formatear
     * @param {boolean} showSymbol - Si mostrar el símbolo de la moneda
     * @returns {string} Cantidad formateada
     */
    static formatCurrency(amount, showSymbol = false) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '0,00 €';
        }
        
        const formatted = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
        
        return showSymbol ? `${formatted} €` : formatted;
    }

    /**
     * Calcula el subtotal de una lista de gastos
     * @param {Array} expenses - Lista de gastos
     * @returns {number} Subtotal calculado
     */
    static calculateSubtotal(expenses) {
        if (!Array.isArray(expenses)) return 0;
        
        return expenses.reduce((sum, item) => {
            if (item.cost) return sum + item.cost;
            if (item.subItems) {
                return sum + item.subItems.reduce((subSum, subItem) => subSum + (subItem.cost || 0), 0);
            }
            return sum;
        }, 0);
    }

    /**
     * Obtiene la fecha del viaje basada en el día
     * @param {number} dayOffset - Día del viaje (0 = primer día)
     * @returns {Date} Fecha calculada
     */
    static getTripDate(dayOffset) {
        const startDate = new Date('2024-10-01');
        const resultDate = new Date(startDate);
        resultDate.setDate(startDate.getDate() + dayOffset);
        return resultDate;
    }

    /**
     * Formatea una fecha en formato corto
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    static formatShortDate(date) {
        if (!(date instanceof Date)) return '';
        
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    /**
     * Formatea una fecha en formato largo
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    static formatLongDate(date) {
        if (!(date instanceof Date)) return '';
        
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Calcula la diferencia en días entre dos fechas
     * @param {Date} date1 - Primera fecha
     * @param {Date} date2 - Segunda fecha
     * @returns {number} Diferencia en días
     */
    static getDaysDifference(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    }

    /**
     * Verifica si una fecha está en el futuro
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si la fecha está en el futuro
     */
    static isFutureDate(date) {
        if (!(date instanceof Date)) return false;
        return date > new Date();
    }

    /**
     * Genera un ID único
     * @returns {string} ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Debounce function para optimizar llamadas
     * @param {Function} func - Función a debounce
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} Función debounced
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function para limitar llamadas
     * @param {Function} func - Función a throttle
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function} Función throttled
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean} True si el email es válido
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida un número de teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} True si el teléfono es válido
     */
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Capitaliza la primera letra de una cadena
     * @param {string} str - Cadena a capitalizar
     * @returns {string} Cadena capitalizada
     */
    static capitalize(str) {
        if (typeof str !== 'string') return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Formatea un número con separadores de miles
     * @param {number} num - Número a formatear
     * @returns {string} Número formateado
     */
    static formatNumber(num) {
        if (typeof num !== 'number') return '0';
        return num.toLocaleString('es-ES');
    }

    /**
     * Redondea un número a un número específico de decimales
     * @param {number} num - Número a redondear
     * @param {number} decimals - Número de decimales
     * @returns {number} Número redondeado
     */
    static roundToDecimals(num, decimals = 2) {
        if (typeof num !== 'number') return 0;
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Calcula el porcentaje de un valor respecto a un total
     * @param {number} value - Valor
     * @param {number} total - Total
     * @returns {number} Porcentaje calculado
     */
    static calculatePercentage(value, total) {
        if (typeof value !== 'number' || typeof total !== 'number' || total === 0) return 0;
        return (value / total) * 100;
    }

    /**
     * Formatea un porcentaje
     * @param {number} percentage - Porcentaje a formatear
     * @returns {string} Porcentaje formateado
     */
    static formatPercentage(percentage) {
        if (typeof percentage !== 'number') return '0%';
        return `${percentage.toFixed(1)}%`;
    }

    /**
     * Obtiene el nombre del mes en español
     * @param {number} month - Número del mes (0-11)
     * @returns {string} Nombre del mes
     */
    static getMonthName(month) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month] || '';
    }

    /**
     * Obtiene el nombre del día de la semana en español
     * @param {number} day - Número del día (0-6)
     * @returns {string} Nombre del día
     */
    static getDayName(day) {
        const days = [
            'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
        ];
        return days[day] || '';
    }

    /**
     * Verifica si un objeto está vacío
     * @param {Object} obj - Objeto a verificar
     * @returns {boolean} True si el objeto está vacío
     */
    static isEmptyObject(obj) {
        return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    /**
     * Clona un objeto de forma profunda
     * @param {Object} obj - Objeto a clonar
     * @returns {Object} Objeto clonado
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * Limpia un objeto eliminando propiedades undefined/null
     * @param {Object} obj - Objeto a limpiar
     * @returns {Object} Objeto limpio
     */
    static cleanObject(obj) {
        const cleaned = {};
        for (const key in obj) {
            if (obj[key] !== undefined && obj[key] !== null) {
                cleaned[key] = obj[key];
            }
        }
        return cleaned;
    }

    /**
     * Convierte un objeto a query string
     * @param {Object} obj - Objeto a convertir
     * @returns {string} Query string
     */
    static objectToQueryString(obj) {
        return Object.keys(obj)
            .filter(key => obj[key] !== undefined && obj[key] !== null)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
            .join('&');
    }

    /**
     * Convierte un query string a objeto
     * @param {string} queryString - Query string a convertir
     * @returns {Object} Objeto resultante
     */
    static queryStringToObject(queryString) {
        const params = new URLSearchParams(queryString);
        const obj = {};
        for (const [key, value] of params) {
            obj[key] = value;
        }
        return obj;
    }

    /**
     * Genera un color aleatorio en formato hexadecimal
     * @returns {string} Color en formato hexadecimal
     */
    static generateRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    /**
     * Convierte un color hexadecimal a RGB
     * @param {string} hex - Color hexadecimal
     * @returns {Object} Objeto con valores RGB
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convierte RGB a hexadecimal
     * @param {number} r - Valor rojo (0-255)
     * @param {number} g - Valor verde (0-255)
     * @param {number} b - Valor azul (0-255)
     * @returns {string} Color en formato hexadecimal
     */
    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    /**
     * Calcula la distancia entre dos puntos geográficos
     * @param {number} lat1 - Latitud del primer punto
     * @param {number} lon1 - Longitud del primer punto
     * @param {number} lat2 - Latitud del segundo punto
     * @param {number} lon2 - Longitud del segundo punto
     * @returns {number} Distancia en kilómetros
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convierte grados a radianes
     * @param {number} deg - Grados
     * @returns {number} Radianes
     */
    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    /**
     * Formatea una distancia
     * @param {number} distance - Distancia en kilómetros
     * @returns {string} Distancia formateada
     */
    static formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        } else if (distance < 10) {
            return `${distance.toFixed(1)} km`;
        } else {
            return `${Math.round(distance)} km`;
        }
    }

    /**
     * Formatea una duración en segundos
     * @param {number} seconds - Duración en segundos
     * @returns {string} Duración formateada
     */
    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    /**
     * Verifica si un elemento está en el viewport
     * @param {Element} element - Elemento a verificar
     * @returns {boolean} True si el elemento está en el viewport
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Scroll suave a un elemento
     * @param {Element|string} target - Elemento o selector CSS
     * @param {Object} options - Opciones de scroll
     */
    static smoothScrollTo(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };

        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    /**
     * Obtiene el scroll actual de la página
     * @returns {number} Posición del scroll
     */
    static getScrollPosition() {
        return window.pageYOffset || document.documentElement.scrollTop;
    }

    /**
     * Scroll a una posición específica
     * @param {number} position - Posición del scroll
     * @param {Object} options - Opciones de scroll
     */
    static scrollToPosition(position, options = {}) {
        const defaultOptions = {
            top: position,
            behavior: 'smooth'
        };

        window.scrollTo({ ...defaultOptions, ...options });
    }

    /**
     * Verifica si el dispositivo es móvil
     * @returns {boolean} True si es móvil
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Verifica si el dispositivo es tablet
     * @returns {boolean} True si es tablet
     */
    static isTablet() {
        return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768 && window.innerWidth <= 1024;
    }

    /**
     * Verifica si el dispositivo es desktop
     * @returns {boolean} True si es desktop
     */
    static isDesktop() {
        return !this.isMobile() && !this.isTablet();
    }

    /**
     * Obtiene el tamaño de la pantalla
     * @returns {Object} Objeto con width y height
     */
    static getScreenSize() {
        return {
            width: window.innerWidth || document.documentElement.clientWidth,
            height: window.innerHeight || document.documentElement.clientHeight
        };
    }

    /**
     * Verifica si la pantalla está en modo landscape
     * @returns {boolean} True si está en landscape
     */
    static isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    /**
     * Verifica si la pantalla está en modo portrait
     * @returns {boolean} True si está en portrait
     */
    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    /**
     * Obtiene el tipo de dispositivo
     * @returns {string} Tipo de dispositivo
     */
    static getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }

    /**
     * Verifica si el navegador soporta una característica específica
     * @param {string} feature - Característica a verificar
     * @returns {boolean} True si la característica está soportada
     */
    static supportsFeature(feature) {
        const features = {
            'localStorage': () => {
                try {
                    const test = 'test';
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'sessionStorage': () => {
                try {
                    const test = 'test';
                    sessionStorage.setItem(test, test);
                    sessionStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'geolocation': () => 'geolocation' in navigator,
            'serviceWorker': () => 'serviceWorker' in navigator,
            'webGL': () => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
                } catch (e) {
                    return false;
                }
            }
        };

        return features[feature] ? features[feature]() : false;
    }

    /**
     * Obtiene información del navegador
     * @returns {Object} Información del navegador
     */
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';

        if (userAgent.includes('Chrome')) {
            browser = 'Chrome';
            version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
            version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Safari')) {
            browser = 'Safari';
            version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Edge')) {
            browser = 'Edge';
            version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
        }

        return { browser, version, userAgent };
    }

    /**
     * Obtiene información del sistema operativo
     * @returns {Object} Información del sistema operativo
     */
    static getOSInfo() {
        const userAgent = navigator.userAgent;
        let os = 'Unknown';
        let version = 'Unknown';

        if (userAgent.includes('Windows')) {
            os = 'Windows';
            if (userAgent.includes('Windows NT 10.0')) version = '10';
            else if (userAgent.includes('Windows NT 6.3')) version = '8.1';
            else if (userAgent.includes('Windows NT 6.2')) version = '8';
            else if (userAgent.includes('Windows NT 6.1')) version = '7';
        } else if (userAgent.includes('Mac OS X')) {
            os = 'macOS';
            version = userAgent.match(/Mac OS X (\d+_\d+)/)?.[1].replace('_', '.') || 'Unknown';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
            version = userAgent.match(/Android (\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('iOS')) {
            os = 'iOS';
            version = userAgent.match(/OS (\d+_\d+)/)?.[1].replace('_', '.') || 'Unknown';
        }

        return { os, version };
    }

    /**
     * Obtiene información completa del dispositivo
     * @returns {Object} Información completa del dispositivo
     */
    static getDeviceInfo() {
        return {
            ...this.getBrowserInfo(),
            ...this.getOSInfo(),
            deviceType: this.getDeviceType(),
            screenSize: this.getScreenSize(),
            orientation: this.isLandscape() ? 'landscape' : 'portrait',
            features: {
                localStorage: this.supportsFeature('localStorage'),
                sessionStorage: this.supportsFeature('sessionStorage'),
                geolocation: this.supportsFeature('geolocation'),
                serviceWorker: this.supportsFeature('serviceWorker'),
                webGL: this.supportsFeature('webGL')
            }
        };
    }
}
