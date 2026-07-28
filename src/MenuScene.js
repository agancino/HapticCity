/**
 * MenuScene.js
 * Pantalla inicial de bienvenida del proyecto Haptic City.
 * Presenta el título, objetivo académico, botones interactivos y opción de silenciar audio.
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Fondo gradiente oscuro
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

        // Título del juego
        const title = this.add.text(width / 2, height * 0.22, 'HAPTIC CITY', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#38bdf8',
            align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#0284c7', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Subtítulo explicativo
        const subtitle = this.add.text(width / 2, height * 0.32, 'Demostración de Audio Urbano para Sistema Háptico', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '18px',
            color: '#94a3b8',
            align: 'center'
        }).setOrigin(0.5);

        // Tarjeta informativa del proyecto académico
        const infoCard = this.add.rectangle(width / 2, height * 0.47, Math.min(width * 0.85, 540), 100, 0x1e293b, 0.9)
            .setStrokeStyle(2, 0x38bdf8);

        const infoText = this.add.text(width / 2, height * 0.47, 
            '🎯 Objetivo: Recorre la ciudad para activar sonidos de vehículos y sirenas.\n' +
            '📱 Estos audios serán captados por la app Android para activar la pulsera háptica.\n' +
            '♿ Diseñado para personas con discapacidad auditiva.', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            color: '#e2e8f0',
            align: 'center',
            wordWrap: { width: Math.min(width * 0.8, 500) }
        }).setOrigin(0.5);

        // Botón: INICIAR JUEGO
        const startBtn = this.createButton(width / 2, height * 0.68, '▶  INICIAR JUEGO', 0x0284c7, 0x0369a1, () => {
            this.scene.start('GameScene');
        });

        // Botón: REINICIAR (Recargar escena o restablecer posición)
        const restartBtn = this.createButton(width / 2, height * 0.79, '🔄  REINICIAR DEMO', 0x334155, 0x475569, () => {
            this.scene.restart();
        });

        // Estado del audio global
        this.isMuted = this.sound.mute;
        const muteText = this.isMuted ? '🔇 AUDIO: SILENCIADO' : '🔊 AUDIO: ACTIVADO';
        
        // Botón: SILENCIAR AUDIO
        const muteBtn = this.createButton(width / 2, height * 0.89, muteText, 0x475569, 0x64748b, (btnTextObj) => {
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            btnTextObj.setText(this.isMuted ? '🔇 AUDIO: SILENCIADO' : '🔊 AUDIO: ACTIVADO');
        });

        // Adaptación en caso de cambio de tamaño de pantalla
        this.scale.on('resize', this.handleResize, this);
    }

    /**
     * Helper para crear botones uniformes con efectos Hover y Touch
     */
    createButton(x, y, text, normalColor, hoverColor, onClick) {
        const btnWidth = 260;
        const btnHeight = 48;

        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, normalColor, 1)
            .setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(2, 0x94a3b8);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, label]);

        bg.on('pointerover', () => {
            bg.setFillStyle(hoverColor);
            container.setScale(1.03);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(normalColor);
            container.setScale(1.0);
        });

        bg.on('pointerdown', () => {
            container.setScale(0.97);
        });

        bg.on('pointerup', () => {
            container.setScale(1.0);
            onClick(label);
        });

        return container;
    }

    handleResize(gameSize) {
        // Redimensionamiento automático si la pantalla cambia de orientación
        this.cameras.main.setSize(gameSize.width, gameSize.height);
    }
}
