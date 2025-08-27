// Utilidades específicas para fechas y cálculos temporales
export class DateUtils {
    /**
     * Obtiene la fecha actual en formato ISO
     * @returns {string} Fecha actual en formato ISO
     */
    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Obtiene la fecha y hora actual en formato ISO
     * @returns {string} Fecha y hora actual en formato ISO
     */
    static getCurrentDateTime() {
        return new Date().toISOString();
    }

    /**
     * Obtiene la fecha actual en formato local español
     * @returns {string} Fecha actual en formato local
     */
    static getCurrentDateLocal() {
        return new Date().toLocaleDateString('es-ES');
    }

    /**
     * Obtiene la fecha y hora actual en formato local español
     * @returns {string} Fecha y hora actual en formato local
     */
    static getCurrentDateTimeLocal() {
        return new Date().toLocaleString('es-ES');
    }

    /**
     * Obtiene el timestamp actual
     * @returns {number} Timestamp actual
     */
    static getCurrentTimestamp() {
        return Date.now();
    }

    /**
     * Obtiene la fecha de un día específico del viaje
     * @param {number} dayNumber - Número del día del viaje (0-based)
     * @returns {Date} Fecha correspondiente al día especificado
     */
    static getTripDate(dayNumber) {
        // Fecha de inicio del viaje: 9 de octubre de 2025
        const tripStartDate = new Date('2025-10-09');
        
        // Añadir el número de días al inicio del viaje
        const tripDate = new Date(tripStartDate);
        tripDate.setDate(tripStartDate.getDate() + dayNumber);
        
        return tripDate;
    }

    /**
     * Convierte una fecha ISO a objeto Date
     * @param {string} isoString - Fecha en formato ISO
     * @returns {Date} Objeto Date
     */
    static isoToDate(isoString) {
        return new Date(isoString);
    }

    /**
     * Convierte un objeto Date a formato ISO
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha en formato ISO
     */
    static dateToIso(date) {
        if (!(date instanceof Date)) return '';
        return date.toISOString();
    }

    /**
     * Convierte un objeto Date a formato local español
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha en formato local
     */
    static dateToLocal(date) {
        if (!(date instanceof Date)) return '';
        return date.toLocaleDateString('es-ES');
    }

    /**
     * Convierte un objeto Date a formato local español con hora
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha y hora en formato local
     */
    static dateToLocalWithTime(date) {
        if (!(date instanceof Date)) return '';
        return date.toLocaleString('es-ES');
    }

    /**
     * Obtiene el día de la semana en español
     * @param {Date} date - Objeto Date
     * @returns {string} Nombre del día de la semana
     */
    static getDayOfWeek(date) {
        if (!(date instanceof Date)) return '';
        
        const days = [
            'Domingo', 'Lunes', 'Martes', 'Miércoles', 
            'Jueves', 'Viernes', 'Sábado'
        ];
        
        return days[date.getDay()];
    }

    /**
     * Obtiene el nombre del mes en español
     * @param {Date} date - Objeto Date
     * @returns {string} Nombre del mes
     */
    static getMonthName(date) {
        if (!(date instanceof Date)) return '';
        
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        return months[date.getMonth()];
    }

    /**
     * Obtiene el nombre del mes en español (corto)
     * @param {Date} date - Objeto Date
     * @returns {string} Nombre corto del mes
     */
    static getShortMonthName(date) {
        if (!(date instanceof Date)) return '';
        
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        
        return months[date.getMonth()];
    }

    /**
     * Formatea una fecha en formato largo español
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha formateada
     */
    static formatLongDate(date) {
        if (!(date instanceof Date)) return '';
        
        return `${this.getDayOfWeek(date)}, ${date.getDate()} de ${this.getMonthName(date)} de ${date.getFullYear()}`;
    }

    /**
     * Formatea una fecha en formato medio español
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha formateada
     */
    static formatMediumDate(date) {
        if (!(date instanceof Date)) return '';
        
        return `${date.getDate()} de ${this.getMonthName(date)} de ${date.getFullYear()}`;
    }

    /**
     * Formatea una fecha en formato corto español
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha formateada
     */
    static formatShortDate(date) {
        if (!(date instanceof Date)) return '';
        
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }

    /**
     * Formatea una fecha en formato muy corto español
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha formateada
     */
    static formatVeryShortDate(date) {
        if (!(date instanceof Date)) return '';
        
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }

    /**
     * Formatea una fecha con el nombre del mes
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha formateada
     */
    static formatDateWithMonth(date) {
        if (!(date instanceof Date)) return '';
        
        return `${date.getDate()} ${this.getShortMonthName(date)} ${date.getFullYear()}`;
    }

    /**
     * Formatea una fecha con el nombre del mes (sin año)
     * @param {Date} date - Objeto Date
     * @returns {string} Fecha formateada
     */
    static formatDateWithMonthNoYear(date) {
        if (!(date instanceof Date)) return '';
        
        return `${date.getDate()} ${this.getShortMonthName(date)}`;
    }

    /**
     * Formatea una hora en formato 24h
     * @param {Date} date - Objeto Date
     * @returns {string} Hora formateada
     */
    static formatTime24(date) {
        if (!(date instanceof Date)) return '';
        
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    /**
     * Formatea una hora en formato 12h
     * @param {Date} date - Objeto Date
     * @returns {string} Hora formateada
     */
    static formatTime12(date) {
        if (!(date instanceof Date)) return '';
        
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    /**
     * Obtiene la edad basada en una fecha de nacimiento
     * @param {Date} birthDate - Fecha de nacimiento
     * @returns {number} Edad calculada
     */
    static calculateAge(birthDate) {
        if (!(birthDate instanceof Date)) return 0;
        
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Verifica si una fecha es hoy
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si es hoy
     */
    static isToday(date) {
        if (!(date instanceof Date)) return false;
        
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Verifica si una fecha es ayer
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si es ayer
     */
    static isYesterday(date) {
        if (!(date instanceof Date)) return false;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        return date.getDate() === yesterday.getDate() &&
               date.getMonth() === yesterday.getMonth() &&
               date.getFullYear() === yesterday.getFullYear();
    }

    /**
     * Verifica si una fecha es mañana
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si es mañana
     */
    static isTomorrow(date) {
        if (!(date instanceof Date)) return false;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return date.getDate() === tomorrow.getDate() &&
               date.getMonth() === tomorrow.getMonth() &&
               date.getFullYear() === tomorrow.getFullYear();
    }

    /**
     * Verifica si una fecha está en el futuro
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si está en el futuro
     */
    static isFuture(date) {
        if (!(date instanceof Date)) return false;
        return date > new Date();
    }

    /**
     * Verifica si una fecha está en el pasado
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si está en el pasado
     */
    static isPast(date) {
        if (!(date instanceof Date)) return false;
        return date < new Date();
    }

    /**
     * Verifica si una fecha es fin de semana
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si es fin de semana
     */
    static isWeekend(date) {
        if (!(date instanceof Date)) return false;
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    /**
     * Verifica si una fecha es día laboral
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} True si es día laboral
     */
    static isWeekday(date) {
        if (!(date instanceof Date)) return false;
        return !this.isWeekend(date);
    }

    /**
     * Obtiene el primer día del mes
     * @param {Date} date - Fecha de referencia
     * @returns {Date} Primer día del mes
     */
    static getFirstDayOfMonth(date) {
        if (!(date instanceof Date)) return new Date();
        
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Obtiene el último día del mes
     * @param {Date} date - Fecha de referencia
     * @returns {Date} Último día del mes
     */
    static getLastDayOfMonth(date) {
        if (!(date instanceof Date)) return new Date();
        
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /**
     * Obtiene el número de días en un mes
     * @param {Date} date - Fecha de referencia
     * @returns {number} Número de días en el mes
     */
    static getDaysInMonth(date) {
        if (!(date instanceof Date)) return 0;
        
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    /**
     * Obtiene el número de semanas en un mes
     * @param {Date} date - Fecha de referencia
     * @returns {number} Número de semanas en el mes
     */
    static getWeeksInMonth(date) {
        if (!(date instanceof Date)) return 0;
        
        const firstDay = this.getFirstDayOfMonth(date);
        const lastDay = this.getLastDayOfMonth(date);
        const daysInMonth = this.getDaysInMonth(date);
        
        const firstDayOfWeek = firstDay.getDay();
        const lastDayOfWeek = lastDay.getDay();
        
        return Math.ceil((daysInMonth + firstDayOfWeek) / 7);
    }

    /**
     * Obtiene el primer día de la semana
     * @param {Date} date - Fecha de referencia
     * @returns {Date} Primer día de la semana
     */
    static getFirstDayOfWeek(date) {
        if (!(date instanceof Date)) return new Date();
        
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek;
        
        return new Date(date.setDate(diff));
    }

    /**
     * Obtiene el último día de la semana
     * @param {Date} date - Fecha de referencia
     * @returns {Date} Último día de la semana
     */
    static getLastDayOfWeek(date) {
        if (!(date instanceof Date)) return new Date();
        
        const firstDay = this.getFirstDayOfWeek(date);
        firstDay.setDate(firstDay.getDate() + 6);
        
        return firstDay;
    }

    /**
     * Obtiene el número de días entre dos fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {number} Número de días
     */
    static getDaysBetween(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) return 0;
        
        const oneDay = 24 * 60 * 60 * 1000;
        const diffTime = Math.abs(endDate - startDate);
        
        return Math.ceil(diffTime / oneDay);
    }

    /**
     * Obtiene el número de semanas entre dos fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {number} Número de semanas
     */
    static getWeeksBetween(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) return 0;
        
        const days = this.getDaysBetween(startDate, endDate);
        return Math.ceil(days / 7);
    }

    /**
     * Obtiene el número de meses entre dos fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {number} Número de meses
     */
    static getMonthsBetween(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) return 0;
        
        const yearDiff = endDate.getFullYear() - startDate.getFullYear();
        const monthDiff = endDate.getMonth() - startDate.getMonth();
        
        return yearDiff * 12 + monthDiff;
    }

    /**
     * Obtiene el número de años entre dos fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {number} Número de años
     */
    static getYearsBetween(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) return 0;
        
        return endDate.getFullYear() - startDate.getFullYear();
    }

    /**
     * Añade días a una fecha
     * @param {Date} date - Fecha base
     * @param {number} days - Número de días a añadir
     * @returns {Date} Nueva fecha
     */
    static addDays(date, days) {
        if (!(date instanceof Date)) return new Date();
        
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        
        return result;
    }

    /**
     * Añade semanas a una fecha
     * @param {Date} date - Fecha base
     * @param {number} weeks - Número de semanas a añadir
     * @returns {Date} Nueva fecha
     */
    static addWeeks(date, weeks) {
        if (!(date instanceof Date)) return new Date();
        
        return this.addDays(date, weeks * 7);
    }

    /**
     * Añade meses a una fecha
     * @param {Date} date - Fecha base
     * @param {number} months - Número de meses a añadir
     * @returns {Date} Nueva fecha
     */
    static addMonths(date, months) {
        if (!(date instanceof Date)) return new Date();
        
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        
        return result;
    }

    /**
     * Añade años a una fecha
     * @param {Date} date - Fecha base
     * @param {number} years - Número de años a añadir
     * @returns {Date} Nueva fecha
     */
    static addYears(date, years) {
        if (!(date instanceof Date)) return new Date();
        
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        
        return result;
    }

    /**
     * Resta días a una fecha
     * @param {Date} date - Fecha base
     * @param {number} days - Número de días a restar
     * @returns {Date} Nueva fecha
     */
    static subtractDays(date, days) {
        if (!(date instanceof Date)) return new Date();
        
        return this.addDays(date, -days);
    }

    /**
     * Resta semanas a una fecha
     * @param {Date} date - Fecha base
     * @param {number} weeks - Número de semanas a restar
     * @returns {Date} Nueva fecha
     */
    static subtractWeeks(date, weeks) {
        if (!(date instanceof Date)) return new Date();
        
        return this.addWeeks(date, -weeks);
    }

    /**
     * Resta meses a una fecha
     * @param {Date} date - Fecha base
     * @param {number} months - Número de meses a restar
     * @returns {Date} Nueva fecha
     */
    static subtractMonths(date, months) {
        if (!(date instanceof Date)) return new Date();
        
        return this.addMonths(date, -months);
    }

    /**
     * Resta años a una fecha
     * @param {Date} date - Fecha base
     * @param {number} years - Número de años a restar
     * @returns {Date} Nueva fecha
     */
    static subtractYears(date, years) {
        if (!(date instanceof Date)) return new Date();
        
        return this.addYears(date, -years);
    }

    /**
     * Obtiene la fecha del próximo día de la semana
     * @param {Date} date - Fecha de referencia
     * @param {number} dayOfWeek - Día de la semana (0-6, donde 0 es domingo)
     * @returns {Date} Próximo día de la semana
     */
    static getNextDayOfWeek(date, dayOfWeek) {
        if (!(date instanceof Date)) return new Date();
        
        const result = new Date(date);
        const currentDay = result.getDay();
        const daysToAdd = (dayOfWeek + 7 - currentDay) % 7;
        
        if (daysToAdd === 0) {
            result.setDate(result.getDate() + 7);
        } else {
            result.setDate(result.getDate() + daysToAdd);
        }
        
        return result;
    }

    /**
     * Obtiene la fecha del día anterior de la semana
     * @param {Date} date - Fecha de referencia
     * @param {number} dayOfWeek - Día de la semana (0-6, donde 0 es domingo)
     * @returns {Date} Día anterior de la semana
     */
    static getPreviousDayOfWeek(date, dayOfWeek) {
        if (!(date instanceof Date)) return new Date();
        
        const result = new Date(date);
        const currentDay = result.getDay();
        const daysToSubtract = (currentDay + 7 - dayOfWeek) % 7;
        
        if (daysToSubtract === 0) {
            result.setDate(result.getDate() - 7);
        } else {
            result.setDate(result.getDate() - daysToSubtract);
        }
        
        return result;
    }

    /**
     * Verifica si una fecha está en el mismo mes que otra
     * @param {Date} date1 - Primera fecha
     * @param {Date} date2 - Segunda fecha
     * @returns {boolean} True si están en el mismo mes
     */
    static isSameMonth(date1, date2) {
        if (!(date1 instanceof Date) || !(date2 instanceof Date)) return false;
        
        return date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    }

    /**
     * Verifica si una fecha está en el mismo año que otra
     * @param {Date} date1 - Primera fecha
     * @param {Date} date2 - Segunda fecha
     * @returns {boolean} True si están en el mismo año
     */
    static isSameYear(date1, date2) {
        if (!(date1 instanceof Date) || !(date2 instanceof Date)) return false;
        
        return date1.getFullYear() === date2.getFullYear();
    }

    /**
     * Obtiene el nombre del trimestre
     * @param {Date} date - Fecha de referencia
     * @returns {string} Nombre del trimestre
     */
    static getQuarterName(date) {
        if (!(date instanceof Date)) return '';
        
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarters = ['', 'Primer', 'Segundo', 'Tercer', 'Cuarto'];
        
        return `${quarters[quarter]} Trimestre`;
    }

    /**
     * Obtiene el número del trimestre
     * @param {Date} date - Fecha de referencia
     * @returns {number} Número del trimestre (1-4)
     */
    static getQuarterNumber(date) {
        if (!(date instanceof Date)) return 0;
        
        return Math.floor(date.getMonth() / 3) + 1;
    }

    /**
     * Obtiene el primer día del trimestre
     * @param {Date} date - Fecha de referencia
     * @returns {Date} Primer día del trimestre
     */
    static getFirstDayOfQuarter(date) {
        if (!(date instanceof Date)) return new Date();
        
        const quarter = this.getQuarterNumber(date);
        const month = (quarter - 1) * 3;
        
        return new Date(date.getFullYear(), month, 1);
    }

    /**
     * Obtiene el último día del trimestre
     * @param {Date} date - Fecha de referencia
     * @returns {Date} Último día del trimestre
     */
    static getLastDayOfQuarter(date) {
        if (!(date instanceof Date)) return new Date();
        
        const quarter = this.getQuarterNumber(date);
        const month = quarter * 3;
        
        return new Date(date.getFullYear(), month, 0);
    }

    /**
     * Obtiene el nombre de la estación del año
     * @param {Date} date - Fecha de referencia
     * @returns {string} Nombre de la estación
     */
    static getSeasonName(date) {
        if (!(date instanceof Date)) return '';
        
        const month = date.getMonth();
        const day = date.getDate();
        
        if ((month === 2 && day >= 21) || month === 3 || month === 4 || (month === 5 && day <= 20)) {
            return 'Primavera';
        } else if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day <= 22)) {
            return 'Verano';
        } else if ((month === 8 && day >= 23) || month === 9 || month === 10 || (month === 11 && day <= 20)) {
            return 'Otoño';
        } else {
            return 'Invierno';
        }
    }

    /**
     * Obtiene el número de días en el año
     * @param {Date} date - Fecha de referencia
     * @returns {number} Número de días en el año
     */
    static getDaysInYear(date) {
        if (!(date instanceof Date)) return 365;
        
        const year = date.getFullYear();
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0) ? 366 : 365;
    }

    /**
     * Verifica si un año es bisiesto
     * @param {number} year - Año a verificar
     * @returns {boolean} True si es bisiesto
     */
    static isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    /**
     * Obtiene el número de días desde el inicio del año
     * @param {Date} date - Fecha de referencia
     * @returns {number} Número de días desde el inicio del año
     */
    static getDayOfYear(date) {
        if (!(date instanceof Date)) return 0;
        
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        
        return Math.floor(diff / oneDay);
    }

    /**
     * Obtiene el número de semanas desde el inicio del año
     * @param {Date} date - Fecha de referencia
     * @returns {number} Número de semanas desde el inicio del año
     */
    static getWeekOfYear(date) {
        if (!(date instanceof Date)) return 0;
        
        const start = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
        
        return Math.ceil((days + start.getDay() + 1) / 7);
    }

    /**
     * Obtiene el nombre del día de la semana en inglés
     * @param {Date} date - Fecha de referencia
     * @returns {string} Nombre del día en inglés
     */
    static getDayOfWeekEnglish(date) {
        if (!(date instanceof Date)) return '';
        
        const days = [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
            'Thursday', 'Friday', 'Saturday'
        ];
        
        return days[date.getDay()];
    }

    /**
     * Obtiene el nombre del mes en inglés
     * @param {Date} date - Fecha de referencia
     * @returns {string} Nombre del mes en inglés
     */
    static getMonthNameEnglish(date) {
        if (!(date instanceof Date)) return '';
        
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        return months[date.getMonth()];
    }

    /**
     * Obtiene el nombre del mes en inglés (corto)
     * @param {Date} date - Fecha de referencia
     * @returns {string} Nombre corto del mes en inglés
     */
    static getShortMonthNameEnglish(date) {
        if (!(date instanceof Date)) return '';
        
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        return months[date.getMonth()];
    }

    /**
     * Formatea una fecha en formato inglés
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada en inglés
     */
    static formatEnglishDate(date) {
        if (!(date instanceof Date)) return '';
        
        return `${this.getDayOfWeekEnglish(date)}, ${this.getMonthNameEnglish(date)} ${date.getDate()}, ${date.getFullYear()}`;
    }

    /**
     * Obtiene la zona horaria del navegador
     * @returns {string} Zona horaria
     */
    static getTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Obtiene el offset de la zona horaria en minutos
     * @returns {number} Offset en minutos
     */
    static getTimezoneOffset() {
        return new Date().getTimezoneOffset();
    }

    /**
     * Convierte una fecha a una zona horaria específica
     * @param {Date} date - Fecha a convertir
     * @param {string} timezone - Zona horaria de destino
     * @returns {Date} Fecha convertida
     */
    static convertToTimezone(date, timezone) {
        if (!(date instanceof Date)) return new Date();
        
        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);
        
        const result = {};
        parts.forEach(part => {
            if (part.type !== 'literal') {
                result[part.type] = parseInt(part.value);
            }
        });
        
        return new Date(
            result.year,
            result.month - 1,
            result.day,
            result.hour,
            result.minute,
            result.second
        );
    }

    /**
     * Obtiene la diferencia horaria entre dos zonas horarias
     * @param {string} timezone1 - Primera zona horaria
     * @param {string} timezone2 - Segunda zona horaria
     * @returns {number} Diferencia en horas
     */
    static getTimezoneDifference(timezone1, timezone2) {
        const date = new Date();
        const date1 = this.convertToTimezone(date, timezone1);
        const date2 = this.convertToTimezone(date, timezone2);
        
        return (date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
    }

    /**
     * Obtiene la fecha actual en UTC
     * @returns {Date} Fecha actual en UTC
     */
    static getCurrentDateUTC() {
        return new Date(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            new Date().getUTCDate(),
            new Date().getUTCHours(),
            new Date().getUTCMinutes(),
            new Date().getUTCSeconds()
        ));
    }

    /**
     * Convierte una fecha local a UTC
     * @param {Date} date - Fecha local
     * @returns {Date} Fecha en UTC
     */
    static localToUTC(date) {
        if (!(date instanceof Date)) return new Date();
        
        return new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ));
    }

    /**
     * Convierte una fecha UTC a local
     * @param {Date} date - Fecha UTC
     * @returns {Date} Fecha local
     */
    static utcToLocal(date) {
        if (!(date instanceof Date)) return new Date();
        
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds()
        );
    }
}
