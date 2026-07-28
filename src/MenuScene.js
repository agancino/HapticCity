/**
 * MenuScene.js
 * Pantalla inicial de bienvenida del proyecto Haptic City.
 * Conecta los botones HTML/CSS de la interfaz de usuario con el motor de escenas de Phaser 3.
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Fondo gradiente oscuro
        this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

        // Mostrar la interfaz HTML del Menú
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) {
            menuScreen.classList.remove('hidden');
        }

        // Conectar botones HTML
        const btnStart = document.getElementById('btn-start');
        const btnRestart = document.getElementById('btn-restart');
        const btnMute = document.getElementById('btn-mute');

        if (btnStart) {
            btnStart.onclick = () => {
                if (menuScreen) menuScreen.classList.add('hidden');
                this.scene.start('GameScene');
            };
        }

        if (btnRestart) {
            btnRestart.onclick = () => {
                this.scene.restart();
            };
        }

        if (btnMute) {
            btnMute.onclick = () => {
                this.sound.mute = !this.sound.mute;
                btnMute.innerText = this.sound.mute ? '🔇 AUDIO: SILENCIADO' : '🔊 AUDIO: ACTIVADO';
            };
        }
    }
}
