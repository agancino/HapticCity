/**
 * AudioManager.js
 * Gestor centralizado de audio para la reproducción de sonidos urbanos (Hospital, Policía, Bomberos, Bocina).
 * Admite reproducción continua mientras el jugador permanece en la zona, carga de archivos reales .mp3/.wav/.ogg
 * desde assets/sounds/, sintetizador WebAudio sintético como fallback automático y Vibration API.
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.volume = 0.8;
        this.currentZoneId = null;
        this.activePhaserSound = null;
        this.activeSynthInterval = null;

        // Contexto de WebAudio de respaldo para síntesis inmediata
        this.audioCtx = null;
        this.initWebAudioFallback();

        // Pausar audio al cambiar de pestaña
        this.setupTabVisibilityListener();
    }

    initWebAudioFallback() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn('WebAudio no disponible:', e);
        }
    }

    /**
     * Activa el sonido continuo de una zona mientras el jugador permanece en ella
     * @param {Object} zoneData - Datos de la zona { id, name, soundKey }
     * @param {Function} onSoundTriggeredCallback - Callback para notificar a la UI
     */
    triggerZoneSound(zoneData, onSoundTriggeredCallback) {
        // Si el jugador ya se encuentra en esta misma zona y el audio está sonando, no reiniciar
        if (this.currentZoneId === zoneData.id) {
            return;
        }

        // Detener cualquier sonido activo de la zona anterior
        this.stopActiveZoneSound();

        this.currentZoneId = zoneData.id;

        // Intentar reproducir archivo local .mp3 / .wav / .ogg si fue precargado por el usuario
        let playedSuccessfully = false;
        if (this.scene.cache.audio.exists(zoneData.soundKey)) {
            try {
                this.activePhaserSound = this.scene.sound.add(zoneData.soundKey, {
                    volume: this.volume,
                    loop: true // Mantener el sonido sonando continuamente mientras el usuario está en la zona
                });
                this.activePhaserSound.play();
                playedSuccessfully = true;
            } catch (e) {
                console.warn('Error al reproducir audio de Phaser:', e);
            }
        }

        // Si el archivo nativo aún no existe en assets/sounds/, usar sintetizador WebAudio en bucle
        if (!playedSuccessfully && this.audioCtx) {
            this.playSyntheticAudioLoop(zoneData.id);
        }

        // Feedback de vibración háptica opcional en celulares
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            try {
                navigator.vibrate([150, 80, 150]);
            } catch (err) {}
        }

        if (onSoundTriggeredCallback) {
            onSoundTriggeredCallback(zoneData);
        }
    }

    /**
     * Detiene el sonido actual inmediatamente cuando el jugador sale de la zona
     */
    stopActiveZoneSound() {
        this.currentZoneId = null;

        // Detener sonido de Phaser
        if (this.activePhaserSound) {
            try {
                this.activePhaserSound.stop();
                this.activePhaserSound.destroy();
            } catch (e) {}
            this.activePhaserSound = null;
        }

        // Detener bucle sintético de WebAudio
        if (this.activeSynthInterval) {
            clearInterval(this.activeSynthInterval);
            this.activeSynthInterval = null;
        }
    }

    /**
     * Generador sintético de audio continuo para cuando aún no hay archivos .mp3 subidos
     */
    playSyntheticAudioLoop(type) {
        // Ejecutar inmediatamente el primer pulso
        this.playSyntheticPulse(type);

        // Repetir continuamente mientras el jugador siga en la zona
        const intervalTime = type === 'intersection' ? 1200 : 2500;
        this.activeSynthInterval = setInterval(() => {
            if (this.currentZoneId) {
                this.playSyntheticPulse(type);
            } else {
                clearInterval(this.activeSynthInterval);
                this.activeSynthInterval = null;
            }
        }, intervalTime);
    }

    playSyntheticPulse(type) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const masterGain = this.audioCtx.createGain();
        masterGain.gain.setValueAtTime(this.volume, now);
        masterGain.connect(this.audioCtx.destination);

        if (type === 'hospital') {
            // 🚑 Sirena de Ambulancia (Modulación continuo 600Hz <-> 900Hz)
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(900, now + 0.7);
            osc.frequency.linearRampToValueAtTime(600, now + 1.4);
            osc.frequency.linearRampToValueAtTime(900, now + 2.1);
            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2.3);

            osc.connect(masterGain);
            osc.start(now);
            osc.stop(now + 2.3);

        } else if (type === 'police') {
            // 🚓 Sirena de Policía (Agudos rápidos)
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sawtooth';
            for (let i = 0; i < 4; i++) {
                const step = now + i * 0.4;
                osc.frequency.setValueAtTime(700, step);
                osc.frequency.linearRampToValueAtTime(1400, step + 0.35);
            }
            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

            osc.connect(masterGain);
            osc.start(now);
            osc.stop(now + 1.8);

        } else if (type === 'fire') {
            // 🚒 Sirena de Bomberos (Tono grave de advertencia)
            const osc = this.audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.linearRampToValueAtTime(550, now + 1.1);
            osc.frequency.linearRampToValueAtTime(350, now + 2.2);
            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2.3);

            osc.connect(masterGain);
            osc.start(now);
            osc.stop(now + 2.3);

        } else if (type === 'intersection') {
            // 🚗 Bocina de Auto
            const osc1 = this.audioCtx.createOscillator();
            const osc2 = this.audioCtx.createOscillator();
            osc1.type = 'square';
            osc2.type = 'square';
            osc1.frequency.setValueAtTime(400, now);
            osc2.frequency.setValueAtTime(500, now);

            masterGain.gain.setValueAtTime(this.volume * 0.35, now);
            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

            osc1.connect(masterGain);
            osc2.connect(masterGain);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.6);
            osc2.stop(now + 0.6);
        }
    }

    setVolume(value) {
        this.volume = Phaser.Math.Clamp(value, 0, 1);
        this.scene.sound.volume = this.volume;
    }

    setupTabVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopActiveZoneSound();
                this.scene.sound.pauseAll();
            } else {
                this.scene.sound.resumeAll();
            }
        });
    }
}
