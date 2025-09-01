/**
 * PullToRefresh - Native Mobile Pull-to-Refresh Implementation
 * 
 * Provides native-feeling pull-to-refresh functionality for mobile devices.
 * Uses touch events and smooth animations to create an intuitive refresh experience.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { TRANSITION } from '../config/DesignTokens.js';
import Logger from './Logger.js';

export class PullToRefresh {
    constructor(options = {}) {
        this.options = {
            threshold: 80,              // Distance to trigger refresh
            maxPull: 120,              // Maximum pull distance
            refreshCallback: null,      // Function to call on refresh
            container: document.body,   // Container element
            ...options
        };

        this.isEnabled = true;
        this.isPulling = false;
        this.isRefreshing = false;
        this.startY = 0;
        this.currentY = 0;
        this.pullDistance = 0;

        this.init();
    }

    init() {
        this.createRefreshIndicator();
        this.bindEvents();
        Logger.success('PullToRefresh initialized', { threshold: this.options.threshold });
    }

    createRefreshIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = `
            fixed top-0 left-1/2 -translate-x-1/2 z-50
            bg-white dark:bg-slate-800 rounded-b-2xl shadow-lg
            px-6 py-4 flex items-center gap-3
            transform -translate-y-full opacity-0
            ${TRANSITION.PULL_TO_REFRESH}
        `;
        
        this.indicator.innerHTML = `
            <div class="refresh-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin hidden"></div>
            <span class="material-symbols-outlined text-blue-500 refresh-icon">refresh</span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300 refresh-text">
                Desliza para actualizar
            </span>
        `;

        document.body.appendChild(this.indicator);
        
        this.spinner = this.indicator.querySelector('.refresh-spinner');
        this.icon = this.indicator.querySelector('.refresh-icon');
        this.text = this.indicator.querySelector('.refresh-text');
    }

    bindEvents() {
        // Only bind on touch devices
        if ('ontouchstart' in window) {
            this.options.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.options.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.options.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        }

        // Also support mouse for testing on desktop
        this.options.container.addEventListener('mousedown', this.handleMouseStart.bind(this));
        this.options.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.options.container.addEventListener('mouseup', this.handleMouseEnd.bind(this));
    }

    handleTouchStart(e) {
        if (!this.isEnabled || this.isRefreshing) return;
        
        // Only trigger if at top of page
        if (window.scrollY > 0) return;
        
        this.startY = e.touches[0].clientY;
        this.isPulling = false;
    }

    handleTouchMove(e) {
        if (!this.isEnabled || this.isRefreshing || window.scrollY > 0) return;
        
        this.currentY = e.touches[0].clientY;
        this.pullDistance = Math.max(0, this.currentY - this.startY);
        
        if (this.pullDistance > 10) {
            this.isPulling = true;
            e.preventDefault(); // Prevent default scroll behavior
            this.updateIndicator();
        }
    }

    handleTouchEnd(e) {
        if (!this.isPulling || this.isRefreshing) return;
        
        if (this.pullDistance >= this.options.threshold) {
            this.triggerRefresh();
        } else {
            this.resetIndicator();
        }
        
        this.isPulling = false;
        this.pullDistance = 0;
    }

    // Mouse events for desktop testing
    handleMouseStart(e) {
        if (!this.isEnabled || this.isRefreshing || window.scrollY > 0) return;
        this.startY = e.clientY;
        this.isPulling = false;
    }

    handleMouseMove(e) {
        if (!this.isEnabled || this.isRefreshing || window.scrollY > 0) return;
        if (!e.buttons) return; // Only if mouse is pressed
        
        this.currentY = e.clientY;
        this.pullDistance = Math.max(0, this.currentY - this.startY);
        
        if (this.pullDistance > 10) {
            this.isPulling = true;
            this.updateIndicator();
        }
    }

    handleMouseEnd(e) {
        if (!this.isPulling || this.isRefreshing) return;
        
        if (this.pullDistance >= this.options.threshold) {
            this.triggerRefresh();
        } else {
            this.resetIndicator();
        }
        
        this.isPulling = false;
        this.pullDistance = 0;
    }

    updateIndicator() {
        const progress = Math.min(this.pullDistance / this.options.threshold, 1);
        const maxDistance = Math.min(this.pullDistance, this.options.maxPull);
        
        // Update position and opacity
        this.indicator.style.transform = `translateX(-50%) translateY(${maxDistance - 100}px)`;
        this.indicator.style.opacity = progress;
        
        // Update text and icon based on progress
        if (progress >= 1) {
            this.text.textContent = '¡Suelta para actualizar!';
            this.icon.style.transform = 'rotate(180deg)';
        } else {
            this.text.textContent = 'Desliza para actualizar';
            this.icon.style.transform = `rotate(${progress * 180}deg)`;
        }
    }

    async triggerRefresh() {
        if (this.isRefreshing) return;
        
        this.isRefreshing = true;
        Logger.info('Pull-to-refresh triggered');
        
        // Show loading state
        this.indicator.style.transform = 'translateX(-50%) translateY(0px)';
        this.indicator.style.opacity = '1';
        this.spinner.classList.remove('hidden');
        this.icon.classList.add('hidden');
        this.text.textContent = 'Actualizando...';
        
        try {
            // Call the refresh callback if provided
            if (this.options.refreshCallback && typeof this.options.refreshCallback === 'function') {
                await this.options.refreshCallback();
            }
            
            // Add haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            Logger.success('Pull-to-refresh completed');
        } catch (error) {
            Logger.error('Pull-to-refresh failed', error);
        }
        
        // Reset after a short delay
        setTimeout(() => {
            this.resetIndicator();
            this.isRefreshing = false;
        }, 1000);
    }

    resetIndicator() {
        this.indicator.style.transform = 'translateX(-50%) translateY(-100px)';
        this.indicator.style.opacity = '0';
        this.spinner.classList.add('hidden');
        this.icon.classList.remove('hidden');
        this.icon.style.transform = 'rotate(0deg)';
        this.text.textContent = 'Desliza para actualizar';
    }

    // Public methods
    enable() {
        this.isEnabled = true;
        Logger.info('PullToRefresh enabled');
    }

    disable() {
        this.isEnabled = false;
        this.resetIndicator();
        Logger.info('PullToRefresh disabled');
    }

    setRefreshCallback(callback) {
        this.options.refreshCallback = callback;
    }

    destroy() {
        if (this.indicator && this.indicator.parentNode) {
            this.indicator.parentNode.removeChild(this.indicator);
        }
        
        // Remove event listeners
        this.options.container.removeEventListener('touchstart', this.handleTouchStart);
        this.options.container.removeEventListener('touchmove', this.handleTouchMove);
        this.options.container.removeEventListener('touchend', this.handleTouchEnd);
        this.options.container.removeEventListener('mousedown', this.handleMouseStart);
        this.options.container.removeEventListener('mousemove', this.handleMouseMove);
        this.options.container.removeEventListener('mouseup', this.handleMouseEnd);
        
        Logger.info('PullToRefresh destroyed');
    }
}

export default PullToRefresh;
