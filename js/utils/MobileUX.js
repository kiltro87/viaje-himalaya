/**
 * MobileUX - Enhanced Mobile User Experience
 * 
 * Provides native mobile interactions including haptic feedback,
 * improved touch handling, and mobile-specific optimizations.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { TRANSITION } from '../config/DesignTokens.js';

export class MobileUX {
    constructor() {
        this.isTouch = 'ontouchstart' in window;
        this.hasHaptics = 'vibrate' in navigator;
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.longPressThreshold = 500; // ms
        
        this.init();
    }

    init() {
        this.setupTouchEnhancements();
        this.setupHapticFeedback();
        this.setupGestureHandling();
        this.optimizeForMobile();
        
        Logger.success('MobileUX initialized', {
            hasTouch: this.isTouch,
            hasHaptics: this.hasHaptics
        });
    }

    setupTouchEnhancements() {
        // Prevent double-tap zoom on buttons
        document.addEventListener('touchend', (e) => {
            if (e.target.matches('button, .nav-btn, [role="button"]')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Enhanced button feedback
        this.enhanceButtons();
        
        // Smooth scrolling for mobile
        document.documentElement.style.scrollBehavior = 'smooth';
        document.documentElement.style.webkitOverflowScrolling = 'touch';
    }

    enhanceButtons() {
        const buttons = document.querySelectorAll('button, .nav-btn, [role="button"]');
        
        buttons.forEach(button => {
            // Add touch feedback classes
            button.classList.add('touch-feedback');
            
            // Touch start
            button.addEventListener('touchstart', (e) => {
                this.touchStartTime = Date.now();
                button.classList.add('touch-active');
                this.hapticFeedback('light');
                
                // Setup long press detection
                this.longPressTimer = setTimeout(() => {
                    this.handleLongPress(button, e);
                }, this.longPressThreshold);
            }, { passive: true });

            // Touch end
            button.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - this.touchStartTime;
                button.classList.remove('touch-active');
                
                // Clear long press timer
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                
                // Quick tap feedback
                if (touchDuration < 150) {
                    this.hapticFeedback('medium');
                }
            }, { passive: true });

            // Touch cancel
            button.addEventListener('touchcancel', () => {
                button.classList.remove('touch-active');
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }, { passive: true });
        });
    }

    handleLongPress(element, event) {
        this.hapticFeedback('heavy');
        
        // Dispatch custom long press event
        const longPressEvent = new CustomEvent('longpress', {
            detail: { originalEvent: event, element }
        });
        element.dispatchEvent(longPressEvent);
        
        Logger.info('Long press detected', { element: element.tagName });
    }

    setupHapticFeedback() {
        if (!this.hasHaptics) {
            Logger.info('Haptic feedback not available');
            return;
        }

        // Add haptic feedback to navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hapticFeedback('medium');
            });
        });

        // Add haptic feedback to important actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-haptic]')) {
                const intensity = e.target.dataset.haptic || 'light';
                this.hapticFeedback(intensity);
            }
        });
    }

    hapticFeedback(intensity = 'light') {
        if (!this.hasHaptics) return;

        const patterns = {
            light: 10,
            medium: [10, 50, 10],
            heavy: [50, 100, 50],
            success: [10, 30, 10, 30, 10],
            error: [100, 50, 100, 50, 100],
            notification: [50, 50, 50]
        };

        const pattern = patterns[intensity] || patterns.light;
        navigator.vibrate(pattern);
    }

    setupGestureHandling() {
        let startX, startY, currentX, currentY;
        let isSwipeGesture = false;
        const swipeThreshold = 50;
        const swipeVelocityThreshold = 0.5;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipeGesture = false;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && startX !== undefined) {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                // Detect horizontal swipe
                if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                    isSwipeGesture = true;
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (isSwipeGesture && startX !== undefined && currentX !== undefined) {
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const time = Date.now() - this.touchStartTime;
                const velocity = distance / time;

                if (velocity > swipeVelocityThreshold) {
                    this.handleSwipeGesture(deltaX, deltaY);
                }
            }
            
            // Reset values
            startX = startY = currentX = currentY = undefined;
            isSwipeGesture = false;
        }, { passive: true });
    }

    handleSwipeGesture(deltaX, deltaY) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY) 
            ? (deltaX > 0 ? 'right' : 'left')
            : (deltaY > 0 ? 'down' : 'up');

        // Dispatch custom swipe event
        const swipeEvent = new CustomEvent('swipe', {
            detail: { direction, deltaX, deltaY }
        });
        document.dispatchEvent(swipeEvent);

        this.hapticFeedback('light');
        Logger.info('Swipe gesture detected', { direction });
    }

    optimizeForMobile() {
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Temporarily disable zoom
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    const content = viewport.getAttribute('content');
                    viewport.setAttribute('content', content + ', user-scalable=no');
                    
                    // Re-enable zoom after blur
                    input.addEventListener('blur', () => {
                        viewport.setAttribute('content', content);
                    }, { once: true });
                }
            });
        });

        // Optimize scroll performance
        document.addEventListener('touchstart', () => {
            document.body.style.webkitUserSelect = 'none';
        }, { passive: true });

        document.addEventListener('touchend', () => {
            document.body.style.webkitUserSelect = '';
        }, { passive: true });

        // Add mobile-specific CSS classes
        if (this.isTouch) {
            document.body.classList.add('touch-device');
        }

        // Detect if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('pwa-mode');
            Logger.info('Running in PWA mode');
        }
    }

    // Public methods
    addHapticToElement(element, intensity = 'light') {
        element.setAttribute('data-haptic', intensity);
    }

    triggerHaptic(intensity = 'light') {
        this.hapticFeedback(intensity);
    }

    isRunningAsPWA() {
        return window.matchMedia('(display-mode: standalone)').matches;
    }

    isTouchDevice() {
        return this.isTouch;
    }

    hasHapticSupport() {
        return this.hasHaptics;
    }
}

export default MobileUX;
