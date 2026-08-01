/**
 * GameScene.js — Haptic City v2 (Autocontrol + 7s Encuentros + 3 Opciones Quiz)
 * - El personaje avanza AUTOMÁTICAMENTE por las calles de la ciudad.
 * - Cada 7 segundos de recorrido, se detiene durante 7 segundos exactos para escuchar el sonido.
 * - Quiz: "¿Qué sonido crees que sentiste?" con opciones: Claxon, Sirena, Alarma.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.on('loaderror', () => {});
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.ensureTexturesExist();

        // 1. Audio Manager
        this.audioManager = new AudioManager(this);

        // 2. Mapa
        this.cityMap = new CityMap(this);

        // 3. Jugador en Bicicleta
        this.player = new Player(this, 640, 400);
        this.physics.add.collider(this.player.sprite, this.cityMap.colliders);

        // 4. Entradas (manuales + auto)
        this.inputManager = new InputManager(this);
        this.mobileControls = new MobileControls(this, this.inputManager);

        // 5. Cámara
        this.cameras.main.setBounds(0, 0, this.cityMap.cols * this.cityMap.tileSize, this.cityMap.rows * this.cityMap.tileSize);
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.0);

        // 6. Ruta de patrullaje automático (puntos de control en las calles)
        this.waypoints = [
            { x: 640, y: 400 }, // Centro
            { x: 1000, y: 400 }, // Calle Este
            { x: 1000, y: 700 }, // Sureste
            { x: 640, y: 700 },  // Sur Centro
            { x: 200, y: 700 },  // Suroeste
            { x: 200, y: 400 },  // Oeste
            { x: 200, y: 100 },  // Noroeste
            { x: 640, y: 100 },  // Norte
            { x: 1000, y: 100 }  // Noreste
        ];
        this.currentWaypointIndex = 0;

        // 7. Estado del juego
        this.isPlayerFrozen = false;
        this.quizActive = false;
        this.currentQuizSound = null;
        this.score = 0;
        this.totalAttempts = 0;
        this.movingTime = 0;
        this.encounterInterval = 7000; // 7 segundos recorriendo

        // UI
        this.createHUD();
        this.createQuizUI();
        this.createListeningOverlay();
    }

    update(time, delta) {
        if (!this.player) return;

        // Si está congelado o respondiendo el quiz, detener movimiento
        if (this.isPlayerFrozen || this.quizActive) {
            this.player.sprite.setVelocity(0, 0);
            return;
        }

        // --- MOVIMIENTO AUTOMÁTICO DEL PERSONAJE ---
        const manualInput = this.inputManager.getInputVector();
        let moveVector = { x: 0, y: 0 };

        if (Math.abs(manualInput.x) > 0.1 || Math.abs(manualInput.y) > 0.1) {
            // Si el usuario usa controles manuales, respetar su entrada
            moveVector = manualInput;
        } else {
            // Autocontrol: navegar hacia el siguiente punto de la calle
            const targetWP = this.waypoints[this.currentWaypointIndex];
            const pos = this.player.getPosition();
            const dx = targetWP.x - pos.x;
            const dy = targetWP.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                // Llegó al punto, avanzar al siguiente waypoint
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
            } else {
                moveVector = { x: dx / dist, y: dy / dist };
            }
        }

        this.player.move(moveVector);

        // Contar 7 segundos de recorrido para el próximo encuentro
        this.movingTime += delta;
        if (this.movingTime >= this.encounterInterval) {
            this.triggerRandomEncounter();
        }
    }

    /**
     * PASO 1: Detener al personaje durante 7 segundos y reproducir sonido
     */
    triggerRandomEncounter() {
        if (this.isPlayerFrozen || this.quizActive) return;

        this.isPlayerFrozen = true;
        this.movingTime = 0;
        this.player.sprite.setVelocity(0, 0);

        // Reproducir sonido aleatorio (Claxon, Sirena o Alarma)
        this.currentQuizSound = this.audioManager.playRandomSound();

        this.showListeningOverlay();

        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText('🔔 ESCUCHANDO... (7 seg)');
            this.soundIndicatorText.setColor('#facc15');
        }

        // PASO 2: Exactamente después de 7 segundos de escucha, pasar al Quiz
        this.time.delayedCall(7000, () => {
            this.audioManager.stopActiveSound();
            this.hideListeningOverlay();
            this.showQuiz();
        });
    }

    /**
     * PASO 2: Mostrar el Quiz con la pregunta y 3 opciones
     */
    showQuiz() {
        this.quizActive = true;
        this.quizContainer.setVisible(true);

        if (this.soundIndicatorText) {
            this.soundIndicatorText.setText('❓ RESPONDER QUIZ');
            this.soundIndicatorText.setColor('#38bdf8');
        }
    }

    /**
     * PASO 3: Procesar respuesta
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

        if (this.scoreText) {
            this.scoreText.setText(`✅ ${this.score} / ${this.totalAttempts}`);
        }

        this.quizContainer.setVisible(false);

        // Reanudar autocontrol después de 2 segundos
        this.time.delayedCall(2000, () => {
            this.hideFeedback();
            this.isPlayerFrozen = false;
            this.movingTime = 0;

            if (this.soundIndicatorText) {
                this.soundIndicatorText.setText('🤖 Autocontrol activado...');
                this.soundIndicatorText.setColor('#22c55e');
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    //  UI (HUD + QUIZ 3 OPCIONES + OVERLAY 7S)
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

        this.soundIndicatorText = this.add.text(160, BAR_Y, '🤖 Autocontrol activado...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#22c55e'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0, 0.5);

        this.scoreText = this.add.text(width - 120, BAR_Y, '✅ 0 / 0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setScrollFactor(0).setDepth(hudDepth + 1).setOrigin(0.5, 0.5);

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

    createQuizUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudDepth = 300;

        this.quizContainer = this.add.container(width / 2, height / 2)
            .setScrollFactor(0).setDepth(hudDepth).setVisible(false);

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.65);

        const cardW = Math.min(width * 0.88, 400);
        const cardH = 260;
        const card = this.add.rectangle(0, 0, cardW, cardH, 0x0f172a, 0.98)
            .setStrokeStyle(3, 0x38bdf8);

        // Pregunta Exacta Requerida
        const questionText = this.add.text(0, -90, '¿Qué sonido crees que sentiste?', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#f0f9ff',
            align: 'center'
        }).setOrigin(0.5);

        this.quizContainer.add([overlay, card, questionText]);

        // SOLO 3 OPCIONES: Claxon, Sirena, Alarma
        const options = [
            { id: 'horn',  label: '🚗 Claxon', y: -30 },
            { id: 'siren', label: '🚨 Sirena', y: 25 },
            { id: 'alarm', label: '⏰ Alarma', y: 80 }
        ];

        options.forEach(opt => {
            const btnW = Math.min(cardW - 40, 320);
            const btnBg = this.add.rectangle(0, opt.y, btnW, 42, 0x1e293b)
                .setStrokeStyle(2, 0x38bdf8)
                .setInteractive({ useHandCursor: true });

            const btnText = this.add.text(0, opt.y, opt.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffffff'
            }).setOrigin(0.5);

            btnBg.on('pointerover', () => btnBg.setFillStyle(0x0284c7));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x1e293b));
            btnBg.on('pointerdown', () => this.handleQuizAnswer(opt.id));

            this.quizContainer.add([btnBg, btnText]);
        });
    }

    createListeningOverlay() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudDepth = 250;

        this.listeningContainer = this.add.container(width / 2, height / 2)
            .setScrollFactor(0).setDepth(hudDepth).setVisible(false);

        const bgOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.45);
        const cardW = Math.min(width * 0.82, 380);
        const cardBg = this.add.rectangle(0, 0, cardW, 120, 0x0f172a, 0.95)
            .setStrokeStyle(3, 0xfacc15);

        const iconText = this.add.text(0, -28, '🔔', { fontSize: '34px' }).setOrigin(0.5);
        const mainText = this.add.text(0, 12, '¡Escuchando Sonido!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#facc15'
        }).setOrigin(0.5);
        const subText = this.add.text(0, 40, 'Escucha atenta durante 7 segundos...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.listeningContainer.add([bgOverlay, cardBg, iconText, mainText, subText]);
    }

    showListeningOverlay() {
        if (this.listeningContainer) this.listeningContainer.setVisible(true);
    }

    hideListeningOverlay() {
        if (this.listeningContainer) this.listeningContainer.setVisible(false);
    }

    showFeedback(isCorrect, correctLabel) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudDepth = 310;

        if (this.feedbackContainer) this.feedbackContainer.destroy();

        this.feedbackContainer = this.add.container(width / 2, height / 2)
            .setScrollFactor(0).setDepth(hudDepth);

        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);
        const cardW = Math.min(width * 0.8, 360);
        const borderColor = isCorrect ? 0x22c55e : 0xef4444;
        const cardBg = this.add.rectangle(0, 0, cardW, 110, 0x0f172a, 0.97)
            .setStrokeStyle(3, borderColor);

        const emoji = isCorrect ? '✅' : '❌';
        const msgText = this.add.text(0, -10, isCorrect ? '¡CORRECTO!' : 'INCORRECTO', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: isCorrect ? '#22c55e' : '#ef4444'
        }).setOrigin(0.5);

        const detailText = this.add.text(0, 25, `Era: ${correctLabel}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.feedbackContainer.add([bg, cardBg, msgText, detailText]);
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

window.GameScene = GameScene;
