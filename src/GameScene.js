/**
 * GameScene.js
 * Escena principal del juego Haptic City.
 * Integra la ciudad, el personaje, las zonas de disparo de audio, los controles táctiles/PC y el HUD superior.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Instanciar Gestor de Audio
        this.audioManager = new AudioManager(this);

        // 2. Construir el Mapa de la Ciudad
        this.cityMap = new CityMap(this);

        // 3. Crear el Jugador en el centro de la ciudad (Cruce Principal)
        this.player = new Player(this, 640, 420);

        // Configurar colisión física entre el jugador y las paredes/edificios
        this.physics.add.collider(this.sprite || this.player.sprite, this.cityMap.colliders);

        // 4. Gestor de Entradas Teclado (PC) y Joystick Táctil (Móviles)
        this.inputManager = new InputManager(this);
        this.mobileControls = new MobileControls(this, this.inputManager);

        // 5. Configurar Cámara Suave centrada en el personaje
        this.cameras.main.setBounds(0, 0, this.cityMap.cols * this.cityMap.tileSize, this.cityMap.rows * this.cityMap.tileSize);
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.1);

        // 6. Configurar Interfaz HUD Superior
        this.createHUD();

        // 7. Zona de Notificación de Sonido Activo
        this.currentActiveSound = 'Ninguno (Camina por la ciudad)';
        this.toastTimer = null;
    }

    update() {
        if (!this.player) return;

        // Leer entradas y mover al personaje
        const inputVector = this.inputManager.getInputVector();
        this.player.move(inputVector);

        // Comprobar si el jugador está dentro de alguna de las 4 zonas de audio
        this.checkTriggerZones();
    }

    /**
     * Revisa la superposición (Overlap) del jugador con las 4 zonas urbanas
     */
    checkTriggerZones() {
        const playerPos = this.player.getPosition();

        this.cityMap.triggerZones.forEach(zone => {
            const left = zone.x - zone.width / 2;
            const right = zone.x + zone.width / 2;
            const top = zone.y - zone.height / 2;
            const bottom = zone.y + zone.height / 2;

            // Detección de colisión dentro de la caja delimitadora de la zona
            if (playerPos.x >= left && playerPos.x <= right && playerPos.y >= top && playerPos.y <= bottom) {
                this.audioManager.triggerZoneSound(zone, (triggeredZone) => {
                    this.showSoundNotification(triggeredZone);
                });
            }
        });
    }

    /**
     * Muestra un mensaje discreto en pantalla indicando qué sonido fue emitido
     */
    showSoundNotification(zoneData) {
        this.currentActiveSound = zoneData.name;
        this.soundIndicatorText.setText(`AUDIO ACTIVO: ${zoneData.name}`);
        this.soundIndicatorText.setColor('#38bdf8');

        // Banner discreto flotante Toast
        this.toastContainer.setVisible(true);
        this.toastText.setText(`🔔 REPRODUCIENDO: ${zoneData.name}\n(Señal enviada a pulsera háptica)`);

        if (this.toastTimer) this.toastTimer.remove();

        this.toastTimer = this.time.delayedCall(3000, () => {
            this.toastContainer.setVisible(false);
            this.soundIndicatorText.setText(`AUDIO ACTIVO: Ninguno`);
            this.soundIndicatorText.setColor('#94a3b8');
        });
    }

    /**
     * Crea la interfaz gráfica HUD en la parte superior fija de la pantalla
     */
    createHUD() {
        const width = this.cameras.main.width;

        // Grupo HUD fijado a la pantalla (scrollFactor = 0)
        const hudDepth = 200;

        // 1. Barra de estado superior
        const barBg = this.add.rectangle(width / 2, 28, width, 56, 0x0f172a, 0.92)
            .setScrollFactor(0).setDepth(hudDepth).setStrokeStyle(1, 0x334155);

        // Título del Juego HUD
        this.add.text(20, 18, 'HAPTIC CITY', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#38bdf8'
        }).setScrollFactor(0).setDepth(hudDepth + 1);

        // Indicador del Sonido Actual
        this.soundIndicatorText = this.add.text(210, 20, 'AUDIO ACTIVO: Ninguno', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '15px',
            fontWeight: '600',
            color: '#94a3b8'
        }).setScrollFactor(0).setDepth(hudDepth + 1);

        // Botón: REINICIAR POSICIÓN (Derecha)
        const resetBtnBg = this.add.rectangle(width - 240, 28, 110, 34, 0x334155, 1)
            .setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        resetBtnBg.setStrokeStyle(1, 0x64748b);

        const resetBtnLabel = this.add.text(width - 240, 28, '🔄 Reiniciar', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);

        resetBtnBg.on('pointerdown', () => {
            this.player.sprite.setPosition(640, 420);
        });

        // Botón: SILENCIAR AUDIO (Derecha)
        this.isMuted = this.sound.mute;
        const muteBtnBg = this.add.rectangle(width - 110, 28, 120, 34, 0x0284c7, 1)
            .setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        muteBtnBg.setStrokeStyle(1, 0x38bdf8);

        this.muteBtnLabel = this.add.text(width - 110, 28, this.isMuted ? '🔇 Silenciado' : '🔊 Con Sonido', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);

        muteBtnBg.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            this.muteBtnLabel.setText(this.isMuted ? '🔇 Silenciado' : '🔊 Con Sonido');
            muteBtnBg.setFillStyle(this.isMuted ? 0xef4444 : 0x0284c7);
        });

        // 2. Banner de Notificación Flotante Discreta (Toast)
        this.toastContainer = this.add.container(width / 2, 95).setScrollFactor(0).setDepth(hudDepth + 10).setVisible(false);

        const toastBg = this.add.rectangle(0, 0, 440, 46, 0x1e293b, 0.95)
            .setStrokeStyle(2, 0x38bdf8);

        this.toastText = this.add.text(0, 0, '', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            color: '#f8fafc',
            align: 'center'
        }).setOrigin(0.5);

        this.toastContainer.add([toastBg, this.toastText]);
    }
}
