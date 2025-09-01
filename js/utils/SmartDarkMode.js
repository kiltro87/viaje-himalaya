/**
 * SmartDarkMode - Intelligent Dark Mode Management
 * 
 * Automatically switches between light and dark modes based on:
 * - Time of day (sunset/sunrise)
 * - User location (if available)
 * - System preferences
 * - Manual user override
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { DARK_MODE } from '../config/DesignTokens.js';
import Logger from './Logger.js';

export class SmartDarkMode {
    constructor(options = {}) {
        this.options = {
            autoSwitch: true,
            respectSystemPreference: true,
            useLocation: true,
            storageKey: 'viaje-himalaya-dark-mode',
            ...options
        };

        this.currentMode = 'light';
        this.userOverride = null;
        this.location = null;
        this.sunTimes = null;

        this.init();
    }

    async init() {
        // Load saved preferences
        this.loadPreferences();
        
        // Set up system preference listener
        if (this.options.respectSystemPreference) {
            this.setupSystemPreferenceListener();
        }
        
        // Get location for accurate sun times
        if (this.options.useLocation) {
            await this.getLocation();
        }
        
        // Apply initial mode
        await this.updateMode();
        
        // Set up automatic switching
        if (this.options.autoSwitch) {
            this.setupAutoSwitch();
        }
        
        Logger.success('SmartDarkMode initialized', {
            mode: this.currentMode,
            hasLocation: !!this.location,
            autoSwitch: this.options.autoSwitch
        });
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem(this.options.storageKey);
            if (saved) {
                const prefs = JSON.parse(saved);
                this.userOverride = prefs.userOverride;
                this.options.autoSwitch = prefs.autoSwitch !== false;
            }
        } catch (error) {
            Logger.warn('Failed to load dark mode preferences', error);
        }
    }

    savePreferences() {
        try {
            const prefs = {
                userOverride: this.userOverride,
                autoSwitch: this.options.autoSwitch,
                timestamp: Date.now()
            };
            localStorage.setItem(this.options.storageKey, JSON.stringify(prefs));
        } catch (error) {
            Logger.warn('Failed to save dark mode preferences', error);
        }
    }

    setupSystemPreferenceListener() {
        const mediaQuery = window.matchMedia(DARK_MODE.SYSTEM.PREFER_DARK);
        mediaQuery.addEventListener('change', () => {
            if (!this.userOverride) {
                this.updateMode();
            }
        });
    }

    async getLocation() {
        if (!navigator.geolocation) {
            if (Logger && Logger.info) Logger.info('Geolocation not available for dark mode');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });

            this.location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            await this.calculateSunTimes();
            Logger.success('Location obtained for smart dark mode', this.location);
        } catch (error) {
            if (Logger && Logger.info) Logger.info('Could not get location for dark mode, using default times', error);
        }
    }

    async calculateSunTimes() {
        if (!this.location) return;

        try {
            // Simple sunrise/sunset calculation
            // For production, you might want to use a more accurate library
            const now = new Date();
            const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
            
            // Approximate calculation (good enough for UI purposes)
            const lat = this.location.lat * Math.PI / 180;
            const declination = -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365) * Math.PI / 180;
            const hourAngle = Math.acos(-Math.tan(lat) * Math.tan(declination));
            
            const sunrise = 12 - hourAngle * 12 / Math.PI;
            const sunset = 12 + hourAngle * 12 / Math.PI;

            this.sunTimes = {
                sunrise: Math.max(6, Math.min(8, sunrise)), // Clamp between 6-8 AM
                sunset: Math.max(17, Math.min(20, sunset))   // Clamp between 5-8 PM
            };

            if (Logger && Logger.info) Logger.info('Sun times calculated', this.sunTimes);
        } catch (error) {
            Logger.warn('Failed to calculate sun times', error);
            this.sunTimes = {
                sunrise: DARK_MODE.TIME_BASED.SUNRISE_HOUR,
                sunset: DARK_MODE.TIME_BASED.SUNSET_HOUR
            };
        }
    }

    shouldUseDarkMode() {
        // User override takes precedence
        if (this.userOverride !== null) {
            return this.userOverride === 'dark';
        }

        // Check time-based switching
        if (this.options.autoSwitch) {
            const now = new Date();
            const currentHour = now.getHours() + now.getMinutes() / 60;
            
            const sunTimes = this.sunTimes || {
                sunrise: DARK_MODE.TIME_BASED.SUNRISE_HOUR,
                sunset: DARK_MODE.TIME_BASED.SUNSET_HOUR
            };

            // Use dark mode between sunset and sunrise
            if (currentHour >= sunTimes.sunset || currentHour < sunTimes.sunrise) {
                return true;
            }
        }

        // Fall back to system preference
        if (this.options.respectSystemPreference) {
            return window.matchMedia(DARK_MODE.SYSTEM.PREFER_DARK).matches;
        }

        return false;
    }

    async updateMode() {
        const shouldBeDark = this.shouldUseDarkMode();
        const newMode = shouldBeDark ? 'dark' : 'light';
        
        if (newMode !== this.currentMode) {
            this.currentMode = newMode;
            this.applyMode();
            
            if (Logger && Logger.info) Logger.info(`Dark mode switched to: ${newMode}`, {
                reason: this.userOverride ? 'user-override' : 'automatic',
                time: new Date().toLocaleTimeString()
            });
        }
    }

    applyMode() {
        const html = document.documentElement;
        
        // Add transition classes for smooth switching
        html.classList.add('transition-colors', 'duration-300', 'ease-out');
        
        if (this.currentMode === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        // Update meta theme-color for mobile browsers
        this.updateThemeColor();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('darkModeChange', {
            detail: { mode: this.currentMode }
        }));
    }

    updateThemeColor() {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        
        // Update theme color based on mode
        themeColorMeta.content = this.currentMode === 'dark' ? '#1e293b' : '#3B82F6';
    }

    setupAutoSwitch() {
        // Check every minute for time-based switching
        setInterval(() => {
            if (!this.userOverride) {
                this.updateMode();
            }
        }, 60000);

        // Also check when page becomes visible (user returns to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.userOverride) {
                this.updateMode();
            }
        });
    }

    // Public methods
    toggle() {
        const newMode = this.currentMode === 'dark' ? 'light' : 'dark';
        this.setMode(newMode, true);
    }

    setMode(mode, isUserOverride = false) {
        if (isUserOverride) {
            this.userOverride = mode;
            this.savePreferences();
        }
        
        this.currentMode = mode;
        this.applyMode();
        
        if (Logger && Logger.info) Logger.info(`Dark mode set to: ${mode}`, {
            userOverride: isUserOverride
        });
    }

    enableAutoSwitch() {
        this.options.autoSwitch = true;
        this.userOverride = null;
        this.savePreferences();
        this.setupAutoSwitch();
        this.updateMode();
        
        if (Logger && Logger.info) Logger.info('Auto dark mode switching enabled');
    }

    disableAutoSwitch() {
        this.options.autoSwitch = false;
        this.savePreferences();
        
        if (Logger && Logger.info) Logger.info('Auto dark mode switching disabled');
    }

    getCurrentMode() {
        return this.currentMode;
    }

    isAutoSwitchEnabled() {
        return this.options.autoSwitch && !this.userOverride;
    }

    getSunTimes() {
        return this.sunTimes;
    }
}

export default SmartDarkMode;
