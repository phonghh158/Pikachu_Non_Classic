// src/managers/GameManager.js
import Board from "../core/Board.js";
import GameTimer from "../core/GameTimer.js";
import { LEVELS } from "../config/levels.js";

class GameManager {
    /**
     * @param {Object} options
     * @param {Object} options.directions - Enum DIRECTIONS từ constants.js
     * @param {string} [options.orientation] - 'LANDSCAPE' hoặc 'PORTRAIT'
     * @param {Function} [options.onStateChange] - Callback thông báo thay đổi trạng thái
     * @param {Function} [options.onMatchSuccess] - Callback khi ăn điểm kèm dữ liệu đường nối
     * @param {Function} [options.onShuffle] - Callback khi bàn cờ bị xáo trộn
     * @param {Function} [options.onGameOver] - Callback khi thua (hết giờ)
     * @param {Function} [options.onLevelClear] - Callback khi hoàn thành màn
     */
    constructor({
        directions,
        orientation = "LANDSCAPE",
        onStateChange = null,
        onMatchSuccess = null,
        onShuffle = null,
        onGameOver = null,
        onLevelClear = null,
    }) {
        this.directions = directions;
        this.orientation = orientation;
        this.onStateChange = onStateChange;
        this.onMatchSuccess = onMatchSuccess;
        this.onShuffle = onShuffle;
        this.onGameOver = onGameOver;
        this.onLevelClear = onLevelClear;

        this.currentLevelIndex = 0;
        this.board = null;
        this.timer = null;
        this.selectedTile = null;
        this.isProcessing = false;
    }

    /**
     * Khởi động một màn chơi theo index
     * @param {number} levelIndex
     */
    startLevel(levelIndex = 0) {
        if (levelIndex < 0 || levelIndex >= LEVELS.length) {
            return;
        }

        this.currentLevelIndex = levelIndex;
        const levelConfig = LEVELS[this.currentLevelIndex];
        this.selectedTile = null;
        this.isProcessing = false;

        this.board = new Board({
            orientation: this.orientation,
            levelConfig: levelConfig,
            directions: this.directions,
        });

        if (this.timer) {
            this.timer.stop();
        }

        this.timer = new GameTimer({
            initialTime: levelConfig.timeLimit,
            onTick: (remaining, formatted) => {
                this._notify("TIME_TICK", { remaining, formatted });
            },
            onTimeOut: () => {
                this._handleGameOver();
            },
        });

        this.timer.start();
        this._notify("LEVEL_STARTED", {
            levelConfig,
            grid: this.board.grid,
            cols: this.board.cols,
            rows: this.board.rows,
        });
    }

    /**
     * Xử lý khi người chơi click/chạm vào một ô
     * @param {number} x - Tọa độ cột
     * @param {number} y - Tọa độ hàng
     */
    handleTileClick(x, y) {
        if (this.isProcessing || !this.board || !this.timer.isRunning) {
            return;
        }

        const clickedTile = this.board.getTile(x, y);
        if (!clickedTile) {
            return;
        }

        if (!this.selectedTile) {
            this.selectedTile = { x, y, tile: clickedTile };
            this._notify("TILE_SELECTED", this.selectedTile);
            return;
        }

        if (this.selectedTile.x === x && this.selectedTile.y === y) {
            this.selectedTile = null;
            this._notify("TILE_DESELECTED", null);
            return;
        }

        const posA = { x: this.selectedTile.x, y: this.selectedTile.y };
        const posB = { x, y };

        const matchResult = this.board.tryMatch(posA, posB);

        if (matchResult) {
            this.isProcessing = true;
            this.selectedTile = null;
            this._notify("TILE_DESELECTED", null);

            if (typeof this.onMatchSuccess === "function") {
                this.onMatchSuccess(matchResult);
            }

            if (this.board.isCleared()) {
                this._handleLevelClear();
                return;
            }

            if (this.board.isDeadlock()) {
                this.triggerShuffle(false);
            }

            this.isProcessing = false;
        } else {
            this.selectedTile = { x, y, tile: clickedTile };
            this._notify("TILE_SELECTED", this.selectedTile);
        }
    }

    /**
     * Kích hoạt Shuffle bàn cờ
     * @param {boolean} isManual - True nếu người chơi chủ động bấm trợ giúp, False nếu do Deadlock/Spawner
     */
    triggerShuffle(isManual = true) {
        if (!this.board || !this.timer.isRunning) {
            return;
        }

        const success = this.board.shuffle();
        if (!success) {
            return;
        }

        let deductedTime = 0;
        if (isManual) {
            deductedTime = this.timer.applyShufflePenalty();
        }

        this.selectedTile = null;
        this._notify("TILE_DESELECTED", null);

        if (typeof this.onShuffle === "function") {
            this.onShuffle({
                grid: this.board.grid,
                isManual,
                deductedTime,
            });
        }
    }

    /**
     * Dọn dẹp tài nguyên và dừng màn chơi hiện tại
     */
    destroy() {
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
        this.board = null;
        this.selectedTile = null;
        this.isProcessing = false;
    }

    /**
     * @private
     */
    _handleGameOver() {
        this.isProcessing = true;
        this._notify("GAME_OVER", { levelIndex: this.currentLevelIndex });
        if (typeof this.onGameOver === "function") {
            this.onGameOver();
        }
    }

    /**
     * @private
     */
    _handleLevelClear() {
        this.isProcessing = true;
        this.timer.stop();
        this._notify("LEVEL_CLEAR", { levelIndex: this.currentLevelIndex });
        if (typeof this.onLevelClear === "function") {
            this.onLevelClear(this.currentLevelIndex);
        }
    }

    /**
     * @private
     */
    _notify(eventType, payload) {
        if (typeof this.onStateChange === "function") {
            this.onStateChange(eventType, payload);
        }
    }
}

export default GameManager;
