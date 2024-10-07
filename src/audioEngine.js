class AudioEngine {
    constructor() {
        // Create audio context
        this.context = new Tone.Context();
        Tone.setContext(this.context);

        // Initialize effects
        this.pitchShift = new Tone.PitchShift().toDestination();
        this.eq = new Tone.EQ3().connect(this.pitchShift);
        this.reverb = new Tone.Reverb({
            wet: 0,
            decay: 1.5,
            preDelay: 0.01
        }).connect(this.eq);
        this.player = new Tone.Player().connect(this.reverb);

        this.defaultValues = {
            playbackRate: 1,
            pitchShift: 0,
            eqLow: 0,
            eqMid: 0,
            eqHigh: 0,
            reverb: 0
        };

        this.effects = { ...this.defaultValues };

        this.incrementSizes = {
            playbackRate: 0.1,
            pitchShift: 0.1,
            eqLow: 0.5,
            eqMid: 0.5,
            eqHigh: 0.5,
            reverb: 0.05
        };

        this.playing = false;
        this.trackLoaded = false;

        this.player.onstop = () => {
            this.playing = false;
            if (this.onPlaybackEnded) this.onPlaybackEnded();
        };

        this.updateInterval = null;
    }

    async loadTrack(url) {
        await Tone.start();
        await this.player.load(url);
        this.player.playbackRate = 1;  // Reset playback rate
        this.pitchShift.pitch = 0;     // Reset pitch shift
        this.eq.low.value = 0;         // Reset EQ
        this.eq.mid.value = 0;
        this.eq.high.value = 0;
        this.reverb.wet.value = 0;     // Reset reverb
        this.trackLoaded = true;
    }

    play() {
        if (this.trackLoaded && !this.playing) {
            this.player.start();
            this.playing = true;
            this.startProgressUpdate();
        }
    }

    stop() {
        if (this.playing) {
            this.player.stop();
            this.playing = false;
            this.stopProgressUpdate();
        }
    }

    startProgressUpdate() {
        this.updateInterval = setInterval(() => {
            if (this.onProgressUpdate) {
                this.onProgressUpdate(this.player.currentTime, this.player.buffer.duration);
            }
        }, 100); // Update every 100ms for smoother progress
    }

    stopProgressUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    isPlaying() {
        return this.playing;
    }

    applyEffect(type, value) {
        switch (type) {
            case 'playbackRate':
                this.player.playbackRate = Math.max(0.1, Math.min(2, value));
                break;
            case 'pitchShift':
                this.pitchShift.pitch = Math.max(-12, Math.min(12, value));
                break;
            case 'eqLow':
                this.eq.low.value = Math.max(0, Math.min(12, value));
                break;
            case 'eqMid':
                this.eq.mid.value = Math.max(0, Math.min(12, value));
                break;
            case 'eqHigh':
                this.eq.high.value = Math.max(0, Math.min(12, value));
                break;
            case 'reverb':
                this.reverb.wet.value = Math.max(0, Math.min(1, value));
                break;
        }
        this.effects[type] = value;
    }

    resetEffects() {
        Object.entries(this.defaultValues).forEach(([type, value]) => {
            this.applyEffect(type, value);
        });
    }

    getIncrementSize(type) {
        return this.incrementSizes[type];
    }
}