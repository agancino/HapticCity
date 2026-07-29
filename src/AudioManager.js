/**
 * AudioManager.js
 * Gestor centralizado de audio para la reproducción de sonidos urbanos (Hospital, Policía, Bomberos, Bocina).
 * - Reproduce en bucle (loop) el audio mientras el jugador permanece en la zona.
 * - Detiene el audio inmediatamente cuando el jugador sale de la zona.
 * - Usa archivos reales .mp3 de assets/sounds/ si existen, o sintetizador WebAudio como fallback.
 * - Soporta Vibration API como feedback háptico local en dispositivos móviles.
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.volume = 0.8;
        this.currentZoneId = null;
        this.activePhaserSound = null;

        // Contexto de WebAudio para sintetizador de respaldo
        this.audioCtx = null;
        this.activeSynthInterval = null;
        this.initWebAudioFallback();

        // Pausar audio al minimizar o cambiar de pestaña
        this.setupTabVisibilityListener();
    }

    initWebAudioFallback() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn('[AudioManager] WebAudio no disponible:', e);
        }
    }

    /**
     * Activa la reproducción en bucle del sonido de la zona mientras el jugador permanece en ella.
     * Si ya se estaba reproduciendo el mismo audio, NO lo reinicia (continuidad sin interrupciones).
     * @param {Object} zoneData - { id, name, soundKey }
     * @param {Function} onSoundTriggeredCallback - Callback para actualizar la UI
     */
    triggerZoneSound(zoneData, onSoundTriggeredCallback) {
        // El jugador YA está en esta zona y el audio YA suena → no hacer nada
        if (this.currentZoneId === zoneData.id) {
            return;
        }

        // Detener el audio de la zona anterior si hubiera uno
        this.stopActiveZoneSound();

        this.currentZoneId = zoneData.id;

        // ----- INTENTAR REPRODUCIR EL ARCHIVO .MP3 REAL DEL USUARIO -----
        let usedRealAudio = false;

        if (this.scene.cache.audio.exists(zoneData.soundKey)) {
            try {
                // Desbloquear WebAudio Context si el navegador lo tiene suspendido
                if (this.scene.sound.context && this.scene.sound.context.state === 'suspended') {
                    this.scene.sound.context.resume();
                }

                // Crear instancia de sonido con loop activado
                this.activePhaserSound = this.scene.sound.add(zoneData.soundKey, {
                    volume: this.volume,
                    loop: true   // ← Bucle infinito mientras el jugador permanezca en la zona
                });

                this.activePhaserSound.play();
                usedRealAudio = true;

                console.log(`[AudioManager] 🎵 Reproduciendo en bucle: ${zoneData.soundKey}`);
            } catch (e) {
                console.warn('[AudioManager] Error reproduciendo audio Phaser:', e);
            }
        }

        // ----- SINTETIZADOR DE RESPALDO SI NO HAY ARCHIVO .MP3 -----
        if (!usedRealAudio) {
            console.log(`[AudioManager] 🔊 Usando sintetizador para: ${zoneData.id}`);
            this.playSyntheticAudioLoop(zoneData.id);
        }

        // ----- VIBRACIÓN HÁPTICA OPCIONAL EN CELULARES -----
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            try {
                navigator.vibrate([150, 80, 150]);
            } catch (_) {}
        }

        // Notificar a la UI
        if (onSoundTriggeredCallback) {
            onSoundTriggeredCallback(zoneData);
        }
    }

    /**
     * Detiene inmediatamente el audio activo.
     * Se llama cuando el jugador sale de la zona.
     */
    stopActiveZoneSound() {
        this.currentZoneId = null;

        // Detener y destruir el sonido Phaser
        if (this.activePhaserSound) {
            try {
                if (this.activePhaserSound.isPlaying) {
                    this.activePhaserSound.stop();
                }
                this.activePhaserSound.destroy();
            } catch (_) {}
            this.activePhaserSound = null;
        }

        // Detener el bucle del sintetizador de respaldo
        if (this.activeSynthInterval) {
            clearInterval(this.activeSynthInterval);
            this.activeSynthInterval = null;
        }
    }

    // ===================================================================
    //  SINTETIZADOR WEBAUDIO DE RESPALDO
    //  Se utiliza automáticamente si no hay archivos .mp3 en assets/sounds/
    // ===================================================================

    playSyntheticAudioLoop(type) {
        this.playSyntheticPulse(type);
        const intervalMs = (type === 'intersection') ? 1100 : 2600;
        this.activeSynthInterval = setInterval(() => {
            if (!this.currentZoneId) {
                clearInterval(this.activeSynthInterval);
                this.activeSynthInterval = null;
                return;
            }
            this.playSyntheticPulse(type);
        }, intervalMs);
    }

    playSyntheticPulse(type) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const t = this.audioCtx.currentTime;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(this.volume, t);
        gain.connect(this.audioCtx.destination);

        if (type === 'hospital') {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.linearRampToValueAtTime(900, t + 0.7);
            osc.frequency.linearRampToValueAtTime(600, t + 1.4);
            osc.frequency.linearRampToValueAtTime(900, t + 2.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 2.3);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 2.3);

        } else if (type === 'police') {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sawtooth';
            for (let i = 0; i < 4; i++) {
                const s = t + i * 0.4;
                osc.frequency.setValueAtTime(700, s);
                osc.frequency.linearRampToValueAtTime(1400, s + 0.35);
            }
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.8);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 1.8);

        } else if (type === 'fire') {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, t);
            osc.frequency.linearRampToValueAtTime(550, t + 1.1);
            osc.frequency.linearRampToValueAtTime(350, t + 2.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 2.3);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 2.3);

        } else if (type === 'intersection') {
            const o1 = this.audioCtx.createOscillator();
            const o2 = this.audioCtx.createOscillator();
            o1.type = 'square'; o2.type = 'square';
            o1.frequency.setValueAtTime(400, t);
            o2.frequency.setValueAtTime(500, t);
            gain.gain.setValueAtTime(this.volume * 0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
            o1.connect(gain); o2.connect(gain);
            o1.start(t); o2.start(t);
            o1.stop(t + 0.6); o2.stop(t + 0.6);
        }
    }

    setVolume(value) {
        this.volume = Phaser.Math.Clamp(value, 0, 1);
        this.scene.sound.volume = this.volume;
        if (this.activePhaserSound) {
            this.activePhaserSound.setVolume(this.volume);
        }
    }

    setupTabVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.activePhaserSound && this.activePhaserSound.isPlaying) {
                    this.activePhaserSound.pause();
                }
                if (this.activeSynthInterval) {
                    clearInterval(this.activeSynthInterval);
                    this.activeSynthInterval = null;
                }
            } else {
                if (this.activePhaserSound && this.currentZoneId) {
                    this.activePhaserSound.resume();
                }
            }
        });
    }
}
