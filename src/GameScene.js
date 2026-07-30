/**
 * GameScene.js — Haptic City v2
 * Sistema de encuentros aleatorios: mientras el personaje pedalea por la ciudad,
 * un sonido aparece aleatoriamente, el personaje se congela, escucha el sonido
 * durante 10 segundos, y luego aparece un quiz de 4 opciones para adivinar qué fue.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.on('loaderror', () => {});
        this.load.audio('sound_ambulance', ['assets/sounds/ambulance.mp3', 'assets/sounds/ambulance.ogg', 'assets/sounds/ambulance.wav']);
        this.load.audio('sound_police', ['assets/sounds/police.mp3', 'assets/sounds/police.ogg', 'assets/sounds/police.wav']);
        this.load.audio('sound_fire', ['assets/sounds/fire.mp3', 'assets/sounds/fire.ogg', 'assets/sounds/fire.wav']);
        this.load.audio('sound_horn', ['assets/sounds/horn.mp3', 'assets/sounds/horn.ogg', 'assets/sounds/horn.wav']);
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.ensureTexturesExist();

        // Audio Manager
        this.audioManager = new AudioManager(this);

        // Mapa de la Ciudad (sin zonas visibles)
        this.cityMap = new CityMap(this);

        // Jugador (persona en bicicleta)
        this.player = new Player(this, 640, 400);
        this.physics.add.collider(this.player.sprite, this.cityMap.colliders);

        // Controles
        this.inputManager = new InputManager(this);
        this.mobileControls = new MobileControls(this, this.inputManager);

        // Cámara
        this.cameras.main.setBounds(0, 0, this.cityMap.cols * this.cityMap.tileSize, this.cityMap.rows * this.cityMap.tileSize);
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.0);

        // ══════ ESTADO DEL SISTEMA DE ENCUENTROS ALEATORIOS ══════
        this.isPlayerFrozen = false;
        this.quizActive = false;
        this.currentQuizSound = null;
        this.score = 0;
        this.totalAttempts = 0;
        this.playerIsMoving = false;
        this.movingTime = 0;   // Tiempo acumulado que el jugador lleva caminando (ms)
        this.nextEncounterTime = this.getRandomEncounterDelay(); // Siguiente encuentro (ms)

        // HUD
        this.createHUD();

        // Quiz UI (oculto al inicio)
        this.createQuizUI();

        // Overlay de "Escucha atentamente"
        this.createListeningOverlay();
    }

    update(time, delta) {
        if (!this.player) return;

        if (this.isPlayerFrozen) {
            // Personaje congelado — no responder a input
            this.player.sprite.setVelocity(0, 0);
            return;
        }

        // Leer entradas y mover al personaje
        const inputVector = this.inputManager.getInputVector();
        this.player.move(inputVector);

        // Detectar si el jugador se está moviendo
        const isMovingNow = (Math.abs(inputVector.x) > 0.1 || Math.abs(inputVector.y) > 0.1);

        if (isMovingNow) {
            this.movingTime += delta;

            // Cada 15 segundos caminando, verificar si está en la calle para activar encuentro
            if (this.movingTime >= this.nextEncounterTime && this.isPlayerOnRoad()) {
                this.triggerRandomEncounter();
            }
        }
    }

    /**
     * Tiempo fijo de 15 segundos entre encuentros
     */
    getRandomEncounterDelay() {
        return 15000; // 15 segundos
    }

    /**
     * Verifica si el personaje está sobre una calle (tile de asfalto).
     * Calles horizontales: filas 11-12 | Calles verticales: columnas 19-20
     */
    isPlayerOnRoad() {
        const pos = this.player.getPosition();
        const tileSize = 32;
        const col = Math.floor(pos.x / tileSize);
        const row = Math.floor(pos.y / tileSize);

        // Calle horizontal (filas 11 y 12)
        const onHorizontalRoad = (row === 11 || row === 12);
        // Calle vertical (columnas 19 y 20)
        const onVerticalRoad = (col === 19 || col === 20);

        return onHorizontalRoad || onVerticalRoad;
    }

    /**
     * PASO 1: Congelar al personaje y reproducir un sonido aleatorio
     */
    triggerRandomEncounter() {
        if (this.isPlayerFrozen || this.quizActive) return;

        this.isPlayerFrozen = true;
        this.movingTime = 0;
        this.player.sprite.setVelocity(0, 0);

        // Reproducir sonido aleatorio y guardar la respuesta correcta
        this.currentQuizSound = this.audioManager.playRandomSound();

        // Mostrar overlay de escucha
        this.showListeningOverlay();

        // Actualizar HUD
        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText('🔔 ¡ESCUCHA ATENTAMENTE!');
            this.soundIndicatorText.setColor('#facc15');
        }

        // PASO 2: Después de 10 segundos, detener sonido y mostrar quiz
        this.time.delayedCall(10000, () => {
            this.audioManager.stopActiveSound();
            this.hideListeningOverlay();
            this.showQuiz();
        });
    }

    /**
     * PASO 2: Mostrar el quiz con las 4 opciones
     */
    showQuiz() {
        this.quizActive = true;
        this.quizContainer.setVisible(true);

        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText('❓ ¿QUÉ SONIDO FUE?');
            this.soundIndicatorText.setColor('#38bdf8');
        }
    }

    /**
     * PASO 3: Procesar la respuesta del jugador
     */
    handleQuizAnswer(chosenId) {
        if (!this.quizActive || !this.currentQuizSound) return;

        this.quizActive = false;
        this.totalAttempts++;
        const isCorrect = (chosenId === this.currentQuizSound.id);

        if (isCorrect) {
            this.score++;
            this.showFeedback(true, this.currentQuizSound.label);
        } else {
            this.showFeedback(false, this.currentQuizSound.label);
        }

        // Actualizar marcador
        if (this.scoreText) {
            this.scoreText.setText(`✅ ${this.score} / ${this.totalAttempts}`);
        }

        // Ocultar quiz
        this.quizContainer.setVisible(false);

        // PASO 4: Descongelar después de 2.5 segundos
        this.time.delayedCall(2500, () => {
            this.hideFeedback();
            this.isPlayerFrozen = false;
            this.nextEncounterTime = this.getRandomEncounterDelay();
            this.movingTime = 0;

            if (this.soundIndicatorText) {
                this.soundIndicatorText.setText('🚲 Sigue pedaleando...');
                this.soundIndicatorText.setColor('#22c55e');
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    //  INTERFAZ DE USUARIO (HUD + Quiz + Feedback + Listening)
    // ══════════════════════════════════════════════════════════════

    createHUD() {
        const width = this.cameras.main.width;
        const hudDepth = 200;
        const BAR_H = 52;
        const BAR_Y = BAR_H / 2;

        this.add.rectangle(width / 2, BAR_Y, width, BAR_H, 0x0a0f1e, 0.93)
            .setScrollFactor(0).setDepth(hudDepth).setStrokeStyle(1, 0x1e3a5f);

        this.add.text(14, BAR_Y, 'HAPTIC CITY', {
            fontFamily: 'monospace',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0, 0.5);

        this.soundIndicatorText = this.add.text(180, BAR_Y, '🚲 Sigue pedaleando...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#22c55e'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0, 0.5);

        // Marcador de puntuación
        this.scoreText = this.add.text(width - 120, BAR_Y, '✅ 0 / 0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0.5, 0.5);

        // Botón silenciar
        this.isMuted = false;
        const muteBg = this.add.rectangle(width - 40, BAR_Y, 60, 34, 0x0369a1)
            .setScrollFactor(0).setDepth(hudDepth + 1).setStrokeStyle(1, 0x38bdf8)
            .setInteractive({ useHandCursor: true });

        this.muteBtnLabel = this.add.text(width - 40, BAR_Y, '🔊', {
            fontSize: '18px'
        }).setScrollFactor(0).setDepth(hudDepth + 2).setOrigin(0.5, 0.5);

        muteBg.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            if (this.isMuted) this.audioManager.stopActiveSound();
            this.muteBtnLabel.setText(this.isMuted ? '🔇' : '🔊');
            muteBg.setFillStyle(this.isMuted ? 0xdc2626 : 0x0369a1);
        });
    }

    /**
     * Crea el panel de Quiz con 4 botones de respuesta
     */
    createQuizUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudDepth = 300;

        this.quizContainer = this.add.container(width / 2, height / 2)
            .setScrollFactor(0).setDepth(hudDepth).setVisible(false);

        // Fondo semitransparente
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6);

        // Tarjeta del quiz
        const cardW = Math.min(width * 0.85, 420);
        const cardH = 300;
        const card = this.add.rectangle(0, 0, cardW, cardH, 0x0f172a, 0.97)
            .setStrokeStyle(3, 0x38bdf8);

        // Pregunta
        const questionText = this.add.text(0, -110, '🎧 ¿Qué sonido escuchaste?', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#f0f9ff',
            align: 'center'
        }).setOrigin(0.5);

        this.quizContainer.add([overlay, card, questionText]);

        // 4 Botones de respuesta
        const options = [
            { id: 'ambulance', label: '🚑 Ambulancia', y: -50 },
            { id: 'police',    label: '🚓 Policía',    y: 0   },
            { id: 'fire',      label: '🚒 Bomberos',   y: 50  },
            { id: 'horn',      label: '🚗 Claxon',     y: 100 }
        ];

        options.forEach(opt => {
            const btnW = Math.min(cardW - 40, 320);
            const btnBg = this.add.rectangle(0, opt.y, btnW, 40, 0x1e293b)
                .setStrokeStyle(2, 0x475569)
                .setInteractive({ useHandCursor: true });

            const btnText = this.add.text(0, opt.y, opt.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#e2e8f0'
            }).setOrigin(0.5);

            // Hover effects
            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x334155);
                btnBg.setStrokeStyle(2, 0x38bdf8);
            });
            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0x1e293b);
                btnBg.setStrokeStyle(2, 0x475569);
            });

            // Click / Touch
            btnBg.on('pointerdown', () => {
                this.handleQuizAnswer(opt.id);
            });

            this.quizContainer.add([btnBg, btnText]);
        });
    }

    /**
     * Overlay "¡Escucha atentamente!" mientras el sonido se reproduce
     */
    createListeningOverlay() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudDepth = 250;

        this.listeningContainer = this.add.container(width / 2, height / 2)
            .setScrollFactor(0).setDepth(hudDepth).setVisible(false);

        const bgOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.45);

        const cardW = Math.min(width * 0.8, 400);
        const cardBg = this.add.rectangle(0, 0, cardW, 130, 0x0f172a, 0.95)
            .setStrokeStyle(3, 0xfacc15);

        const iconText = this.add.text(0, -30, '🔔', {
            fontSize: '36px'
        }).setOrigin(0.5);

        const mainText = this.add.text(0, 15, '¡Escucha atentamente!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#facc15',
            align: 'center'
        }).setOrigin(0.5);

        const subText = this.add.text(0, 45, 'El sonido se reproduce durante 10 segundos...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#94a3b8',
            align: 'center'
        }).setOrigin(0.5);

        this.listeningContainer.add([bgOverlay, cardBg, iconText, mainText, subText]);
    }

    showListeningOverlay() {
        if (this.listeningContainer) this.listeningContainer.setVisible(true);
    }

    hideListeningOverlay() {
        if (this.listeningContainer) this.listeningContainer.setVisible(false);
    }

    /**
     * Muestra el feedback visual después de responder el quiz
     */
    showFeedback(isCorrect, correctLabel) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudDepth = 310;

        if (this.feedbackContainer) {
            this.feedbackContainer.destroy();
        }

        this.feedbackContainer = this.add.container(width / 2, height / 2)
            .setScrollFactor(0).setDepth(hudDepth);

        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);

        const cardW = Math.min(width * 0.8, 380);
        const borderColor = isCorrect ? 0x22c55e : 0xef4444;
        const cardBg = this.add.rectangle(0, 0, cardW, 120, 0x0f172a, 0.97)
            .setStrokeStyle(3, borderColor);

        const emoji = isCorrect ? '✅' : '❌';
        const message = isCorrect
            ? '¡CORRECTO!'
            : `INCORRECTO`;
        const detail = isCorrect
            ? `Era: ${correctLabel}`
            : `Era: ${correctLabel}`;

        const emojiText = this.add.text(0, -30, emoji, {
            fontSize: '32px'
        }).setOrigin(0.5);

        const msgText = this.add.text(0, 5, message, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: isCorrect ? '#22c55e' : '#ef4444'
        }).setOrigin(0.5);

        const detailText = this.add.text(0, 35, detail, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.feedbackContainer.add([bg, cardBg, emojiText, msgText, detailText]);
    }

    hideFeedback() {
        if (this.feedbackContainer) {
            this.feedbackContainer.destroy();
            this.feedbackContainer = null;
        }
    }

    ensureTexturesExist() {
        if (!this.textures.exists('tile_grass')) {
            const loading = new LoadingScene();
            loading.textures = this.textures;
            loading.generateProceduralGraphics();
        }
    }
}
