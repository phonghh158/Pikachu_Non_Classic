// src/managers/StorageManager.js
import { AUDIO, GAME_RECORD } from "../config/settings.js";

const STORAGE_KEY = "meow_pikachu_save_data";

class StorageManager {
    constructor() {
        this.data = this._loadFromStorage();
    }

    /**
     * Tải dữ liệu từ localStorage
     * @private
     * @returns {Object}
     */
    _loadFromStorage() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) {
                return {
                    audio: { ...AUDIO },
                    records: { ...GAME_RECORD },
                };
            }
            const parsed = JSON.parse(rawData);
            return {
                audio: { ...AUDIO, ...(parsed.audio || {}) },
                records: { ...GAME_RECORD, ...(parsed.records || {}) },
            };
        } catch (error) {
            console.warn("Không thể đọc dữ liệu từ localStorage:", error);
            return {
                audio: { ...AUDIO },
                records: { ...GAME_RECORD },
            };
        }
    }

    /**
     * Ghi toàn bộ dữ liệu hiện tại vào localStorage
     * @private
     * @returns {boolean}
     */
    _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.warn("Không thể lưu dữ liệu vào localStorage:", error);
            return false;
        }
    }

    /**
     * Lấy cấu hình âm thanh
     * @returns {Object} { BGM_VOLUME, SFX_VOLUME, MUTE }
     */
    getAudioSettings() {
        return { ...this.data.audio };
    }

    /**
     * Cập nhật cấu hình âm thanh
     * @param {Object} partialAudio
     */
    saveAudioSettings(partialAudio = {}) {
        this.data.audio = {
            ...this.data.audio,
            ...partialAudio,
        };
        this._saveToStorage();
    }

    /**
     * Lấy điểm kỷ lục cao nhất
     * @returns {number}
     */
    getHighScore() {
        return this.data.records.HIGH_SCORE;
    }

    /**
     * Cập nhật kỷ lục điểm số nếu điểm mới cao hơn
     * @param {number} score
     * @returns {boolean} True nếu phá kỷ lục mới
     */
    updateHighScore(score) {
        if (score > this.data.records.HIGH_SCORE) {
            this.data.records.HIGH_SCORE = score;
            this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Lấy level cao nhất từng đạt
     * @returns {number}
     */
    getMaxLevelReach() {
        return this.data.records.MAX_LEVEL_REACH;
    }

    /**
     * Cập nhật level cao nhất đã đạt
     * @param {number} levelId
     */
    updateMaxLevelReach(levelId) {
        if (levelId > this.data.records.MAX_LEVEL_REACH) {
            this.data.records.MAX_LEVEL_REACH = levelId;
            this._saveToStorage();
        }
    }

    /**
     * Đặt lại toàn bộ dữ liệu về mặc định ban đầu
     */
    resetAll() {
        this.data = {
            audio: { ...AUDIO },
            records: { ...GAME_RECORD },
        };
        this._saveToStorage();
    }
}

export default new StorageManager();
