/**
 * AudioManager.js
 * Gestor centralizado de audio para la reproducción de sonidos urbanos.
 * Usa los archivos .mp3 del usuario embebidos en base64 (sounds-data.js) para funcionar con file://.
 * Reproduce en bucle mientras el jugador permanece en la zona y detiene al salir.
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.volume = 0.8;
        this.currentZoneId = null;
        this.activeAudioNode = null;

        // WebAudio API nativa para decodificar y reproducir los base64 sin restricciones
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = AC ? new AC() : null;
        } catch (e) {
            this.audioCtx = null;
        }

        // Cache de AudioBuffers decodificados (para no decodificar dos veces)
        this.bufferCache = {};

        // Mapa de zoneId → clave en HAPTIC_SOUNDS
        this.soundMap = {
            'hospital':     'ambulance',
            'police':       'police',
            'fire':         'fire',
            'intersection': 'horn'
        };

        // Pausar audio al cambiar de pestaña
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopActiveZoneSound();
            }
        });
    }

    /**
     * Activa la reproducción en BUCLE del audio de la zona.
     * No reinicia si el jugador ya está en la misma zona (continuidad sin cortes).
     */
    triggerZoneSound(zoneData, onSoundTriggeredCallback) {
        if (this.currentZoneId === zoneData.id) return;

        this.stopActiveZoneSound();
        this.currentZoneId = zoneData.id;

        if (onSoundTriggeredCallback) {
            onSoundTriggeredCallback(zoneData);
        }

        // Vibración háptica opcional en móviles
        if ('vibrate' in navigator) {
            try { navigator.vibrate([150, 80, 150]); } catch (_) {}
        }

        // Buscar la clave de audio en el objeto HAPTIC_SOUNDS (embebido en base64)
        const soundKey = this.soundMap[zoneData.id];

        if (typeof HAPTIC_SOUNDS !== 'undefined' && HAPTIC_SOUNDS[soundKey]) {
            this.playBase64Loop(zoneData.id, HAPTIC_SOUNDS[soundKey]);
        } else {
            // Fallback al sintetizador si no hay base64
            this.playSynthLoop(zoneData.id);
        }
    }

    /**
     * Decodifica el Data URL base64 y lo reproduce en bucle usando WebAudio.
     */
    async playBase64Loop(zoneId, dataUrl) {
        if (!this.audioCtx) {
            this.playSynthLoop(zoneId);
            return;
        }

        try {
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            // Usar el buffer cacheado si ya fue decodificado antes
            let buffer = this.bufferCache[zoneId];

            if (!buffer) {
                // Convertir data URL a ArrayBuffer
                const base64 = dataUrl.split(',')[1];
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                buffer = await this.audioCtx.decodeAudioData(bytes.buffer);
                this.bufferCache[zoneId] = buffer;
            }

            // Si mientras decodificaba el jugador salió, no reproducir
            if (this.currentZoneId !== zoneId) return;

            // Crear nodo de fuente con loop activado
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const gainNode = this.audioCtx.createGain();
            gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

            source.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            source.start(0);

            // Guardar referencias para detener cuando el jugador salga
            this.activeAudioNode = { source, gainNode };

        } catch (e) {
            console.warn('[AudioManager] Error decodificando audio base64, usando sintetizador:', e);
            this.playSynthLoop(zoneId);
        }
    }

    /**
     * Detiene inmediatamente el audio activo cuando el jugador sale de la zona.
     */
    stopActiveZoneSound() {
        this.currentZoneId = null;

        if (this.activeAudioNode) {
            try {
                const { source, gainNode } = this.activeAudioNode;
                const t = this.audioCtx.currentTime;
                gainNode.gain.setTargetAtTime(0, t, 0.1);  // Fade-out suave
                source.stop(t + 0.2);
            } catch (_) {}
            this.activeAudioNode = null;
        }

        if (this.synthInterval) {
            clearInterval(this.synthInterval);
            this.synthInterval = null;
        }
    }

    // ─── SINTETIZADOR DE RESPALDO ─────────────────────────────────────────────

    playSynthLoop(type) {
        this.playSynthPulse(type);
        const ms = type === 'intersection' ? 1100 : 2600;
        this.synthInterval = setInterval(() => {
            if (!this.currentZoneId) { clearInterval(this.synthInterval); return; }
            this.playSynthPulse(type);
        }, ms);
    }

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
