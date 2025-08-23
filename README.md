# 🏔️ Mi Aventura en el Himalaya - PWA

Una aplicación web progresiva (PWA) completa para gestionar tu viaje a Nepal y Bután. Funciona offline, con mapas descargables, geolocalización, notificaciones y mucho más.

## ✨ Características Principales

### 📱 Progressive Web App
- ✅ **Se instala como app nativa** en móviles
- ✅ **Funciona completamente offline**
- ✅ **Notificaciones automáticas** de vuelos y presupuesto
- ✅ **Sin barras del navegador** - experiencia nativa

### 🗺️ Mapas Inteligentes
- ✅ **Mapas offline** de Nepal y Bután
- ✅ **Funciona sin internet** una vez descargados
- ✅ **Marcadores interactivos** con información
- ✅ **Rutas del itinerario** visualizadas

### 📍 Geolocalización
- ✅ **"¡Has llegado a Katmandú!"** - detección automática
- ✅ **Distancia a próximo destino** en tiempo real
- ✅ **Notificaciones de lugares cercanos**

### 💰 Gestión de Presupuesto
- ✅ **Seguimiento de gastos** por categorías
- ✅ **Alertas automáticas** cuando gastes el 75% o 90%
- ✅ **Comparativa visual** presupuesto vs gastos reales

### 🌐 Compartir Nativo
- ✅ **Comparte con WhatsApp, Instagram, etc.** directamente
- ✅ **Compartir días específicos** del itinerario
- ✅ **Compartir ubicaciones** con Google Maps

## 🚀 Cómo Usar la App

### Opción 1: 🖥️ Uso Local (Recomendado para empezar)

```bash
# 1. Abre terminal en la carpeta del proyecto
cd /Users/dferrer/Downloads/Viaje

# 2. Ejecuta el script simple
./deploy-simple.sh

# 3. Elige opción 1 (Servidor local)
```

**Resultado:**
- App disponible en `http://localhost:8000`
- Acceso desde móvil: `http://TU_IP:8000`
- Todas las funciones PWA funcionando

### Opción 2: 🔗 Netlify Drop (Recomendado para uso permanente)

```bash
# 1. Ejecuta el script
./deploy-simple.sh

# 2. Elige opción 2 (Netlify Drop)
# 3. Se abrirá https://app.netlify.com/drop
# 4. Arrastra TODA la carpeta del proyecto
# 5. ¡Obtienes URL permanente!
```

**Ventajas:**
- ✅ **Gratis y permanente**
- ✅ **HTTPS automático** (necesario para PWA)
- ✅ **Acceso desde cualquier dispositivo**
- ✅ **Perfecto para compartir**

## 📱 Instalación en Móvil

### iPhone/iPad (Safari):
1. Abre la URL en **Safari**
2. Toca **"Compartir"** (cuadrado con flecha hacia arriba)
3. Selecciona **"Añadir a pantalla de inicio"**
4. ¡Listo! Ya tienes la app instalada

### Android (Chrome):
1. Abre la URL en **Chrome**
2. Aparecerá un banner **"Instalar app"**
3. O ve al menú → **"Instalar app"**
4. ¡Listo! Ya tienes la app instalada

### Después de Instalar:
- ✅ **Icono en pantalla de inicio**
- ✅ **Funciona sin internet**
- ✅ **Notificaciones push**
- ✅ **Experiencia nativa completa**

## 🎯 Funciones Destacadas

### 🔔 Notificaciones Automáticas
- **24 horas antes del vuelo:** "Tu vuelo sale mañana a las 10:00"
- **2 horas antes:** "¡Hora de ir al aeropuerto!"
- **Presupuesto:** "Has gastado el 75% de tu presupuesto"
- **Llegada:** "¡Bienvenido a Pokhara!"

### 🗺️ Mapas Offline
- **Descarga automática** de Nepal y Bután
- **Funciona sin internet** una vez descargado
- **Zoom hasta nivel 15** para detalles
- **Marcadores personalizados** por día

### 📍 Geolocalización Inteligente
- **Detección automática** cuando llegas a destinos
- **Cálculo de distancias** a próximos lugares
- **Historial de ubicaciones** visitadas
- **Notificaciones de proximidad**

### 💰 Control de Gastos
- **Categorías predefinidas:** Alojamiento, Comida, Transporte, etc.
- **Alertas inteligentes** por porcentaje gastado
- **Comparativa visual** con gráficos
- **Persistencia local** - no se pierden los datos

## 🛠️ Personalización

### Cambiar Datos del Viaje:
Edita `js/config/tripConfig.js` para modificar:
- Fechas e itinerario
- Presupuesto por categorías
- Información de vuelos
- Lugares de interés

### Cambiar Colores:
Edita `js/config/AppConstants.js`:
```javascript
export const COLORS = {
    PRIMARY: 'blue',    // Cambia a 'green', 'purple', etc.
    SECONDARY: 'purple',
    ACCENT: 'orange'
};
```

## 🔧 Solución de Problemas

### La PWA no se instala:
- ✅ Asegúrate de usar **HTTPS** (Netlify lo da automático)
- ✅ Usa **Safari en iOS** o **Chrome en Android**
- ✅ Verifica que aparezca el botón "Instalar app"

### Mapas no cargan offline:
- ✅ Conéctate a internet la primera vez
- ✅ Navega por el mapa para descargar tiles
- ✅ Los mapas se guardan automáticamente

### Notificaciones no funcionan:
- ✅ Acepta permisos cuando te lo pida el navegador
- ✅ Verifica que esté en HTTPS
- ✅ En iOS, debe estar instalada como PWA

### Problemas en móvil:
- ✅ El CSS responsive está optimizado
- ✅ Las tarjetas se adaptan automáticamente
- ✅ Navegación táctil mejorada

## 📊 Datos del Viaje

La app incluye datos completos para un viaje de **24 días** por Nepal y Bután:

- **📅 Itinerario completo** día a día
- **✈️ 4 vuelos** (Madrid-Katmandú-Paro-Katmandú-Madrid)
- **💰 Presupuesto detallado** por categorías
- **🎒 Lista de equipaje** organizada
- **🌤️ Información climática** por regiones
- **🏢 Datos de agencias** locales

## 📞 Soporte

Si tienes problemas:

1. **Ejecuta:** `./deploy-simple.sh` → Opción 3 (Ver instrucciones)
2. **Verifica** que Python 3 esté instalado
3. **Prueba** primero en local, luego Netlify

## 👨‍💻 Autor

**David Ferrer Figueroa**
- Desarrollador Full Stack
- Especialista en PWA

## 📄 Licencia

MIT License - Úsalo libremente para tu viaje

---

## 🎉 ¡Disfruta tu Aventura!

Esta PWA está diseñada para acompañarte en cada momento de tu viaje al Himalaya. Desde la planificación hasta el regreso, tendrás toda la información necesaria en tu bolsillo, ¡incluso sin internet!

**¡Buen viaje! 🏔️✨**