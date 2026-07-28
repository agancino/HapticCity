/**
 * AudioManager.js
 * Gestor centralizado de audio para la reproducción de sonidos urbanos (Hospital, Policía, Bomberos, Bocina).
 * Incluye temporizadores de enfriamiento (cooldown), sintetizador WebAudio como fallback automático,
 * control de volumen, eventos de cambio de pestaña y soporte opcional para Vibration API.
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.volume = 0.8;
        this.cooldowns = {}; // Registro de marcas de tiempo de enfriamiento por zona
        this.cooldownDuration = 4500; // 4.5 segundos de enfriamiento entre reproducciones
        this.activeSound = null;

        // Contexto de WebAudio de respaldo para sintesis inmediata
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
     * Intenta reproducir el sonido asociado a una zona si no está en período de enfriamiento
     * @param {Object} zoneData - Datos de la zona { id, name, soundKey }
     * @param {Function} onSoundTriggeredCallback - Callback para notificar a la UI
     */
    triggerZoneSound(zoneData, onSoundTriggeredCallback) {
        const now = Date.now();
        const lastPlay = this.cooldowns[zoneData.id] || 0;

        // Verificar si la zona está en cooldown
        if (now - lastPlay < this.cooldownDuration) {
            return false;
        }

        // Registrar nueva marca de tiempo
        this.cooldowns[zoneData.id] = now;

        // Reproducir sonido (Phaser Audio o Sintetizador WebAudio Fallback)
        let playedSuccessfully = false;

        if (this.scene.cache.audio.exists(zoneData.soundKey)) {
            try {
                this.scene.sound.play(zoneData.soundKey, { volume: this.volume });
                playedSuccessfully = true;
            } catch (e) {
                console.warn('Error al reproducir audio de Phaser:', e);
            }
        }

        // Si el archivo no existía, usar sintetizador WebAudio sintético de alta precisión
        if (!playedSuccessfully && this.audioCtx) {
            this.playSyntheticAudio(zoneData.id);
        }

        // Ejecutar vibración háptica opcional en dispositivos móviles compatibles
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            try {
                navigator.vibrate([120, 60, 120]);
            } catch (err) {
                // Silencioso si el navegador restringe la vibración
            }
        }

        // Notificar a la UI
        if (onSoundTriggeredCallback) {
            onSoundTriggeredCallback(zoneData);
        }

        return true;
    }

    /**
     * Generador de sintetizador de audio urbano para demostración out-of-the-box
     */
    playSyntheticAudio(type) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const masterGain = this.audioCtx.createGain();
        masterGain.gain.setValueAtTime(this.volume, now);
        masterGain.connect(this.audioCtx.destination);

        if (type === 'hospital') {
            // 🚑 Sirena de Ambulancia (Frecuencia modulada de dos tonos: 600Hz <-> 900Hz)
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(900, now + 0.6);
            osc.frequency.linearRampToValueAtTime(600, now + 1.2);
            osc.frequency.linearRampToValueAtTime(900, now + 1.8);

            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2.2);

            osc.connect(masterGain);
            osc.start(now);
            osc.stop(now + 2.2);

        } else if (type === 'police') {
            // 🚓 Sirena de Policía (Barrido rápido de agudos: 700Hz -> 1400Hz)
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
            // 🚒 Sirena de Bomberos (Tono grave de advertencia: 350Hz -> 550Hz)
            const osc = this.audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.linearRampToValueAtTime(550, now + 1.0);
            osc.frequency.linearRampToValueAtTime(350, now + 2.0);

            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2.4);

            osc.connect(masterGain);
            osc.start(now);
            osc.stop(now + 2.4);

        } else if (type === 'intersection') {
            // 🚗 Bocina de Auto (Dos osciladores armónicos simultáneos: 400Hz + 500Hz)
            const osc1 = this.audioCtx.createOscillator();
            const osc2 = this.audioCtx.createOscillator();

            osc1.type = 'square';
            osc2.type = 'square';

            osc1.frequency.setValueAtTime(400, now);
            osc2.frequency.setValueAtTime(500, now);

            masterGain.gain.setValueAtTime(this.volume * 0.4, now);
            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

            osc1.connect(masterGain);
            osc2.connect(masterGain);

            osc1.start(now);
            osc2.start(now);

            osc1.stop(now + 0.7);
            osc2.stop(now + 0.7);
        }
    }

    setVolume(value) {
        this.volume = Phaser.Math.Clamp(value, 0, 1);
        this.scene.sound.volume = this.volume;
    }

    setupTabVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.scene.sound.pauseAll();
            } else {
                this.scene.sound.resumeAll();
            }
        });
    }
}
