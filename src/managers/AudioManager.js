// src/managers/AudioManager.js
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.bgmAudio = null;
        this.isMuted = false;
        this.bgmVolume = 0.4;
        this.sfxVolume = 0.7;
    }

    /**
     * Khởi tạo AudioContext khi có tương tác đầu tiên của người dùng
     */
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

    /**
     * Tải danh sách file âm thanh vào bộ nhớ
     * @param {Object} soundManifest - Cặp key: url (ví dụ: { click: '/sounds/click.mp3' })
     * @returns {Promise<void>}
     */
    async loadSounds(soundManifest = {}) {
        this.init();

        const loadPromises = Object.entries(soundManifest).map(async ([name, url]) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                if (this.audioContext) {
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.sounds.set(name, audioBuffer);
                }
            } catch (error) {
                console.warn(`Không thể tải file âm thanh: ${name} (${url})`, error);
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * Phát hiệu ứng âm thanh (SFX) từ bộ nhớ đệm
     * @param {string} name - Tên âm thanh trong manifest
     * @param {number} [volume] - Âm lượng (0 - 1)
     */
    playSfx(name, volume = this.sfxVolume) {
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
        gainNode.gain.value = Math.max(0, Math.min(1, volume));

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
    }

    /**
     * Phát nhạc nền (BGM) lặp lại liên tục
     * @param {string} url - Đường dẫn file nhạc nền
     */
    playBgm(url) {
        if (this.bgmAudio) {
            this.stopBgm();
        }

        this.bgmAudio = new Audio(url);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;

        this.bgmAudio.play().catch((error) => {
            console.warn("Chưa thể phát BGM do chính sách autoplay của trình duyệt:", error);
        });
    }

    /**
     * Tạm dừng nhạc nền
     */
    pauseBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }
    }

    /**
     * Tiếp tục phát nhạc nền
     */
    resumeBgm() {
        if (this.bgmAudio && !this.isMuted) {
            this.bgmAudio.play().catch((error) => {
                console.warn("Không thể tiếp tục phát BGM:", error);
            });
        }
    }

    /**
     * Dừng hẳn và đặt lại nhạc nền
     */
    stopBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
    }

    /**
     * Bật / tắt toàn bộ âm thanh
     * @param {boolean} [muteState] - Nếu bỏ trống sẽ tự đảo trạng thái hiện tại
     * @returns {boolean}
     */
    toggleMute(muteState = null) {
        this.isMuted = muteState !== null ? muteState : !this.isMuted;

        if (this.bgmAudio) {
            this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
        }

        return this.isMuted;
    }

    /**
     * Điều chỉnh âm lượng nhạc nền
     * @param {number} volume - Giá trị 0 - 1
     */
    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmAudio && !this.isMuted) {
            this.bgmAudio.volume = this.bgmVolume;
        }
    }

    /**
     * Điều chỉnh âm lượng hiệu ứng âm thanh
     * @param {number} volume - Giá trị 0 - 1
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
}

export default new AudioManager();
