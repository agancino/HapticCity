/**
 * MenuScene.js
 * Pantalla inicial de bienvenida del proyecto Haptic City.
 * Conecta los botones HTML/CSS con el motor de escenas Phaser 3.
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Fondo gradiente oscuro en el canvas
        this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

        // Asegurar que la pantalla del menú HTML sea visible
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) {
            menuScreen.classList.remove('hidden');
        }

        // Conectar botones HTML
        const btnStart = document.getElementById('btn-start');
        const btnRestart = document.getElementById('btn-restart');
        const btnMute = document.getElementById('btn-mute');

        if (btnStart) {
            btnStart.onclick = (e) => {
                if (e) e.preventDefault();
                if (menuScreen) menuScreen.classList.add('hidden');
                
                // Activar o desbloquear el contexto de audio en caso de restricciones de navegador
                if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
                    this.sound.context.resume();
                }

                // Iniciar la escena del juego
                this.scene.start('GameScene');
            };
        }

        if (btnRestart) {
            btnRestart.onclick = (e) => {
                if (e) e.preventDefault();
                this.scene.restart();
            };
        }

        if (btnMute) {
            btnMute.onclick = (e) => {
                if (e) e.preventDefault();
                this.sound.mute = !this.sound.mute;
                btnMute.innerText = this.sound.mute ? '🔇 AUDIO: SILENCIADO' : '🔊 AUDIO: ACTIVADO';
            };
        }
    }
}
