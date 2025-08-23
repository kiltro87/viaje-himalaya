#!/bin/bash

# Git Workflow Helper - PWA Viaje Himalaya
# Autor: David Ferrer Figueroa
# Facilita el trabajo con ramas y despliegues

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

# Función para mostrar estado actual
show_status() {
    print_message "📊 Estado Actual del Repositorio" "$BLUE"
    echo ""
    echo "🌿 Rama actual: $(git branch --show-current)"
    echo "📍 Último commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo "🔄 Estado:"
    git status --short
    echo ""
}

# Función para crear nueva feature
new_feature() {
    local feature_name=$1
    if [ -z "$feature_name" ]; then
        read -p "📝 Nombre de la nueva feature: " feature_name
    fi
    
    print_message "🚀 Creando feature: $feature_name" "$BLUE"
    
    # Asegurar que estamos en develop
    git checkout develop
    git pull origin develop
    
    # Crear nueva rama
    git checkout -b "feature/$feature_name"
    
    print_message "✅ Feature '$feature_name' creada y lista para desarrollo" "$GREEN"
    print_message "💡 Cuando termines, usa: ./git-workflow.sh finish $feature_name" "$YELLOW"
}

# Función para finalizar feature
finish_feature() {
    local feature_name=$1
    local current_branch=$(git branch --show-current)
    
    if [ -z "$feature_name" ]; then
        if [[ $current_branch == feature/* ]]; then
            feature_name=${current_branch#feature/}
        else
            read -p "📝 Nombre de la feature a finalizar: " feature_name
        fi
    fi
    
    print_message "🔄 Finalizando feature: $feature_name" "$BLUE"
    
    # Cambiar a la rama feature si no estamos en ella
    if [[ $current_branch != "feature/$feature_name" ]]; then
        git checkout "feature/$feature_name"
    fi
    
    # Verificar que hay cambios para commitear
    if ! git diff --cached --quiet; then
        read -p "💬 Mensaje del commit: " commit_message
        git commit -m "$commit_message"
    fi
    
    # Subir feature al remoto
    git push -u origin "feature/$feature_name"
    
    # Cambiar a develop y mergear
    git checkout develop
    git pull origin develop
    git merge "feature/$feature_name" --no-ff -m "Merge feature/$feature_name into develop"
    git push origin develop
    
    # Limpiar rama local
    git branch -d "feature/$feature_name"
    
    print_message "✅ Feature '$feature_name' finalizada y mergeada a develop" "$GREEN"
    print_message "🌐 Cambios disponibles en: https://kiltro87.github.io/viaje-himalaya" "$BLUE"
}

# Función para hacer release
make_release() {
    local version=$1
    if [ -z "$version" ]; then
        read -p "📦 Versión del release (ej: v2.1.0): " version
    fi
    
    print_message "🚀 Creando release: $version" "$BLUE"
    
    # Crear rama de release
    git checkout develop
    git pull origin develop
    git checkout -b "release/$version"
    
    # Actualizar versión en manifest.json si existe
    if [ -f "manifest.json" ]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$version\"/" manifest.json
        git add manifest.json
        git commit -m "Bump version to $version"
    fi
    
    # Mergear a main
    git checkout main
    git pull origin main
    git merge "release/$version" --no-ff -m "Release $version"
    git tag -a "$version" -m "Release $version"
    git push origin main --tags
    
    # Mergear de vuelta a develop
    git checkout develop
    git merge "release/$version" --no-ff -m "Merge release $version back to develop"
    git push origin develop
    
    # Limpiar rama de release
    git branch -d "release/$version"
    
    print_message "✅ Release $version creado y desplegado" "$GREEN"
    print_message "🌐 Disponible en: https://kiltro87.github.io/viaje-himalaya" "$BLUE"
}

# Función para hotfix
hotfix() {
    local fix_name=$1
    if [ -z "$fix_name" ]; then
        read -p "🔧 Nombre del hotfix: " fix_name
    fi
    
    print_message "🚨 Creando hotfix: $fix_name" "$RED"
    
    git checkout main
    git pull origin main
    git checkout -b "hotfix/$fix_name"
    
    print_message "✅ Hotfix '$fix_name' creado" "$GREEN"
    print_message "💡 Cuando termines, usa: ./git-workflow.sh finish-hotfix $fix_name" "$YELLOW"
}

# Función para finalizar hotfix
finish_hotfix() {
    local fix_name=$1
    if [ -z "$fix_name" ]; then
        read -p "🔧 Nombre del hotfix a finalizar: " fix_name
    fi
    
    print_message "🔄 Finalizando hotfix: $fix_name" "$RED"
    
    git checkout "hotfix/$fix_name"
    
    # Commitear cambios si los hay
    if ! git diff --cached --quiet; then
        read -p "💬 Mensaje del commit: " commit_message
        git commit -m "$commit_message"
    fi
    
    # Mergear a main
    git checkout main
    git merge "hotfix/$fix_name" --no-ff -m "Hotfix: $fix_name"
    git push origin main
    
    # Mergear a develop
    git checkout develop
    git merge "hotfix/$fix_name" --no-ff -m "Merge hotfix $fix_name to develop"
    git push origin develop
    
    # Limpiar
    git branch -d "hotfix/$fix_name"
    
    print_message "✅ Hotfix '$fix_name' aplicado a main y develop" "$GREEN"
}

# Función para sincronizar con remoto
sync() {
    local current_branch=$(git branch --show-current)
    
    print_message "🔄 Sincronizando rama '$current_branch' con remoto..." "$BLUE"
    
    git fetch origin
    git pull origin "$current_branch"
    
    print_message "✅ Sincronización completada" "$GREEN"
}

# Función para mostrar ayuda
show_help() {
    print_message "🛠️  Git Workflow Helper - PWA Viaje Himalaya" "$BLUE"
    echo ""
    echo "📋 Comandos disponibles:"
    echo ""
    echo "  status                    - Mostrar estado actual"
    echo "  feature <nombre>          - Crear nueva feature"
    echo "  finish <nombre>           - Finalizar feature actual"
    echo "  release <version>         - Crear release (ej: v2.1.0)"
    echo "  hotfix <nombre>           - Crear hotfix urgente"
    echo "  finish-hotfix <nombre>    - Finalizar hotfix"
    echo "  sync                      - Sincronizar con remoto"
    echo "  deploy                    - Desplegar PWA"
    echo ""
    echo "🌿 Estructura de ramas:"
    echo "  main     - Producción (GitHub Pages)"
    echo "  develop  - Desarrollo principal"
    echo "  feature/* - Nuevas funcionalidades"
    echo "  release/* - Preparación de releases"
    echo "  hotfix/*  - Correcciones urgentes"
    echo ""
    echo "📖 Ejemplos:"
    echo "  ./git-workflow.sh feature android-icons"
    echo "  ./git-workflow.sh finish android-icons"
    echo "  ./git-workflow.sh release v2.1.0"
}

# Función para desplegar
deploy_pwa() {
    print_message "🚀 Desplegando PWA..." "$BLUE"
    
    # Asegurar que main está actualizado
    git checkout main
    git pull origin main
    
    print_message "✅ PWA desplegada en GitHub Pages" "$GREEN"
    print_message "🌐 URL: https://kiltro87.github.io/viaje-himalaya" "$BLUE"
    
    # Volver a la rama anterior
    git checkout -
}

# Menú principal
case "${1:-help}" in
    "status")
        show_status
        ;;
    "feature")
        new_feature "$2"
        ;;
    "finish")
        finish_feature "$2"
        ;;
    "release")
        make_release "$2"
        ;;
    "hotfix")
        hotfix "$2"
        ;;
    "finish-hotfix")
        finish_hotfix "$2"
        ;;
    "sync")
        sync
        ;;
    "deploy")
        deploy_pwa
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_message "❌ Comando desconocido: $1" "$RED"
        show_help
        exit 1
        ;;
esac
