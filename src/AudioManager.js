/**
 * AudioManager.js
 * Gestor centralizado de audio para Haptic City v2.
 * - playRandomSound(): reproduce un sonido aleatorio UNA vez (para el sistema de quiz).
 * - stopActiveSound(): detiene el audio inmediatamente.
 * - Usa archivos base64 embebidos (sounds-data.js) para compatibilidad universal.
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.volume = 1.0;  // Volumen al máximo para que suene fuerte
        this.activeAudioNode = null;
        this.isPlaying = false;

        // WebAudio API nativa
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = AC ? new AC() : null;
        } catch (e) {
            this.audioCtx = null;
        }

        // Cache de AudioBuffers decodificados
        this.bufferCache = {};

        // Listado de sonidos disponibles con sus claves y nombres legibles
        this.availableSounds = [
            { id: 'ambulance', label: '🚑 Ambulancia',  key: 'ambulance' },
            { id: 'police',    label: '🚓 Policía',     key: 'police'    },
            { id: 'fire',      label: '🚒 Bomberos',    key: 'fire'      },
            { id: 'horn',      label: '🚗 Claxon',      key: 'horn'      }
        ];

        // Pausar audio al cambiar de pestaña
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopActiveSound();
        });
    }

    /**
     * Elige un sonido aleatorio y lo reproduce UNA vez (sin loop).
     * Retorna el objeto del sonido elegido { id, label, key } para que GameScene sepa la respuesta correcta.
     */
    playRandomSound() {
        this.stopActiveSound();

        // Elegir sonido aleatorio
        const idx = Math.floor(Math.random() * this.availableSounds.length);
        const chosen = this.availableSounds[idx];

        // Reproducir usando base64 embebido
        if (typeof HAPTIC_SOUNDS !== 'undefined' && HAPTIC_SOUNDS[chosen.key]) {
            this.playBase64Once(chosen.key, HAPTIC_SOUNDS[chosen.key]);
        } else {
            // Fallback al sintetizador
            this.playSynthPulse(chosen.id === 'horn' ? 'intersection' : chosen.id === 'ambulance' ? 'hospital' : chosen.id === 'police' ? 'police' : 'fire');
        }

        // Vibración háptica opcional en móviles
        if ('vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 200, 100, 200]); } catch (_) {}
        }

        this.isPlaying = true;
        return chosen;
    }

    /**
     * Analiza un AudioBuffer y encuentra el segundo exacto donde comienza el sonido real,
     * saltando cualquier silencio inicial del archivo .mp3.
     * @param {AudioBuffer} buffer
     * @returns {number} offset en segundos donde comienza el sonido
     */
    findSoundStart(buffer) {
        const channelData = buffer.getChannelData(0); // Canal izquierdo
        const sampleRate = buffer.sampleRate;
        const threshold = 0.02; // Umbral mínimo para considerar que hay sonido

        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                // Retroceder un poquito (50ms) para no cortar el ataque del sonido
                const startSample = Math.max(0, i - Math.floor(sampleRate * 0.05));
                return startSample / sampleRate;
            }
        }
        return 0; // Si no hay silencio, empezar desde el inicio
    }

    /**
     * Decodifica el Data URL base64 y lo reproduce en loop.
     * SALTA automáticamente los silencios iniciales del archivo.
     * Reproduce a volumen MÁXIMO.
     */
    async playBase64Once(soundId, dataUrl) {
        if (!this.audioCtx) return;

        try {
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            let buffer = this.bufferCache[soundId];

            if (!buffer) {
                const base64 = dataUrl.split(',')[1];
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                buffer = await this.audioCtx.decodeAudioData(bytes.buffer);
                this.bufferCache[soundId] = buffer;
            }

            // Detectar dónde comienza el sonido real (saltar silencios)
            const startOffset = this.findSoundStart(buffer);

            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.loopStart = startOffset; // Al hacer loop, también saltar el silencio

            // Volumen al máximo con compresor para que suene FUERTE
            const gainNode = this.audioCtx.createGain();
            gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

            // Compresor dinámico para asegurar volumen alto y uniforme
            const compressor = this.audioCtx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
            compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
            compressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
            compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
            compressor.release.setValueAtTime(0.15, this.audioCtx.currentTime);

            source.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            // Iniciar desde donde realmente empieza el sonido
            source.start(0, startOffset);

            this.activeAudioNode = { source, gainNode };

            console.log(`[AudioManager] 🔊 Reproduciendo ${soundId} desde ${startOffset.toFixed(2)}s (silencio saltado)`);

        } catch (e) {
            console.warn('[AudioManager] Error decodificando audio base64:', e);
        }
    }

    /**
     * Detiene inmediatamente el audio activo.
     */
    stopActiveSound() {
        this.isPlaying = false;

        if (this.activeAudioNode) {
            try {
                const { source, gainNode } = this.activeAudioNode;
                const t = this.audioCtx.currentTime;
                gainNode.gain.setTargetAtTime(0, t, 0.08);
                source.stop(t + 0.15);
            } catch (_) {}
            this.activeAudioNode = null;
        }
    }

    // ─── SINTETIZADOR DE RESPALDO ─────────────────────────────────────────────

    playSynthPulse(type) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const t = this.audioCtx.currentTime;
        const g = this.audioCtx.createGain();
        g.gain.setValueAtTime(this.volume, t);
        g.connect(this.audioCtx.destination);

        if (type === 'hospital') {
            const o = this.audioCtx.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(600, t);
            o.frequency.linearRampToValueAtTime(900, t + 0.7);
            o.frequency.linearRampToValueAtTime(600, t + 1.4);
            o.frequency.linearRampToValueAtTime(900, t + 2.1);
            g.gain.exponentialRampToValueAtTime(0.01, t + 2.3);
            o.connect(g); o.start(t); o.stop(t + 2.3);

        } else if (type === 'police') {
            const o = this.audioCtx.createOscillator();
            o.type = 'sawtooth';
            for (let i = 0; i < 4; i++) {
                o.frequency.setValueAtTime(700, t + i * 0.4);
                o.frequency.linearRampToValueAtTime(1400, t + i * 0.4 + 0.35);
            }
            g.gain.exponentialRampToValueAtTime(0.01, t + 1.8);
            o.connect(g); o.start(t); o.stop(t + 1.8);

        } else if (type === 'fire') {
            const o = this.audioCtx.createOscillator();
            o.type = 'triangle';
            o.frequency.setValueAtTime(350, t);
            o.frequency.linearRampToValueAtTime(550, t + 1.1);
            o.frequency.linearRampToValueAtTime(350, t + 2.2);
            g.gain.exponentialRampToValueAtTime(0.01, t + 2.3);
            o.connect(g); o.start(t); o.stop(t + 2.3);

        } else if (type === 'intersection') {
            const o1 = this.audioCtx.createOscillator();
            const o2 = this.audioCtx.createOscillator();
            o1.type = 'square'; o2.type = 'square';
            o1.frequency.setValueAtTime(400, t);
            o2.frequency.setValueAtTime(500, t);
            g.gain.setValueAtTime(this.volume * 0.35, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
            o1.connect(g); o2.connect(g);
            o1.start(t); o2.start(t);
            o1.stop(t + 0.6); o2.stop(t + 0.6);
        }
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.activeAudioNode) {
            this.activeAudioNode.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        }
    }
}
