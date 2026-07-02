# 🎵 Reproductor de Música Móvil Premium (PWA / Mobile App)

Una aplicación móvil moderna, fluida y de alto impacto visual diseñada específicamente para la reproducción de música local. Desarrollada con **React + Vite + TypeScript**, estructurada bajo los principios de **Clean Architecture (MVVM)**, y optimizada para ser compilada como una aplicación nativa mediante **Capacitor**.

---

## 🚀 Guía de Inicio Rápido

### 1. Clonar e Instalar Dependencias
Instala los paquetes necesarios del proyecto:
```bash
npm install
```

### 2. Ejecutar Servidor de Desarrollo
Inicia el entorno local para previsualizar la aplicación en tu navegador en tiempo real:
```bash
npm run dev
```
*Por defecto estará disponible en: `http://localhost:5173`*

### 3. Compilar Proyecto Web
Genera la carpeta optimizada de producción (`dist/`):
```bash
npm run build
```

---

## ⚠️ Nota sobre Errores TS(2307) en el Editor

Si ves una advertencia roja en tu editor similar a:
`Cannot find module './MiniPlayer' or its corresponding type declarations.ts(2307)`

> [!NOTE]
> **Es un error de caché del servidor TypeScript de tu IDE.** 
> Dado que los archivos fueron creados y enlazados de manera dinámica en el entorno de desarrollo, el servidor de lenguaje TypeScript a veces no refresca su índice a tiempo. 
> 
> **Cómo comprobarlo:**
> Si ejecutas `npm run build`, verás que el compilador `tsc` finaliza con **0 errores**, lo cual demuestra que el código es 100% correcto. 
> 
> **Para solucionarlo en tu editor:**
> En VS Code, abre la paleta de comandos (`Ctrl + Shift + P` o `Cmd + Shift + P`) y selecciona: **TypeScript: Restart TS Server** (Reiniciar servidor TS). También puedes cerrar y volver a abrir el editor.

---

## 📱 ¿Cómo compilar la aplicación para celular (Android APK / iOS)?

Para empaquetar este desarrollo web responsivo en un archivo nativo para celular, utilizaremos **Capacitor** de Ionic, que envuelve la aplicación web en un contenedor web view nativo con acceso completo a las APIs de hardware.

### Paso 1: Instalar Capacitor CLI y Core
En la raíz del proyecto, ejecuta:
```bash
npm install @capacitor/core @capacitor/cli
```

### Paso 2: Inicializar el Proyecto de Capacitor
Crea el archivo de configuración. Reemplaza el identificador de paquete si lo deseas:
```bash
npx cap init "MusicApp" "com.nelson.musicapp" --web-dir=dist
```

### Paso 3: Añadir las plataformas móviles
Primero, compila la aplicación web para asegurarte de tener la carpeta `dist/` actualizada:
```bash
npm run build
```

#### Para Android:
Instala el SDK de Android y agrega la carpeta nativa:
```bash
npm install @capacitor/android
npx cap add android
```

#### Para iOS (Requiere macOS):
Agrega la carpeta de Xcode:
```bash
npm install @capacitor/ios
npx cap add ios
```

### Paso 4: Sincronizar el Código Web con los Contenedores Nativos
Cada vez que realices cambios en tu código React y ejecutes `npm run build`, debes sincronizar el código compilado con los proyectos de Android/iOS ejecutando:
```bash
npx cap sync
```

### Paso 5: Compilar el APK / IPA en Android Studio o Xcode
Para abrir el proyecto nativo en su IDE correspondiente para firmar y exportar la App:

#### Para Android (Abre en Android Studio):
```bash
npx cap open android
```
*En Android Studio, ve a **Build > Build Bundle(s) / APK(s) > Build APK(s)** para generar tu archivo `.apk` instalable.*

#### Para iOS (Abre en Xcode):
```bash
npx cap open ios
```
*En Xcode, selecciona un dispositivo iOS genérico y haz clic en **Product > Archive** para firmar y compilar la App para la App Store o Ad-Hoc.*
