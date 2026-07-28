/**
 * main.js
 * Punto de entrada principal y configuración central del juego Haptic City con Phaser 3.
 * Configura el escalado responsive, motor de físicas Arcade y registro de escenas.
 */

window.addEventListener('load', () => {
    const config = {
        type: Phaser.AUTO,
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
        pixelArt: true, // Optimizado para gráficos pixel art limpios
        backgroundColor: '#0d1117',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                debug: false // Cambiar a true si se desea depurar cajas de colisión
            }
        },
        scene: [
            LoadingScene,
            MenuScene
            // GameScene se agregará dinámicamente en las siguientes fases
        ]
    };

    const game = new Phaser.Game(config);

    // Ajustar enfoque al canvas para capturar teclado sin requerir clic previo
    window.focus();
});
