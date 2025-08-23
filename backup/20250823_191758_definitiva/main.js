/**
 * Main.js - Punto de Entrada Principal de la Aplicación
 * 
 * Este archivo es el punto de entrada principal que coordina la inicialización
 * completa de la aplicación de viaje. Gestiona la creación del UIRenderer,
 * la configuración del sistema de navegación y la exposición de funciones globales.
 * 
 * Funcionalidades principales:
 * - Inicialización del UIRenderer principal
 * - Configuración del sistema de navegación responsive
 * - Gestión de eventos de navegación entre vistas
 * - Exposición de funciones globales para acceso externo
 * - Integración completa con sistema de logging y métricas
 * 
 * Flujo de inicialización:
 * 1. Creación del UIRenderer
 * 2. Renderizado del contenido inicial (vista resumen)
 * 3. Configuración de event listeners de navegación
 * 4. Exposición de funciones globales
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import { UIRenderer } from './components/UIRenderer.js';
import Logger from './utils/Logger.js';

// Verificar que Logger está disponible y iniciar logging
if (Logger && typeof Logger.init === 'function') {
    Logger.init('Application startup initiated');
    Logger.startPerformance('app-initialization');
} else {
    console.log('🚀 Application startup initiated (Logger not available)');
}

/* ========================================
 * INICIALIZACIÓN DE COMPONENTES PRINCIPALES
 * ======================================== */

// Crear instancia del renderizador principal
if (Logger && Logger.init) Logger.init('Creating UIRenderer instance');
const uiRenderer = new UIRenderer();
if (Logger && Logger.success) Logger.success('UIRenderer created successfully');

/* ========================================
 * FUNCIONES PÚBLICAS DE LA APLICACIÓN
 * ======================================== */

/**
 * Cambiar vista actual de la aplicación
 * 
 * Función pública para cambiar entre las diferentes vistas disponibles.
 * Incluye logging automático de la navegación para trazabilidad.
 * 
 * @param {string} view - Vista de destino ('resumen', 'itinerario', 'hoy', 'mapa', 'gastos', 'extras')
 * @public
 */
function changeView(view) {
    if (Logger && Logger.event) Logger.event(`View change requested: ${view}`);
    uiRenderer.changeView(view);
}

/**
 * Renderizar contenido inicial
 * 
 * Función para disparar el renderizado inicial de la aplicación.
 * Utilizada durante la inicialización y para refrescos manuales.
 * 
 * @public
 */
function renderInitial() {
    if (Logger && Logger.ui) Logger.ui('Rendering initial content');
    uiRenderer.renderMainContent();
}

/**
 * Configurar sistema de navegación
 * 
 * Inicializa el sistema de navegación de la aplicación configurando
 * event listeners para todos los botones de navegación. Incluye
 * gestión de estados activos y logging de interacciones.
 * 
 * @private
 */
function setupNavigation() {
    if (Logger && Logger.init) Logger.init('Setting up navigation system');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    if (Logger && Logger.init) Logger.init(`Found ${navButtons.length} navigation elements`);
    
    navButtons.forEach((button, index) => {
        const view = button.dataset.view;
        if (Logger && Logger.init) Logger.init(`Setting up navigation ${index + 1}: ${view}`);
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (Logger && Logger.event) {
                Logger.event(`Navigation clicked: ${view}`, { 
                    buttonIndex: index,
                    breakpoint: window.innerWidth >= 768 ? 'desktop' : 'mobile'
                });
            }
            
            // Remover clase activa de todos
            navButtons.forEach(nav => nav.classList.remove('active'));
            
            // Agregar clase activa al seleccionado
            button.classList.add('active');
            
            // Cambiar vista
            changeView(view);
        });
    });
    
    if (Logger && Logger.success) Logger.success('Navigation system configured successfully');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (Logger && Logger.init) Logger.init('DOM loaded, starting initialization');
    
    try {
        // Renderizar contenido inicial
        renderInitial();
        
        // Configurar navegación
        setupNavigation();
        
        if (Logger && Logger.endPerformance) Logger.endPerformance('app-initialization');
        if (Logger && Logger.success) {
            const summary = Logger.getPerformanceSummary ? Logger.getPerformanceSummary() : {};
            Logger.success('Application initialized successfully', summary);
        }
        
    } catch (error) {
        if (Logger && Logger.error) {
            Logger.error('Application initialization failed', error);
        } else {
            console.error('❌ Application initialization failed:', error);
        }
    }
});

// Hacer funciones disponibles globalmente
window.changeView = changeView;
window.renderInitial = renderInitial;
window.uiRenderer = uiRenderer;

if (Logger && Logger.init) Logger.init('Global functions exposed to window object');
