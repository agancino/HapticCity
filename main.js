/**
 * main.js
 * Punto de entrada principal y configuración central del juego Haptic City con Phaser 3.
 * Configurado para compatibilidad 100% con protocolo file:// y servidores web HTTP.
 */

function initHapticCityGame() {
    // Si ya fue instanciado, evitar duplicados
    if (window.hapticCityGameInstance) return;

    const config = {
        type: Phaser.CANVAS, // Renderizado 2D Canvas compatible 100% con file:// en Brave/Chrome/Edge
        parent: 'game-container',
        width: 1280,
        height: 720,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            min: {
                width: 320,
                height: 240
            },
            max: {
                width: 1920,
                height: 1080
            }
        },
        pixelArt: true,
        backgroundColor: '#0d1117',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                debug: false
            }
        },
        scene: [
            LoadingScene,
            MenuScene,
            GameScene
        ]
    };

    window.hapticCityGameInstance = new Phaser.Game(config);
}

// Ejecutar inmediatamente si el DOM ya está listo, o al cargar el DOM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initHapticCityGame();
} else {
    document.addEventListener('DOMContentLoaded', initHapticCityGame);
    window.addEventListener('load', initHapticCityGame);
}
