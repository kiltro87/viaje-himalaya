#!/bin/bash

# Script Simple de Despliegue - PWA Viaje Himalaya
# Solo opciones locales y Netlify
# Autor: David Ferrer Figueroa

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "🚀 PWA Viaje Himalaya - Opciones Simples" "$BLUE"

# Verificar iconos PWA
if [ ! -f "assets/icon-192x192.png" ]; then
    print_message "⚠️  IMPORTANTE: Faltan iconos PWA reales" "$YELLOW"
    echo ""
    echo "📱 Para que Chrome Android muestre la opción de instalación:"
    echo "1. Abre create-real-icons.html en tu navegador"
    echo "2. Haz clic en 'Generar Todos los Iconos'"
    echo "3. Mueve los archivos descargados a la carpeta assets/"
    echo ""
    read -p "¿Has generado los iconos? (s/n): " icons_ready
    
    if [ "$icons_ready" != "s" ] && [ "$icons_ready" != "S" ]; then
        print_message "🎨 Generando iconos placeholder..." "$YELLOW"
        mkdir -p assets
        
        # Crear SVG base simple
        cat > assets/icon-base.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3B82F6" rx="51.2"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
        font-family="Arial" font-size="200" fill="white">🏔️</text>
</svg>
EOF
        
        # Copiar para todos los tamaños
        for size in 72 96 128 144 152 192 384 512 32 16; do
            cp assets/icon-base.svg "assets/icon-${size}x${size}.png"
        done
        cp assets/icon-base.svg assets/badge-72x72.png
        
        print_message "⚠️  Iconos placeholder creados" "$YELLOW"
        print_message "💡 Para Android Chrome, necesitas iconos PNG reales" "$YELLOW"
    fi
fi

# Función para servidor local
start_local() {
    print_message "🖥️  Iniciando servidor local..." "$BLUE"
    
    if command -v python3 &> /dev/null; then
        echo "🌐 Servidor disponible en: http://localhost:8000"
        echo ""
        echo "📱 Para acceso desde móvil:"
        
        # Mostrar IP local si está disponible
        if command -v ifconfig &> /dev/null; then
            LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
            if [ ! -z "$LOCAL_IP" ]; then
                echo "   http://${LOCAL_IP}:8000"
            fi
        fi
        
        echo ""
        echo "💡 Instala como PWA desde el navegador móvil"
        echo "   iOS: Safari → Compartir → Añadir a pantalla de inicio"
        echo "   Android: Chrome → Menú → Instalar app"
        echo ""
        echo "Presiona Ctrl+C para detener"
        python3 server.py
    else
        print_message "❌ Python no encontrado. Instala Python 3." "$RED"
        exit 1
    fi
}

# Función para Netlify Drop
deploy_netlify_drop() {
    print_message "🔗 Despliegue en Netlify Drop..." "$BLUE"
    echo ""
    echo "📋 Pasos para Netlify Drop:"
    echo "1. Ve a: https://app.netlify.com/drop"
    echo "2. Arrastra TODA la carpeta del proyecto"
    echo "3. ¡Listo! Obtienes URL permanente"
    echo ""
    echo "💡 Ventajas:"
    echo "   ✅ Gratis y permanente"
    echo "   ✅ HTTPS automático (necesario para PWA)"
    echo "   ✅ Funciona desde cualquier dispositivo"
    echo "   ✅ No requiere cuenta de GitHub"
    echo ""
    read -p "Presiona Enter para abrir Netlify Drop..." 
    
    # Abrir Netlify Drop en el navegador
    if command -v open &> /dev/null; then
        open "https://app.netlify.com/drop"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://app.netlify.com/drop"
    else
        echo "Abre manualmente: https://app.netlify.com/drop"
    fi
}

# Menú principal
show_menu() {
    echo ""
    print_message "🎯 Elige cómo usar tu PWA:" "$BLUE"
    echo "1) 🖥️  Servidor local (para desarrollo y pruebas)"
    echo "2) 🔗 Netlify Drop (para uso permanente - RECOMENDADO)"
    echo "3) 💡 Ver instrucciones completas"
    echo "0) ❌ Salir"
    echo ""
    read -p "Opción: " choice
}

# Función para mostrar instrucciones
show_instructions() {
    print_message "📖 Instrucciones Completas" "$BLUE"
    echo ""
    echo "🎯 OPCIÓN 1: Uso Local (Desarrollo)"
    echo "   • Perfecto para probar la app"
    echo "   • Acceso desde móvil en la misma WiFi"
    echo "   • Todas las funciones PWA disponibles"
    echo ""
    echo "🎯 OPCIÓN 2: Netlify Drop (Recomendado)"
    echo "   • URL permanente y gratuita"
    echo "   • HTTPS automático (requerido para PWA)"
    echo "   • Acceso desde cualquier dispositivo"
    echo "   • Perfecto para compartir con otros"
    echo ""
    echo "📱 INSTALACIÓN EN MÓVIL:"
    echo "   iOS (Safari):"
    echo "   1. Abre la URL en Safari"
    echo "   2. Toca 'Compartir' (cuadrado con flecha)"
    echo "   3. 'Añadir a pantalla de inicio'"
    echo ""
    echo "   Android (Chrome):"
    echo "   1. Abre la URL en Chrome"
    echo "   2. Aparecerá 'Instalar app' o en menú"
    echo "   3. Confirma instalación"
    echo ""
    echo "✨ FUNCIONES PWA:"
    echo "   ✅ Funciona sin internet (modo offline)"
    echo "   ✅ Notificaciones de vuelos y presupuesto"
    echo "   ✅ Mapas offline de Nepal/Bután"
    echo "   ✅ Geolocalización y llegada a destinos"
    echo "   ✅ Compartir con apps nativas"
    echo "   ✅ Icono en pantalla de inicio"
    echo ""
    read -p "Presiona Enter para volver al menú..."
}

# Procesar argumentos de línea de comandos
case "${1:-menu}" in
    "local"|"1")
        start_local
        ;;
    "netlify"|"2")
        deploy_netlify_drop
        ;;
    "help"|"3")
        show_instructions
        ;;
    "menu"|"")
        show_menu
        case $choice in
            1) start_local ;;
            2) deploy_netlify_drop ;;
            3) show_instructions; show_menu ;;
            0) 
                print_message "👋 ¡Disfruta tu aventura en el Himalaya!" "$BLUE"
                exit 0
                ;;
            *) 
                print_message "❌ Opción inválida" "$RED"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "Uso: $0 [local|netlify|help]"
        exit 1
        ;;
esac

print_message "🎉 ¡Listo para tu aventura! 🏔️" "$GREEN"
