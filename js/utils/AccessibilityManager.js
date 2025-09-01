/**
 * AccessibilityManager - WCAG 2.1 AA Compliance Features
 * 
 * Provides comprehensive accessibility features including keyboard navigation,
 * screen reader support, high contrast mode, and focus management.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { TRANSITION } from '../config/DesignTokens.js';

export class AccessibilityManager {
    constructor() {
        this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.currentFocusIndex = 0;
        this.focusableElementsList = [];
        this.isHighContrast = false;
        this.announcements = [];
        
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupFocusManagement();
        this.setupHighContrastMode();
        this.addSkipLinks();
        this.enhanceFormAccessibility();
        
        Logger.success('AccessibilityManager initialized');
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
                case 'Escape':
                    this.handleEscape(e);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowNavigation(e);
                    break;
                case 'Home':
                case 'End':
                    this.handleHomeEnd(e);
                    break;
            }
        });

        // Update focusable elements list when DOM changes
        this.updateFocusableElements();
        
        // Observer for dynamic content
        const observer = new MutationObserver(() => {
            this.updateFocusableElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    updateFocusableElements() {
        this.focusableElementsList = Array.from(
            document.querySelectorAll(this.focusableElements)
        ).filter(el => !el.disabled && el.offsetParent !== null);
    }

    handleTabNavigation(e) {
        // Custom tab handling for specific components
        const activeElement = document.activeElement;
        
        // Handle navigation within nav buttons
        if (activeElement && activeElement.classList.contains('nav-btn')) {
            const navButtons = document.querySelectorAll('.nav-btn');
            const currentIndex = Array.from(navButtons).indexOf(activeElement);
            
            if (e.shiftKey) {
                // Shift+Tab - go to previous
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : navButtons.length - 1;
                navButtons[prevIndex].focus();
            } else {
                // Tab - go to next
                const nextIndex = currentIndex < navButtons.length - 1 ? currentIndex + 1 : 0;
                navButtons[nextIndex].focus();
            }
            
            e.preventDefault();
        }
    }

    handleActivation(e) {
        const target = e.target;
        
        // Handle space/enter on custom interactive elements
        if (target.getAttribute('role') === 'button' || target.classList.contains('nav-btn')) {
            target.click();
            e.preventDefault();
        }
    }

    handleEscape(e) {
        // Close modals, dropdowns, etc.
        const activeModal = document.querySelector('.modal:not(.hidden)');
        const activeDropdown = document.querySelector('.dropdown-open');
        
        if (activeModal) {
            this.closeModal(activeModal);
        } else if (activeDropdown) {
            this.closeDropdown(activeDropdown);
        }
    }

    handleArrowNavigation(e) {
        const target = e.target;
        
        // Handle arrow navigation in nav buttons
        if (target.classList.contains('nav-btn')) {
            const navButtons = document.querySelectorAll('.nav-btn');
            const currentIndex = Array.from(navButtons).indexOf(target);
            let nextIndex;
            
            switch (e.key) {
                case 'ArrowLeft':
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : navButtons.length - 1;
                    break;
                case 'ArrowRight':
                    nextIndex = currentIndex < navButtons.length - 1 ? currentIndex + 1 : 0;
                    break;
                default:
                    return;
            }
            
            navButtons[nextIndex].focus();
            e.preventDefault();
        }
    }

    handleHomeEnd(e) {
        if (e.target.classList.contains('nav-btn')) {
            const navButtons = document.querySelectorAll('.nav-btn');
            
            if (e.key === 'Home') {
                navButtons[0].focus();
            } else if (e.key === 'End') {
                navButtons[navButtons.length - 1].focus();
            }
            
            e.preventDefault();
        }
    }

    setupScreenReaderSupport() {
        // Create live region for announcements
        this.createLiveRegion();
        
        // Add ARIA labels to navigation
        this.enhanceNavigation();
        
        // Add ARIA landmarks
        this.addLandmarks();
        
        // Enhance dynamic content
        this.enhanceDynamicContent();
    }

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;
    }

    announce(message, priority = 'polite') {
        if (!this.liveRegion) return;
        
        this.liveRegion.setAttribute('aria-live', priority);
        this.liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            this.liveRegion.textContent = '';
        }, 1000);
        
        if (Logger && Logger.info) Logger.info('Screen reader announcement', { message, priority });
    }

    enhanceNavigation() {
        const nav = document.querySelector('#bottom-nav');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Navegación principal');
        }

        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach((button, index) => {
            const view = button.dataset.view;
            const text = button.querySelector('span:last-child')?.textContent || view;
            
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', `Ir a ${text}`);
            button.setAttribute('tabindex', index === 0 ? '0' : '-1');
            
            // Add state information
            if (button.classList.contains('active')) {
                button.setAttribute('aria-current', 'page');
            }
        });
    }

    addLandmarks() {
        const main = document.querySelector('#main-content');
        if (main) {
            main.setAttribute('role', 'main');
            main.setAttribute('aria-label', 'Main content');
        }

        // Add region roles to major sections
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const heading = section.querySelector('h1, h2, h3');
            if (heading) {
                section.setAttribute('role', 'region');
                section.setAttribute('aria-labelledby', heading.id || this.generateId(heading));
            }
        });
    }

    enhanceDynamicContent() {
        // Monitor for content changes and announce them
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const newContent = Array.from(mutation.addedNodes)
                        .filter(node => node.nodeType === Node.ELEMENT_NODE)
                        .find(node => node.querySelector('h1, h2, h3'));
                    
                    if (newContent) {
                        const heading = newContent.querySelector('h1, h2, h3');
                        if (heading) {
                            setTimeout(() => {
                                this.announce(`Contenido actualizado: ${heading.textContent}`);
                            }, 500);
                        }
                    }
                }
            });
        });

        observer.observe(document.querySelector('#main-content') || document.body, {
            childList: true,
            subtree: true
        });
    }

    setupFocusManagement() {
        // Focus management for view changes
        document.addEventListener('viewchange', (e) => {
            const newView = e.detail?.view;
            if (newView) {
                this.focusNewView(newView);
            }
        });

        // Visible focus indicators
        this.addFocusStyles();
        
        // Focus trap for modals
        this.setupFocusTraps();
    }

    focusNewView(viewName) {
        setTimeout(() => {
            const mainContent = document.querySelector('#main-content');
            const firstHeading = mainContent?.querySelector('h1, h2, h3');
            const firstFocusable = mainContent?.querySelector(this.focusableElements);
            
            if (firstHeading) {
                firstHeading.setAttribute('tabindex', '-1');
                firstHeading.focus();
                this.announce(`Vista cambiada a ${viewName}`);
            } else if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
    }

    addFocusStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible {
                outline: 2px solid var(--primary-color, #3b82f6) !important;
                outline-offset: 2px !important;
                border-radius: 4px !important;
            }
            
            .nav-btn:focus-visible {
                outline: 2px solid var(--primary-color, #3b82f6) !important;
                outline-offset: -2px !important;
                background-color: var(--primary-color, #3b82f6) !important;
                color: white !important;
            }
            
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupFocusTraps() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal:not(.hidden)');
                if (modal) {
                    this.trapFocus(e, modal);
                }
            }
        });
    }

    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(this.focusableElements);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    setupHighContrastMode() {
        // Detect system high contrast preference
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        
        if (highContrastQuery.matches) {
            this.enableHighContrast();
        }
        
        highContrastQuery.addEventListener('change', (e) => {
            if (e.matches) {
                this.enableHighContrast();
            } else {
                this.disableHighContrast();
            }
        });
    }

    enableHighContrast() {
        document.body.classList.add('high-contrast');
        this.isHighContrast = true;
        this.announce('Modo de alto contraste activado');
        if (Logger && Logger.info) Logger.info('High contrast mode enabled');
    }

    disableHighContrast() {
        document.body.classList.remove('high-contrast');
        this.isHighContrast = false;
        if (Logger && Logger.info) Logger.info('High contrast mode disabled');
    }

    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#bottom-nav" class="skip-link">Saltar a la navegación</a>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .skip-links {
                position: absolute;
                top: -40px;
                left: 6px;
                z-index: 1000;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--primary-color, #3b82f6);
                color: white;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                transition: top 0.3s;
            }
            
            .skip-link:focus {
                top: 6px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    enhanceFormAccessibility() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Ensure labels are properly associated
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (!label && !input.getAttribute('aria-label')) {
                    const placeholder = input.getAttribute('placeholder');
                    if (placeholder) {
                        input.setAttribute('aria-label', placeholder);
                    }
                }
                
                // Add required field indicators
                if (input.required) {
                    input.setAttribute('aria-required', 'true');
                }
                
                // Add error handling
                input.addEventListener('invalid', (e) => {
                    const message = e.target.validationMessage;
                    this.announce(`Error en el campo: ${message}`, 'assertive');
                });
            });
        });
    }

    generateId(element) {
        const id = `heading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        element.id = id;
        return id;
    }

    // Public methods
    toggleHighContrast() {
        if (this.isHighContrast) {
            this.disableHighContrast();
        } else {
            this.enableHighContrast();
        }
    }

    announceToScreenReader(message, priority = 'polite') {
        this.announce(message, priority);
    }

    focusElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            return true;
        }
        return false;
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        
        // Return focus to trigger element
        const trigger = document.querySelector(`[aria-controls="${modal.id}"]`);
        if (trigger) {
            trigger.focus();
        }
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('dropdown-open');
        dropdown.setAttribute('aria-expanded', 'false');
    }
}

export default AccessibilityManager;
