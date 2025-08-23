# 🌿 Git Workflow - PWA Viaje Himalaya

## 🎯 Estructura de Ramas

```
main (producción)
├── develop (desarrollo principal)
│   ├── feature/android-icons
│   ├── feature/offline-maps
│   └── feature/notifications
├── release/v2.1.0
└── hotfix/critical-bug
```

## 🚀 Comandos Rápidos

### **Desarrollo Diario:**
```bash
# Ver estado actual
./git-workflow.sh status

# Crear nueva funcionalidad
./git-workflow.sh feature android-icons

# Finalizar funcionalidad
./git-workflow.sh finish android-icons

# Sincronizar con remoto
./git-workflow.sh sync
```

### **Releases:**
```bash
# Crear release
./git-workflow.sh release v2.1.0

# Desplegar a producción
./git-workflow.sh deploy
```

### **Emergencias:**
```bash
# Hotfix urgente
./git-workflow.sh hotfix critical-bug

# Finalizar hotfix
./git-workflow.sh finish-hotfix critical-bug
```

## 🔄 Flujo de Trabajo

### **1. Nueva Funcionalidad:**
1. `./git-workflow.sh feature mi-nueva-feature`
2. Desarrollar en la rama `feature/mi-nueva-feature`
3. `./git-workflow.sh finish mi-nueva-feature`
4. Se mergea automáticamente a `develop`

### **2. Release:**
1. `./git-workflow.sh release v2.1.0`
2. Se crea tag y se mergea a `main`
3. GitHub Pages se actualiza automáticamente

### **3. Hotfix:**
1. `./git-workflow.sh hotfix bug-critico`
2. Corregir en `hotfix/bug-critico`
3. `./git-workflow.sh finish-hotfix bug-critico`
4. Se aplica a `main` y `develop`

## 🌐 Despliegues

- **Desarrollo:** `develop` branch (para testing)
- **Producción:** `main` branch → https://kiltro87.github.io/viaje-himalaya

## 📝 Convenciones

### **Nombres de Ramas:**
- `feature/descripcion-corta`
- `release/v2.1.0`
- `hotfix/descripcion-del-bug`

### **Commits:**
- `feat: añadir iconos Android`
- `fix: corregir instalación PWA`
- `docs: actualizar README`
- `style: mejorar responsive móvil`

### **Tags:**
- `v2.0.0` - Release mayor
- `v2.1.0` - Nuevas funcionalidades
- `v2.1.1` - Correcciones

## 🛠️ Configuración Inicial

Ya está todo configurado, pero para referencia:

```bash
# Ramas principales
git checkout -b develop
git push -u origin develop

# Configurar upstream
git branch --set-upstream-to=origin/main main
git branch --set-upstream-to=origin/develop develop
```

## 🤝 Colaboración

Si trabajas con otros desarrolladores:

```bash
# Antes de empezar el día
./git-workflow.sh sync

# Crear feature
./git-workflow.sh feature nueva-funcionalidad

# Al terminar
./git-workflow.sh finish nueva-funcionalidad
```

## 🔍 Debugging

### **Ver historial:**
```bash
git log --oneline --graph --all
```

### **Ver ramas remotas:**
```bash
git branch -r
```

### **Limpiar ramas:**
```bash
git remote prune origin
```

## 📱 Integración con PWA

Cada push a `main` actualiza automáticamente:
- GitHub Pages
- PWA en dispositivos instalados
- Service Worker cache

¡El workflow está listo para desarrollo profesional! 🎉
