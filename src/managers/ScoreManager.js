// src/managers/ScoreManager.js
import { TILE_ELEMENT } from "../config/constants.js";
import {
    BASE_SCORE,
    TIME_BONUS_PER_SECOND,
    COMBO_TIMEOUT_MS,
    COMBO_BONUS_STEP,
    ELEMENT_MULTIPLIER,
} from "../config/score.js";

class ScoreManager {
    /**
     * @param {Object} [options]
     * @param {Function} [options.onScoreChange] - Callback: ({ gameScore, levelScore, addedScore, comboCount }) => {}
     */
    constructor({ onScoreChange = null } = {}) {
        this.gameScore = 0;
        this.levelScore = 0;
        this.comboCount = 0;
        this.lastMatchTimestamp = 0;
        this.onScoreChange = onScoreChange;
    }

    /**
     * Khởi tạo hoặc đặt lại điểm số khi sang màn mới
     * @param {boolean} [resetGameScore=false] - True nếu muốn reset tổng điểm game về 0
     */
    reset(resetGameScore = false) {
        if (resetGameScore) {
            this.gameScore = 0;
        }
        this.levelScore = 0;
        this.comboCount = 0;
        this.lastMatchTimestamp = 0;
        this._notify(0);
    }

    /**
     * Tính và ghi nhận điểm khi ghép cặp hợp lệ
     * @param {Object} matchResult - Kết quả từ Board.tryMatch
     * @param {Object} matchResult.tileA - Dữ liệu ô A
     * @param {Object} matchResult.tileB - Dữ liệu ô B
     * @returns {number} Số điểm vừa cộng
     */
    recordMatch(matchResult) {
        if (!matchResult || !matchResult.tileA || !matchResult.tileB) {
            return 0;
        }

        const now = Date.now();
        if (now - this.lastMatchTimestamp <= COMBO_TIMEOUT_MS) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastMatchTimestamp = now;

        const isIceFire =
            (matchResult.tileA.element === TILE_ELEMENT.ICE &&
                matchResult.tileB.element === TILE_ELEMENT.FIRE) ||
            (matchResult.tileA.element === TILE_ELEMENT.FIRE &&
                matchResult.tileB.element === TILE_ELEMENT.ICE);

        const multiplier = isIceFire ? ELEMENT_MULTIPLIER.ICE_FIRE : ELEMENT_MULTIPLIER.NORMAL;

        const comboBonus = this.comboCount * COMBO_BONUS_STEP;
        const earnedPoints = Math.round(BASE_SCORE * multiplier + comboBonus);

        this.levelScore += earnedPoints;
        this.gameScore += earnedPoints;

        this._notify(earnedPoints);
        return earnedPoints;
    }

    /**
     * Tính điểm thưởng thời gian khi giải phóng toàn bộ bàn cờ
     * @param {number} timeRemaining - Số giây còn lại của màn chơi
     * @returns {number} Điểm thưởng được cộng
     */
    applyClearBonus(timeRemaining) {
        const clearBonus = Math.max(0, Math.floor(timeRemaining)) * TIME_BONUS_PER_SECOND;

        this.levelScore += clearBonus;
        this.gameScore += clearBonus;
        this.comboCount = 0;

        this._notify(clearBonus);
        return clearBonus;
    }

    /**
     * @private
     */
    _notify(addedScore) {
        if (typeof this.onScoreChange === "function") {
            this.onScoreChange({
                gameScore: this.gameScore,
                levelScore: this.levelScore,
                addedScore: addedScore,
                comboCount: this.comboCount,
            });
        }
    }
}

export default ScoreManager;
