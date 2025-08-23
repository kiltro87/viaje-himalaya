/**
 * DOMUtils - Utilidades para Manipulación del DOM
 * 
 * Conjunto de utilidades para facilitar la manipulación del DOM,
 * selección de elementos, gestión de clases y eventos.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class DOMUtils {
    /**
     * Seleccionar elemento por ID con logging
     * @param {string} id - ID del elemento
     * @returns {HTMLElement|null} Elemento encontrado o null
     */
    static getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            Logger.warning(`Element not found: #${id}`);
        }
        return element;
    }

    /**
     * Seleccionar elementos por selector con logging
     * @param {string} selector - Selector CSS
     * @returns {NodeList} Lista de elementos encontrados
     */
    static querySelectorAll(selector) {
        const elements = document.querySelectorAll(selector);
        Logger.debug(`Found ${elements.length} elements for selector: ${selector}`);
        return elements;
    }

    /**
     * Crear elemento HTML con atributos y clases
     * @param {string} tag - Tag del elemento
     * @param {Object} options - Opciones (classes, attributes, innerHTML)
     * @returns {HTMLElement} Elemento creado
     */
    static createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.classes) {
            element.className = Array.isArray(options.classes) 
                ? options.classes.join(' ') 
                : options.classes;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        return element;
    }

    /**
     * Alternar clases CSS en elementos
     * @param {HTMLElement|NodeList} elements - Elemento(s) a modificar
     * @param {string|Array} classesToRemove - Clases a remover
     * @param {string|Array} classesToAdd - Clases a añadir
     */
    static toggleClasses(elements, classesToRemove = [], classesToAdd = []) {
        const elementList = elements.length !== undefined ? elements : [elements];
        const removeList = Array.isArray(classesToRemove) ? classesToRemove : [classesToRemove];
        const addList = Array.isArray(classesToAdd) ? classesToAdd : [classesToAdd];
        
        elementList.forEach(element => {
            if (element && element.classList) {
                removeList.forEach(cls => cls && element.classList.remove(cls));
                addList.forEach(cls => cls && element.classList.add(cls));
            }
        });
    }

    /**
     * Configurar event listener con logging
     * @param {HTMLElement} element - Elemento
     * @param {string} event - Tipo de evento
     * @param {Function} handler - Manejador del evento
     * @param {Object} options - Opciones del evento
     */
    static addEventListener(element, event, handler, options = {}) {
        if (!element) {
            Logger.warning(`Cannot add event listener: element is null`);
            return;
        }
        
        element.addEventListener(event, handler, options);
        Logger.debug(`Event listener added: ${event} on ${element.tagName}${element.id ? '#' + element.id : ''}`);
    }

    /**
     * Hacer scroll suave a un elemento
     * @param {HTMLElement} element - Elemento destino
     * @param {Object} options - Opciones de scroll
     */
    static scrollToElement(element, options = {}) {
        if (!element) {
            Logger.warning(`Cannot scroll: element is null`);
            return;
        }
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
        Logger.debug(`Scrolled to element: ${element.tagName}${element.id ? '#' + element.id : ''}`);
    }

    /**
     * Verificar si un elemento está visible en el viewport
     * @param {HTMLElement} element - Elemento a verificar
     * @returns {boolean} True si está visible
     */
    static isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Obtener datos de un elemento (data attributes)
     * @param {HTMLElement} element - Elemento
     * @param {string} key - Clave del data attribute (sin 'data-')
     * @returns {string|null} Valor del atributo
     */
    static getData(element, key) {
        if (!element) return null;
        return element.dataset[key] || null;
    }

    /**
     * Establecer datos en un elemento (data attributes)
     * @param {HTMLElement} element - Elemento
     * @param {string} key - Clave del data attribute
     * @param {string} value - Valor a establecer
     */
    static setData(element, key, value) {
        if (!element) return;
        element.dataset[key] = value;
    }

    /**
     * Limpiar contenido de un elemento de forma segura
     * @param {HTMLElement} element - Elemento a limpiar
     */
    static clearContent(element) {
        if (!element) return;
        
        // Remover event listeners para evitar memory leaks
        const clone = element.cloneNode(false);
        element.parentNode.replaceChild(clone, element);
        
        Logger.debug(`Content cleared for element: ${element.tagName}${element.id ? '#' + element.id : ''}`);
        return clone;
    }
}
