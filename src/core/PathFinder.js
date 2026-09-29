// src/core/PathFinder.js
import { PATH_RULES, CELL_STATE } from "../config/constants.js";

class PathFinder {
    /**
     * @param {Array<Array<any>>} grid - Ma trận bàn cờ có padding viền
     * @param {Object} directions - Danh sách hướng di chuyển { UP, DOWN, LEFT, RIGHT }
     */
    constructor(grid, directions) {
        this.grid = grid;
        this.directions = directions;
    }

    /**
     * Cập nhật ma trận bàn cờ hiện tại
     * @param {Array<Array<any>>} grid
     */
    setGrid(grid) {
        this.grid = grid;
    }

    /**
     * Tìm đường đi giữa 2 ô với tối đa 2 góc bẻ (3 đoạn thẳng)
     * @param {Object} start - Tọa độ { x, y } (x: cột, y: hàng)
     * @param {Object} target - Tọa độ { x, y } (x: cột, y: hàng)
     * @returns {Array<Object>|null} Mảng các điểm tọa độ [{ x, y }] tạo thành đường đi hoặc null nếu không thể nối
     */
    findPath(start, target) {
        if (!this.grid || this.grid.length === 0) {
            return null;
        }

        const rows = this.grid.length;
        const cols = this.grid[0].length;

        if (start.x === target.x && start.y === target.y) {
            return null;
        }

        const minTurns = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => ({})),
        );

        const queue = [];

        Object.keys(this.directions).forEach((dirKey) => {
            const dir = this.directions[dirKey];
            const nextX = start.x + dir.dx;
            const nextY = start.y + dir.dy;

            if (this._isValidCell(nextX, nextY, cols, rows)) {
                const isTarget = nextX === target.x && nextY === target.y;
                const isEmpty = this._isEmptyCell(nextX, nextY);

                if (isTarget || isEmpty) {
                    minTurns[nextY][nextX][dirKey] = 0;
                    queue.push({
                        x: nextX,
                        y: nextY,
                        dirKey: dirKey,
                        turns: 0,
                        path: [
                            { x: start.x, y: start.y },
                            { x: nextX, y: nextY },
                        ],
                    });
                }
            }
        });

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === target.x && current.y === target.y) {
                return current.path;
            }

            Object.keys(this.directions).forEach((nextDirKey) => {
                const nextDir = this.directions[nextDirKey];
                const turns = current.dirKey === nextDirKey ? current.turns : current.turns + 1;

                if (turns > PATH_RULES.MAX_TURNS) {
                    return;
                }

                const nextX = current.x + nextDir.dx;
                const nextY = current.y + nextDir.dy;

                if (!this._isValidCell(nextX, nextY, cols, rows)) {
                    return;
                }

                const isTarget = nextX === target.x && nextY === target.y;
                const isEmpty = this._isEmptyCell(nextX, nextY);

                if (!isTarget && !isEmpty) {
                    return;
                }

                const recordedTurns = minTurns[nextY][nextX][nextDirKey];
                if (recordedTurns === undefined || turns < recordedTurns) {
                    minTurns[nextY][nextX][nextDirKey] = turns;
                    queue.push({
                        x: nextX,
                        y: nextY,
                        dirKey: nextDirKey,
                        turns: turns,
                        path: [...current.path, { x: nextX, y: nextY }],
                    });
                }
            });
        }

        return null;
    }

    /**
     * Kiểm tra ô có nằm trong giới hạn lưới ma trận hay không
     * @private
     */
    _isValidCell(x, y, cols, rows) {
        return x >= 0 && x < cols && y >= 0 && y < rows;
    }

    /**
     * Kiểm tra ô có phải ô trống để đường nối đi qua hay không
     * @private
     */
    _isEmptyCell(x, y) {
        const cell = this.grid[y][x];
        return cell === CELL_STATE.EMPTY || cell === null;
    }
}

export default PathFinder;
