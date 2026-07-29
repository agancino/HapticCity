/**
 * GameScene.js
 * Escena principal del juego Haptic City.
 * Integra la ciudad, el personaje, las zonas de disparo de audio continuo, controles y el HUD.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // =====================================================================
        // CARGAR ARCHIVOS DE AUDIO REALES DEL USUARIO
        // Coloca tus archivos en la carpeta assets/sounds/ con estos nombres:
        //   - ambulance.mp3  (o .wav o .ogg) → Zona Hospital
        //   - police.mp3     (o .wav o .ogg) → Zona Policía
        //   - fire.mp3       (o .wav o .ogg) → Zona Bomberos
        //   - horn.mp3       (o .wav o .ogg) → Cruce Principal
        // =====================================================================
        this.load.on('loaderror', () => {}); // Ignorar errores si aún no hay archivos

        this.load.audio('sound_ambulance', [
            'assets/sounds/ambulance.mp3',
            'assets/sounds/ambulance.ogg',
            'assets/sounds/ambulance.wav'
        ]);
        this.load.audio('sound_police', [
            'assets/sounds/police.mp3',
            'assets/sounds/police.ogg',
            'assets/sounds/police.wav'
        ]);
        this.load.audio('sound_fire', [
            'assets/sounds/fire.mp3',
            'assets/sounds/fire.ogg',
            'assets/sounds/fire.wav'
        ]);
        this.load.audio('sound_horn', [
            'assets/sounds/horn.mp3',
            'assets/sounds/horn.ogg',
            'assets/sounds/horn.wav'
        ]);
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

        // 4. Crear el Jugador en el centro del mapa
        this.player = new Player(this, 640, 400);

        // Configurar colisión física
        this.physics.add.collider(this.player.sprite, this.cityMap.colliders);

        // 5. Gestor de Entradas Teclado (PC) y Joystick Táctil (Móviles)
        this.inputManager = new InputManager(this);
        this.mobileControls = new MobileControls(this, this.inputManager);

        // 6. Cámara suave centrada en el personaje
        this.cameras.main.setBounds(0, 0, this.cityMap.cols * this.cityMap.tileSize, this.cityMap.rows * this.cityMap.tileSize);
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.0);

        // 7. HUD
        this.createHUD();

        // 8. Estado del sonido
        this.currentActiveZoneId = null;
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
        let insideZone = null;

        for (const zone of this.cityMap.triggerZones) {
            const left = zone.x - zone.width / 2;
            const right = zone.x + zone.width / 2;
            const top = zone.y - zone.height / 2;
            const bottom = zone.y + zone.height / 2;

            if (playerPos.x >= left && playerPos.x <= right && playerPos.y >= top && playerPos.y <= bottom) {
                insideZone = zone;
                break;
            }
        }

        if (insideZone) {
            // Activar audio de esta zona (AudioManager evita reiniciar si ya está sonando)
            this.audioManager.triggerZoneSound(insideZone, (triggeredZone) => {
                this.showSoundNotification(triggeredZone);
            });
        } else {
            // El jugador salió de todas las zonas → detener audio y limpiar HUD
            if (this.audioManager.currentZoneId) {
                this.audioManager.stopActiveZoneSound();
                this.clearSoundNotification();
            }
        }
    }

    showSoundNotification(zoneData) {
        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText(`AUDIO: ${zoneData.name}`);
            this.soundIndicatorText.setColor('#38bdf8');
        }
        if (this.toastContainer && this.toastText) {
            this.toastContainer.setVisible(true);
            this.toastText.setText(`🔔 ${zoneData.name}  |  Señal enviada a pulsera háptica`);
        }
    }

    clearSoundNotification() {
        if (this.toastContainer) {
            this.toastContainer.setVisible(false);
        }
        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText('AUDIO: Ninguno — Camina hacia un edificio');
            this.soundIndicatorText.setColor('#64748b');
        }
    }

    /**
     * Crea el HUD fijo en la parte superior de la pantalla
     * Los botones se colocan en la franja superior y son siempre visibles
     */
    createHUD() {
        const width = this.cameras.main.width;
        const hudDepth = 200;
        const BAR_H = 52;
        const BAR_Y = BAR_H / 2;

        // Fondo de la barra HUD
        this.add.rectangle(width / 2, BAR_Y, width, BAR_H, 0x0a0f1e, 0.93)
            .setScrollFactor(0).setDepth(hudDepth)
            .setStrokeStyle(1, 0x1e3a5f);

        // Título
        this.add.text(14, BAR_Y - 8, 'HAPTIC CITY', {
            fontFamily: 'monospace',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0, 0.5);

        // Indicador de sonido activo (centro-izquierda)
        this.soundIndicatorText = this.add.text(180, BAR_Y, 'AUDIO: Ninguno — Camina hacia un edificio', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#64748b'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0, 0.5);

        // ── BOTÓN REINICIAR ──
        const BTN_W = 108;
        const BTN_H = 34;
        const resetX = width - 240;

        const resetBg = this.add.rectangle(resetX, BAR_Y, BTN_W, BTN_H, 0x334155)
            .setScrollFactor(0).setDepth(hudDepth + 1)
            .setStrokeStyle(1, 0x64748b)
            .setInteractive({ useHandCursor: true });

        this.add.text(resetX, BAR_Y, '↩ Reiniciar', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#f1f5f9'
        }).setScrollFactor(0).setDepth(hudDepth + 2).setOrigin(0.5, 0.5);

        resetBg.on('pointerover', () => resetBg.setFillStyle(0x475569));
        resetBg.on('pointerout', () => resetBg.setFillStyle(0x334155));
        resetBg.on('pointerdown', () => {
            this.audioManager.stopActiveZoneSound();
            this.clearSoundNotification();
            this.player.sprite.setPosition(640, 400);
            this.cameras.main.pan(640, 400, 300, 'Power2');
        });

        // ── BOTÓN SILENCIAR ──
        this.isMuted = false;
        const muteX = width - 110;

        const muteBg = this.add.rectangle(muteX, BAR_Y, BTN_W, BTN_H, 0x0369a1)
            .setScrollFactor(0).setDepth(hudDepth + 1)
            .setStrokeStyle(1, 0x38bdf8)
            .setInteractive({ useHandCursor: true });

        this.muteBtnLabel = this.add.text(muteX, BAR_Y, '🔊 Sonido ON', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#f0f9ff'
        }).setScrollFactor(0).setDepth(hudDepth + 2).setOrigin(0.5, 0.5);

        muteBg.on('pointerover', () => muteBg.setFillStyle(this.isMuted ? 0xb91c1c : 0x0284c7));
        muteBg.on('pointerout', () => muteBg.setFillStyle(this.isMuted ? 0xdc2626 : 0x0369a1));
        muteBg.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            if (this.isMuted) {
                this.audioManager.stopActiveZoneSound();
            }
            this.muteBtnLabel.setText(this.isMuted ? '🔇 Silenciado' : '🔊 Sonido ON');
            muteBg.setFillStyle(this.isMuted ? 0xdc2626 : 0x0369a1);
        });

        // Toast de notificación
        this.toastContainer = this.add.container(width / 2, BAR_H + 26)
            .setScrollFactor(0).setDepth(hudDepth + 10).setVisible(false);

        const toastBg = this.add.rectangle(0, 0, Math.min(width * 0.8, 520), 38, 0x0f172a, 0.97)
            .setStrokeStyle(2, 0x38bdf8);

        this.toastText = this.add.text(0, 0, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#e0f2fe',
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
