// src/managers/AudioManager.js
import StorageManager from "./StorageManager.js";

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.bgmAudio = null;
        this.currentBgmIndex = -1;
        this.totalBgmCount = 6;

        const savedAudio = StorageManager.getAudioSettings();
        this.isMuted = savedAudio.MUTE;
        this.bgmVolume = savedAudio.BGM_VOLUME;
        this.sfxVolume = savedAudio.SFX_VOLUME;
    }

    init() {
        if (!this.audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioContext = new AudioCtx();
            }
        }

        if (this.audioContext && this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    async loadSfx() {
        this.init();

        const sfxFiles = {
            click: "/assets/audio/sfx/click.wav",
            game_over: "/assets/audio/sfx/game_over.wav",
            level_clear: "/assets/audio/sfx/level_clear.wav",
            match_element: "/assets/audio/sfx/match_element.wav",
            match: "/assets/audio/sfx/match.wav",
            shuffle: "/assets/audio/sfx/shuffle.wav",
            spawn: "/assets/audio/sfx/spawn.wav",
        };

        const loadPromises = Object.entries(sfxFiles).map(async ([name, url]) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                if (this.audioContext) {
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.sounds.set(name, audioBuffer);
                }
            } catch (error) {
                console.warn(`Không thể tải âm thanh ${name}:`, error);
            }
        });

        await Promise.all(loadPromises);
    }

    playSfx(name) {
        if (this.isMuted || !this.audioContext) {
            return;
        }

        const buffer = this.sounds.get(name);
        if (!buffer) {
            return;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        gainNode.gain.value = this.sfxVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
    }

    playRandomBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.totalBgmCount) + 1;
        } while (nextIndex === this.currentBgmIndex && this.totalBgmCount > 1);

        this.currentBgmIndex = nextIndex;
        const bgmUrl = `/assets/audio/bgm/${this.currentBgmIndex}.mp3`;

        this.bgmAudio = new Audio(bgmUrl);
        this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;

        this.bgmAudio.addEventListener("ended", () => {
            this.playRandomBgm();
        });

        this.bgmAudio.play().catch(() => {});
    }

    pauseBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }
    }

    resumeBgm() {
        if (this.bgmAudio && !this.isMuted) {
            this.bgmAudio.play().catch(() => {});
        }
    }

    stopBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
    }

    setBgmVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        if (this.bgmAudio && !this.isMuted) {
            this.bgmAudio.volume = this.bgmVolume;
        }
        StorageManager.saveAudioSettings({ BGM_VOLUME: this.bgmVolume });
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        StorageManager.saveAudioSettings({ SFX_VOLUME: this.sfxVolume });
    }
}

export default new AudioManager();
