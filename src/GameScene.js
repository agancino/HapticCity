/**
 * GameScene.js
 * Escena principal del juego Haptic City.
 * Integra la ciudad, el personaje, las zonas de disparo de audio continuo, controles y el HUD superior.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Verificación e inicialización de respaldo de texturas
        this.ensureTexturesExist();

        // 2. Instanciar Gestor de Audio
        this.audioManager = new AudioManager(this);

        // 3. Construir el Mapa de la Ciudad
        this.cityMap = new CityMap(this);

        // 4. Crear el Jugador en el centro de la ciudad (Cruce Principal)
        this.player = new Player(this, 640, 420);

        // Configurar colisión física entre el jugador y las paredes/edificios
        this.physics.add.collider(this.player.sprite, this.cityMap.colliders);

        // 5. Gestor de Entradas Teclado (PC) y Joystick Táctil (Móviles)
        this.inputManager = new InputManager(this);
        this.mobileControls = new MobileControls(this, this.inputManager);

        // 6. Configurar Cámara Suave centrada en el personaje
        this.cameras.main.setBounds(0, 0, this.cityMap.cols * this.cityMap.tileSize, this.cityMap.rows * this.cityMap.tileSize);
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.1);

        // 7. Configurar Interfaz HUD Superior
        this.createHUD();

        // 8. Estado del sonido
        this.currentActiveSound = 'Ninguno';
    }

    update() {
        if (!this.player) return;

        // Leer entradas y mover al personaje
        const inputVector = this.inputManager.getInputVector();
        this.player.move(inputVector);

        // Comprobar si el jugador está dentro o fuera de las zonas de audio
        this.checkTriggerZones();
    }

    /**
     * Revisa la posición del jugador respecto a las 4 zonas urbanas.
     * Mantiene el audio activo continuamente mientras permanezca dentro y lo detiene al salir.
     */
    checkTriggerZones() {
        const playerPos = this.player.getPosition();
        let insideAnyZone = false;

        this.cityMap.triggerZones.forEach(zone => {
            const left = zone.x - zone.width / 2;
            const right = zone.x + zone.width / 2;
            const top = zone.y - zone.height / 2;
            const bottom = zone.y + zone.height / 2;

            // Detección de permanencia dentro de la caja delimitadora
            if (playerPos.x >= left && playerPos.x <= right && playerPos.y >= top && playerPos.y <= bottom) {
                insideAnyZone = true;
                this.audioManager.triggerZoneSound(zone, (triggeredZone) => {
                    this.showSoundNotification(triggeredZone);
                });
            }
        });

        // Si el jugador salió de todas las zonas, detener el sonido y limpiar la notificación
        if (!insideAnyZone && this.audioManager.currentZoneId) {
            this.audioManager.stopActiveZoneSound();
            this.clearSoundNotification();
        }
    }

    /**
     * Muestra el estado activo del sonido en la UI
     */
    showSoundNotification(zoneData) {
        this.currentActiveSound = zoneData.name;
        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText(`AUDIO ACTIVO: ${zoneData.name}`);
            this.soundIndicatorText.setColor('#38bdf8');
        }

        if (this.toastContainer && this.toastText) {
            this.toastContainer.setVisible(true);
            this.toastText.setText(`🔔 REPRODUCIENDO: ${zoneData.name}\n(Señal emitida para pulsera háptica)`);
        }
    }

    /**
     * Limpia la notificación al salir de la zona
     */
    clearSoundNotification() {
        if (this.toastContainer) {
            this.toastContainer.setVisible(false);
        }
        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText('AUDIO ACTIVO: Ninguno');
            this.soundIndicatorText.setColor('#94a3b8');
        }
    }

    /**
     * Crea la interfaz gráfica HUD en la parte superior fija de la pantalla
     */
    createHUD() {
        const width = this.cameras.main.width;
        const hudDepth = 200;

        // 1. Barra de estado superior
        const barBg = this.add.rectangle(width / 2, 28, width, 56, 0x0f172a, 0.92)
            .setScrollFactor(0).setDepth(hudDepth).setStrokeStyle(1, 0x334155);

        // Título del Juego HUD
        this.add.text(20, 18, 'HAPTIC CITY', {
            fontFamily: 'monospace, Arial, sans-serif',
            fontSize: '14px',
            color: '#38bdf8'
        }).setScrollFactor(0).setDepth(hudDepth + 1);

        // Indicador del Sonido Actual
        this.soundIndicatorText = this.add.text(210, 20, 'AUDIO ACTIVO: Ninguno', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontWeight: '600',
            color: '#94a3b8'
        }).setScrollFactor(0).setDepth(hudDepth + 1);

        // Botón: REINICIAR POSICIÓN
        const resetBtnBg = this.add.rectangle(width - 240, 28, 110, 34, 0x334155, 1)
            .setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        resetBtnBg.setStrokeStyle(1, 0x64748b);

        this.add.text(width - 240, 28, '🔄 Reiniciar', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);

        resetBtnBg.on('pointerdown', () => {
            this.player.sprite.setPosition(640, 420);
        });

        // Botón: SILENCIAR AUDIO
        this.isMuted = this.sound.mute;
        const muteBtnBg = this.add.rectangle(width - 110, 28, 120, 34, 0x0284c7, 1)
            .setScrollFactor(0).setDepth(hudDepth + 1).setInteractive({ useHandCursor: true });
        muteBtnBg.setStrokeStyle(1, 0x38bdf8);

        this.muteBtnLabel = this.add.text(width - 110, 28, this.isMuted ? '🔇 Silenciado' : '🔊 Con Sonido', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(hudDepth + 2);

        muteBtnBg.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            this.muteBtnLabel.setText(this.isMuted ? '🔇 Silenciado' : '🔊 Con Sonido');
            muteBtnBg.setFillStyle(this.isMuted ? 0xef4444 : 0x0284c7);
        });

        // 2. Banner de Notificación Flotante (Toast)
        this.toastContainer = this.add.container(width / 2, 95).setScrollFactor(0).setDepth(hudDepth + 10).setVisible(false);

        const toastBg = this.add.rectangle(0, 0, 440, 46, 0x1e293b, 0.95)
            .setStrokeStyle(2, 0x38bdf8);

        this.toastText = this.add.text(0, 0, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#f8fafc',
            align: 'center'
        }).setOrigin(0.5);

        this.toastContainer.add([toastBg, this.toastText]);
    }

    ensureTexturesExist() {
        if (!this.textures.exists('tile_grass')) {
            const loading = new LoadingScene();
            loading.textures = this.textures;
            loading.generateProceduralGraphics();
        }
    }
}
