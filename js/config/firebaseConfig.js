/**
 * Firebase Configuration - Almacenamiento Centralizado
 * 
 * Configuración para Firebase Firestore que permite almacenar
 * los gastos del viaje en la nube con sincronización automática
 * y soporte offline.
 * 
 * Funcionalidades:
 * - Almacenamiento en tiempo real
 * - Sincronización automática entre dispositivos
 * - Soporte offline con cache local
 * - Backup automático en la nube
 * 
 * @author David Ferrer Figueroa
 * @version 2.1.0
 * @since 2024
 */

// Configuración de Firebase (se debe completar con datos reales)
export const firebaseConfig = {
    // INSTRUCCIONES PARA CONFIGURAR:
    // 1. Ve a https://console.firebase.google.com/
    // 2. Crea un nuevo proyecto: "viaje-himalaya"
    // 3. Habilita Firestore Database
    // 4. Copia la configuración aquí:
    
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "viaje-himalaya.firebaseapp.com",
    projectId: "viaje-himalaya",
    storageBucket: "viaje-himalaya.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
    
    // EJEMPLO DE CONFIGURACIÓN REAL:
    // apiKey: "AIzaSyC...",
    // authDomain: "viaje-himalaya.firebaseapp.com",
    // projectId: "viaje-himalaya",
    // storageBucket: "viaje-himalaya.appspot.com",
    // messagingSenderId: "123456789012",
    // appId: "1:123456789012:web:abcdef1234567890"
};

// Configuración de Firestore
export const firestoreConfig = {
    // Colecciones de la base de datos
    collections: {
        expenses: 'expenses',
        trips: 'trips',
        users: 'users'
    },
    
    // Configuración de cache offline
    settings: {
        cacheSizeBytes: 40000000, // 40MB cache
        experimentalForceLongPolling: false
    }
};

// Configuración de autenticación (opcional)
export const authConfig = {
    // Si quieres autenticación de usuarios
    enableAuth: false, // Cambiar a true para habilitar
    
    // Proveedores de autenticación
    providers: {
        google: true,
        email: true,
        anonymous: true // Para usuarios sin cuenta
    }
};

// Configuración de reglas de seguridad sugeridas
export const securityRules = `
// Reglas de Firestore Security Rules
// Copia esto en Firebase Console → Firestore → Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura de gastos para todos (modo público)
    // NOTA: Para producción, considera añadir autenticación
    match /expenses/{expenseId} {
      allow read, write: if true;
    }
    
    // Permitir lectura de información del viaje
    match /trips/{tripId} {
      allow read: if true;
      allow write: if false; // Solo lectura para datos del viaje
    }
    
    // Si habilitas autenticación:
    // match /expenses/{expenseId} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
`;

// Estado de configuración
export const isConfigured = () => {
    return firebaseConfig.apiKey !== "TU_API_KEY_AQUI";
};

// Instrucciones de configuración
export const setupInstructions = `
🔥 CONFIGURACIÓN DE FIREBASE:

1. 📝 Crear Proyecto:
   - Ve a: https://console.firebase.google.com/
   - "Crear proyecto" → "viaje-himalaya"
   - Acepta términos y condiciones

2. 🗄️ Habilitar Firestore:
   - En el proyecto → "Firestore Database"
   - "Crear base de datos"
   - Modo: "Empezar en modo de prueba" (por ahora)
   - Ubicación: "europe-west3" (Frankfurt - más cerca)

3. ⚙️ Configurar App Web:
   - Configuración del proyecto (⚙️) → "Configuración general"
   - "Tus apps" → Icono web (</>)
   - Nombre: "PWA Viaje Himalaya"
   - ✅ Marcar "También configurar Firebase Hosting"
   - Copiar configuración y pegarla en firebaseConfig

4. 🔒 Configurar Reglas de Seguridad:
   - Firestore → "Reglas"
   - Pegar el contenido de 'securityRules'
   - "Publicar"

5. 📱 Probar Conexión:
   - Recargar la PWA
   - Debería mostrar "✅ Firebase conectado"
   - Los gastos se guardarán automáticamente en la nube

💡 BENEFICIOS:
- ✅ Gastos sincronizados entre dispositivos
- ✅ Backup automático en la nube
- ✅ Funciona offline y sincroniza después
- ✅ Tiempo real - cambios instantáneos
- ✅ Gratis hasta 1GB de datos
`;
