# 🚑 HAPTIC CITY 🚗

> **Demostración académica interactiva de tecnología háptica y audio espacial urbano para personas con discapacidad auditiva.**

![Haptic City Preview](assets/sprites/.gitkeep)

---

## 🎯 Objetivo del Proyecto

**Haptic City** es un videojuego web 2D de perspectiva superior (*Top-Down*) desarrollado con **Phaser 3**. El propósito de esta aplicación es servir como simulación urbana donde un usuario recorre una ciudad pixel art y, al ingresar a áreas específicas (Hospital, Estación de Policía, Estación de Bomberos e Intersección Vial), la aplicación reproduce sonidos contextuales característicos de vehículos de emergencia y tráfico.

Estos audios emitidos por el navegador están diseñados para ser captados por un micrófono de una **aplicación Android**, la cual procesa la frecuencia acústica y activa señales vibratorias en una **pulsera háptica** para orientar a personas con discapacidad auditiva en entornos urbanos.

> ℹ️ *Nota: El juego únicamente emite los sonidos contextuales con tiempo de enfriamiento (cooldown) y feedback háptico local de demostración. No realiza reconocimiento de audio en el navegador.*

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 & CSS3**: Estructura semántica y diseño de interfaz adaptable (*Responsive Design*).
- **JavaScript (ES6+)**: Lógica modular orientada a objetos.
- **Phaser 3 (v3.80.0)**: Motor de videojuegos 2D para renderizado, físicas Arcade y gestión de escenas.
- **WebAudio API**: Generación sintética de audio espacial de respaldo y reproducción de muestras.
- **Vibration API**: Demostración de vibración haptica directa en navegadores móviles compatibles.
- **Git & GitHub / GitHub Pages**: Control de versiones y despliegue continuo web.

*(No utiliza Unity, Godot, Unreal, Electron, React, Vue ni Angular. Funciona directamente en navegadores web estándar sin dependencias de Node.js).*

---

## 🎮 Controles de Juego

### 💻 En Computadoras (PC / Mac / Linux)
- **Movimiento**: Teclas `W`, `A`, `S`, `D` o **Flechas de Dirección** (🠉 🠈 🠋 🠊).
- **Mute / Audio**: Botón **"🔊 Con Sonido / 🔇 Silenciado"** en la barra superior (HUD).
- **Reiniciar Posición**: Botón **"🔄 Reiniciar"** en la barra HUD superior.

### 📱 En Dispositivos Móviles (Android / iOS / Tablets)
- **Movimiento**: **Joystick Virtual Táctil** integrado en la esquina inferior izquierda.
- **Táctil 100%**: Toda la interfaz y navegación se realiza cómodamente con un solo dedo.
- **Vibración Opcional**: Disparada automáticamente mediante `navigator.vibrate` si el celular la soporta.

---

## 🗺️ Zonas de la Ciudad y Sirenas

| Zona | Edificio / Ubicación | Icono | Sonido Producido | Frecuencia / Audio | Cooldown |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Hospital** | Noroeste (Edificio Rojo/Blanco) | 🚑 | Sirena de Ambulancia | Doble tono 600Hz-900Hz | 4.5s |
| **Policía** | Noreste (Edificio Azul) | 🚓 | Sirena de Policía | Barrido agudo 700Hz-1400Hz | 4.5s |
| **Bomberos** | Suroeste (Edificio Rojo Oscuro) | 🚒 | Sirena de Bomberos | Tono grave 350Hz-550Hz | 4.5s |
| **Cruce Principal** | Centro (Intersección Vial) | 🚗 | Bocina de Automóvil | Armónico 400Hz + 500Hz | 4.5s |

---

## 📁 Estructura del Proyecto

```text
HapticCity/
├── index.html              # Punto de entrada HTML5 con CDN de Phaser 3
├── style.css               # Estilos globales y contenedor responsive
├── main.js                 # Configuración del motor Phaser 3 y físicas
├── assets/
│   ├── sprites/            # Sprites del jugador y personajes (.png)
│   ├── tiles/              # Tilesets del mapa urbano (.png)
│   ├── sounds/             # Archivos de audio (.mp3, .wav, .ogg)
│   └── maps/               # Configuraciones o mapas de Tiled (.json)
├── src/
│   ├── Player.js           # Físicas, animaciones y movimiento del personaje
│   ├── Map.js              # Construcción de la ciudad, edificios y triggers
│   ├── AudioManager.js     # Gestión de audios, cooldowns y sintetizador WebAudio
│   ├── InputManager.js     # Unificación de teclado PC y toque móvil
│   ├── MobileControls.js   # Joystick virtual táctil fijo en pantalla
│   ├── LoadingScene.js     # Carga de recursos y generador procedural
│   ├── MenuScene.js        # Pantalla de inicio con objetivo académico
│   └── GameScene.js        # Escena principal con mapa, jugador y HUD
├── utils/                  # Scripts auxiliares y helpers
├── README.md               # Documentación académica y técnica
├── .gitignore              # Exclusiones de Git
└── LICENSE                 # Licencia de software libre MIT
```

---

## 💻 Ejecución Local desde Visual Studio Code

1. Clona o descarga la carpeta del proyecto `HapticCity`.
2. Abre **Visual Studio Code**.
3. Selecciona `Archivo -> Abrir carpeta...` y elige el directorio `HapticCity`.
4. Instala la extensión **Live Server** en VS Code (*Ritwick Dey*).
5. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"**.
6. El juego se abrirá automáticamente en tu navegador web predeterminado en `http://127.0.0.1:5500`.

---

## 🚀 Guía Paso a Paso para GitHub y GitHub Pages

### 1. Inicializar y verificar Git local
Abre la terminal en VS Code (`Ctrl + ~`) en la carpeta `HapticCity`:
```bash
git status
```
*(Si no estuviera inicializado, ejecuta `git init`, `git add .` y `git commit -m "feat: setup inicial"`)*.

### 2. Crear Repositorio en GitHub
1. Ingresa a [GitHub.com](https://github.com) e inicia sesión.
2. Haz clic en el botón verde **"New"** o ingresa a [github.com/new](https://github.com/new).
3. En **Repository name**, escribe exactamente: `HapticCity`.
4. Selecciona visibilidad **Public**.
5. **IMPORTANTE**: No marques las casillas de "Add a README", ".gitignore" ni "LICENSE" (ya están creados localmente).
6. Haz clic en **"Create repository"**.

### 3. Conectar el proyecto local a GitHub y Subir Código
Copia y ejecuta las siguientes instrucciones en tu terminal de VS Code (sustituyendo `TU_USUARIO` por tu nombre de usuario en GitHub):

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/HapticCity.git
git push -u origin main
```

> 💡 *Solución de Autenticación*: Si GitHub te solicita credenciales o token de acceso personal (PAT), genera un token desde: `Settings -> Developer Settings -> Personal Access Tokens -> Tokens (classic)` marcando el permiso `repo`.

### 4. Activar Publicación Gratuita en GitHub Pages
1. En tu repositorio en GitHub, ve a la pestaña **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment -> Branch**:
   - Cambia `None` por **`main`**.
   - Mantén la carpeta en **`/(root)`**.
4. Haz clic en **Save** (Guardar).
5. Espera entre 1 y 2 minutos. GitHub generará un enlace público directo:
   `https://TU_USUARIO.github.io/HapticCity/`

---

## ⚖️ Licencia
Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Créditos
Proyecto desarrollado para la demostración universitaria de tecnología de audio espacial y dispositivos hápticos de asistencia.
