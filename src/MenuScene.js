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

        // 1. Fondo gradiente oscuro
        this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

        // 2. Título principal del juego
        const title = this.add.text(width / 2, height * 0.20, 'HAPTIC CITY', {
            fontFamily: 'monospace, Arial, sans-serif',
            fontSize: '38px',
            fontStyle: 'bold',
            color: '#38bdf8',
            align: 'center'
        }).setOrigin(0.5);
        title.setShadow(3, 3, '#0284c7', 0, true);

        // 3. Subtítulo explicativo
        this.add.text(width / 2, height * 0.30, 'Demostración de Audio Urbano para Sistema Háptico', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#94a3b8',
            align: 'center'
        }).setOrigin(0.5);

        // 4. Tarjeta informativa del proyecto académico
        const cardWidth = Math.min(width * 0.85, 560);
        const infoCard = this.add.rectangle(width / 2, height * 0.46, cardWidth, 110, 0x1e293b, 0.95);
        infoCard.setStrokeStyle(2, 0x38bdf8);

        this.add.text(width / 2, height * 0.46, 
            '🎯 Objetivo: Recorre la ciudad para activar sonidos de vehículos y sirenas.\n' +
            '📱 Audios captados por app Android para activar la pulsera háptica.\n' +
            '♿ Diseñado para personas con discapacidad auditiva.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#e2e8f0',
            align: 'center',
            wordWrap: { width: cardWidth - 40 }
        }).setOrigin(0.5);

        // 5. Botón: INICIAR JUEGO
        this.createButton(width / 2, height * 0.67, '▶  INICIAR JUEGO', 0x0284c7, 0x0369a1, () => {
            this.scene.start('GameScene');
        });

        // 6. Botón: REINICIAR DEMO
        this.createButton(width / 2, height * 0.78, '🔄  REINICIAR DEMO', 0x334155, 0x475569, () => {
            this.scene.restart();
        });

        // 7. Botón: SILENCIAR AUDIO
        this.isMuted = this.sound.mute;
        const muteText = this.isMuted ? '🔇 AUDIO: SILENCIADO' : '🔊 AUDIO: ACTIVADO';
        
        this.createButton(width / 2, height * 0.89, muteText, 0x475569, 0x64748b, (btnTextObj) => {
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            btnTextObj.setText(this.isMuted ? '🔇 AUDIO: SILENCIADO' : '🔊 AUDIO: ACTIVADO');
        });

        // Adaptación responsive al cambiar tamaño
        this.scale.on('resize', this.handleResize, this);
    }

    /**
     * Helper para crear botones interaccionables
     */
    createButton(x, y, text, normalColor, hoverColor, onClick) {
        const btnWidth = 280;
        const btnHeight = 48;

        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, normalColor, 1)
            .setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(2, 0x94a3b8);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
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
        this.cameras.main.setSize(gameSize.width, gameSize.height);
    }
}
