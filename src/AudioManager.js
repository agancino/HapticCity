/**
 * AudioManager.js
 * Gestor de audio para Haptic City v2.
 * Maneja los 3 sonidos oficiales (Claxon, Sirena, Alarma) embebidos en base64 para celulares.
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.volume = 1.0; // Volumen al máximo
        this.activeAudioNode = null;
        this.isPlaying = false;

        // Contexto WebAudio
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = AC ? new AC() : null;
        } catch (e) {
            this.audioCtx = null;
        }

        this.bufferCache = {};

        // 3 Sonidos Oficiales
        this.availableSounds = [
            { id: 'horn',  label: '🚗 Claxon', key: 'horn' },
            { id: 'siren', label: '🚨 Sirena', key: 'siren' },
            { id: 'alarm', label: '⏰ Alarma', key: 'alarm' }
        ];

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopActiveSound();
        });
    }

    /**
     * Elige uno de los 3 sonidos al azar y lo reproduce.
     */
    playRandomSound() {
        this.stopActiveSound();

        const idx = Math.floor(Math.random() * this.availableSounds.length);
        const chosen = this.availableSounds[idx];

        if (typeof HAPTIC_SOUNDS !== 'undefined' && HAPTIC_SOUNDS[chosen.key]) {
            this.playBase64Once(chosen.key, HAPTIC_SOUNDS[chosen.key]);
        } else {
            this.playSynthPulse(chosen.id);
        }

        if ('vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 200, 100, 200]); } catch (_) {}
        }

        this.isPlaying = true;
        return chosen;
    }

    findSoundStart(buffer) {
        const channelData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const threshold = 0.02;

        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                const startSample = Math.max(0, i - Math.floor(sampleRate * 0.05));
                return startSample / sampleRate;
            }
        }
        return 0;
    }

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

            const startOffset = this.findSoundStart(buffer);

            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.loopStart = startOffset;

            const gainNode = this.audioCtx.createGain();
            gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

            const compressor = this.audioCtx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
            compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
            compressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
            compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
            compressor.release.setValueAtTime(0.15, this.audioCtx.currentTime);

            source.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            source.start(0, startOffset);

            this.activeAudioNode = { source, gainNode };

        } catch (e) {
            console.warn('[AudioManager] Error reproduciendo audio base64:', e);
            this.playSynthPulse(soundId);
        }
    }

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

    playSynthPulse(type) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const t = this.audioCtx.currentTime;
        const g = this.audioCtx.createGain();
        g.gain.setValueAtTime(this.volume, t);
        g.connect(this.audioCtx.destination);

        const o = this.audioCtx.createOscillator();
        if (type === 'horn') {
            o.type = 'square';
            o.frequency.setValueAtTime(420, t);
        } else if (type === 'siren') {
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(700, t);
            o.frequency.linearRampToValueAtTime(1400, t + 0.8);
        } else { // alarm
            o.type = 'sine';
            o.frequency.setValueAtTime(880, t);
            o.frequency.linearRampToValueAtTime(440, t + 0.3);
        }
        g.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
        o.connect(g);
        o.start(t);
        o.stop(t + 1.2);
    }
}

window.AudioManager = AudioManager;
