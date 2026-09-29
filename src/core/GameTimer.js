// src/core/GameTimer.js
import { PENALTY } from "../config/constants.js";

class GameTimer {
    /**
     * @param {Object} options
     * @param {number} options.initialTime - Thời gian ban đầu (giây)
     * @param {Function} [options.onTick] - Callback gọi mỗi giây: (timeRemaining, formattedTime) => {}
     * @param {Function} [options.onTimeOut] - Callback gọi khi hết giờ
     */
    constructor({ initialTime = 0, onTick = null, onTimeOut = null }) {
        this.initialTime = Math.max(0, initialTime);
        this.timeRemaining = this.initialTime;
        this.timerId = null;
        this.isRunning = false;
        this.onTick = onTick;
        this.onTimeOut = onTimeOut;
    }

    /**
     * Bắt đầu hoặc tiếp tục đếm ngược
     */
    start() {
        if (this.isRunning || this.timeRemaining <= 0) {
            return;
        }

        this.isRunning = true;
        this._notifyTick();

        this.timerId = setInterval(() => {
            this.timeRemaining -= 1;

            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.stop();
                this._notifyTick();
                if (typeof this.onTimeOut === "function") {
                    this.onTimeOut();
                }
                return;
            }

            this._notifyTick();
        }, 1000);
    }

    /**
     * Tạm dừng đếm ngược
     */
    pause() {
        if (!this.isRunning) {
            return;
        }

        this.stop();
    }

    /**
     * Dừng hẳn bộ đếm
     */
    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isRunning = false;
    }

    /**
     * Đặt lại thời gian
     * @param {number} [newTime]
     */
    reset(newTime = null) {
        this.stop();
        if (newTime !== null) {
            this.initialTime = Math.max(0, newTime);
        }
        this.timeRemaining = this.initialTime;
        this._notifyTick();
    }

    /**
     * Phạt trừ phần trăm thời gian còn lại (khi Shuffle thông thường)
     * @param {number} [factor] - Mặc định lấy từ constants (0.96 tức trừ 4%)
     * @returns {number} Thời gian bị trừ
     */
    applyShufflePenalty(factor = PENALTY.SHUFFLE_TIME_FACTOR) {
        if (this.timeRemaining <= 0) {
            return 0;
        }

        const previousTime = this.timeRemaining;
        this.timeRemaining = Math.max(0, this.timeRemaining * factor);
        const deducted = previousTime - this.timeRemaining;

        this._notifyTick();

        if (this.timeRemaining === 0 && this.isRunning) {
            this.stop();
            if (typeof this.onTimeOut === "function") {
                this.onTimeOut();
            }
        }

        return deducted;
    }

    /**
     * Lấy thời gian còn lại dưới định dạng MM:SS
     * @returns {string}
     */
    getFormattedTime() {
        const totalSeconds = Math.ceil(this.timeRemaining);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const paddedMinutes = String(minutes).padStart(2, "0");
        const paddedSeconds = String(seconds).padStart(2, "0");
        return `${paddedMinutes}:${paddedSeconds}`;
    }

    /**
     * Gửi callback cập nhật thời gian
     * @private
     */
    _notifyTick() {
        if (typeof this.onTick === "function") {
            this.onTick(this.timeRemaining, this.getFormattedTime());
        }
    }
}

export default GameTimer;
