# 🔥 Configuración de Firebase - Almacenamiento en la Nube

## 🎯 ¿Qué conseguirás?

- ✅ **Gastos sincronizados** entre todos tus dispositivos
- ✅ **Backup automático** en la nube de Google
- ✅ **Tiempo real** - cambios instantáneos en todos los dispositivos
- ✅ **Funciona offline** y sincroniza cuando hay conexión
- ✅ **Gratis** hasta 1GB de datos (suficiente para años)

---

## 🚀 Configuración Paso a Paso (10 minutos)

### **Paso 1: 📝 Crear Proyecto Firebase**

1. **Ve a:** https://console.firebase.google.com/
2. **Haz clic en:** "Crear un proyecto"
3. **Nombre del proyecto:** `viaje-himalaya`
4. **Google Analytics:** Puedes deshabilitarlo para este proyecto
5. **Crear proyecto** → Esperar a que se configure

### **Paso 2: 🗄️ Habilitar Firestore Database**

1. **En el menú lateral:** "Firestore Database"
2. **Crear base de datos**
3. **Reglas de seguridad:** "Empezar en modo de prueba"
   ```
   // Permitir lectura/escritura por 30 días (para testing)
   allow read, write: if request.time < timestamp.date(2024, 12, 31);
   ```
4. **Ubicación:** `europe-west3 (Frankfurt)` - más cerca de España
5. **Listo**

### **Paso 3: ⚙️ Configurar App Web**

1. **Configuración del proyecto** (icono ⚙️ arriba a la derecha)
2. **Configuración general** → Desplázate hacia abajo
3. **Tus apps** → Haz clic en el icono **Web** `</>`
4. **Registrar app:**
   - Nombre: `PWA Viaje Himalaya`
   - ✅ **Marcar:** "También configurar Firebase Hosting" (opcional)
5. **Registrar app**

### **Paso 4: 📋 Copiar Configuración**

Verás algo como esto:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-ejemplo123456789",
  authDomain: "viaje-himalaya.firebaseapp.com",
  projectId: "viaje-himalaya",
  storageBucket: "viaje-himalaya.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**📝 Copia estos datos** - los necesitarás en el siguiente paso.

### **Paso 5: 🔧 Actualizar Configuración Local**

1. **Abre:** `js/config/firebaseConfig.js`
2. **Reemplaza** las líneas que dicen `"TU_API_KEY_AQUI"` con tus datos reales:

```javascript
export const firebaseConfig = {
    // 👇 PEGA AQUÍ TU CONFIGURACIÓN REAL
    apiKey: "AIzaSyC-tu-api-key-real",
    authDomain: "viaje-himalaya.firebaseapp.com", 
    projectId: "viaje-himalaya",
    storageBucket: "viaje-himalaya.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

### **Paso 6: 🔒 Configurar Reglas de Seguridad (Importante)**

1. **En Firebase Console:** Firestore Database → **Reglas**
2. **Reemplaza** el contenido con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a gastos (modo público por simplicidad)
    // NOTA: Para producción, considera añadir autenticación
    match /expenses/{expenseId} {
      allow read, write: if true;
    }
    
    // Solo lectura para datos del viaje
    match /trips/{tripId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

3. **Publicar** las reglas

### **Paso 7: 🚀 Subir Cambios y Probar**

```bash
# Commitear los cambios
git add .
git commit -m "feat: configurar Firebase para almacenamiento centralizado"

# Finalizar feature
./git-workflow.sh finish firebase-storage

# Crear release
./git-workflow.sh release v2.2.0
```

---

## ✅ **Verificar que Funciona**

### **1. 📱 Abrir la PWA**
- Ve a: https://kiltro87.github.io/viaje-himalaya
- Abre las **herramientas de desarrollador** (F12)
- Ve a la pestaña **Console**

### **2. 🔍 Buscar Mensajes**
Deberías ver:
```
✅ Firebase initialized successfully
☁️ Sincronizado
```

### **3. 🧪 Probar Sincronización**
1. **Añade un gasto** en la PWA
2. **Ve a Firebase Console** → Firestore Database
3. **Deberías ver** una colección `expenses` con tu gasto
4. **Abre la PWA en otro dispositivo** → El gasto debería aparecer automáticamente

---

## 🎉 **¡Funciona! ¿Qué Puedes Hacer Ahora?**

### **📱 Múltiples Dispositivos:**
- Instala la PWA en tu móvil y tablet
- Los gastos se sincronizan automáticamente
- Cambios en tiempo real entre dispositivos

### **✈️ Viaje Sin Internet:**
- Añade gastos offline durante el viaje
- Se sincronizarán automáticamente cuando tengas WiFi
- Nunca perderás datos

### **👥 Compartir con Compañeros de Viaje:**
- Todos pueden añadir gastos
- Vista unificada del presupuesto
- Transparencia total en los gastos

---

## 🔧 **Solución de Problemas**

### **❌ "Firebase not configured"**
- Verifica que copiaste la configuración correctamente
- Asegúrate de que no hay comillas extra o comas faltantes

### **❌ "Permission denied"**
- Revisa las reglas de Firestore
- Asegúrate de que están publicadas

### **❌ "Network error"**
- Verifica que Firestore está habilitado
- Comprueba tu conexión a internet

### **❌ Los gastos no se sincronizan**
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que el proyecto Firebase esté activo

---

## 💰 **Costos (Tranquilo, es Gratis)**

Firebase es **gratuito** para proyectos pequeños:

- ✅ **1 GB de almacenamiento** (suficiente para miles de gastos)
- ✅ **50,000 lecturas/día** (más que suficiente)
- ✅ **20,000 escrituras/día** (perfecto para gastos)
- ✅ **Sin límite de tiempo**

Para un viaje personal, **nunca pagarás nada**.

---

## 🔄 **Migración Automática**

No te preocupes por los gastos que ya tienes:

- ✅ **Se migran automáticamente** la primera vez
- ✅ **Se mantiene backup** en localStorage
- ✅ **Sin pérdida de datos**

---

## 🆘 **¿Necesitas Ayuda?**

Si tienes problemas:

1. **Revisa la consola** del navegador (F12)
2. **Verifica** que Firebase está configurado
3. **Comprueba** las reglas de Firestore
4. **Prueba** en modo incógnito

**¡Una vez configurado, funciona como magia!** ✨

---

## 🎯 **Próximos Pasos Opcionales**

Una vez que Firebase funcione, puedes añadir:

- 🔐 **Autenticación** para múltiples usuarios
- 📊 **Analytics** de gastos avanzados  
- 🔔 **Notificaciones push** personalizadas
- 📱 **App móvil nativa** con los mismos datos

**¡Pero por ahora, ya tienes almacenamiento centralizado funcionando!** 🚀
