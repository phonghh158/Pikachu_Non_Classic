// src/core/Board.js
import { GRID_CONFIG, CELL_STATE, TILE_ELEMENT } from "../config/constants.js";
import { SPAWNER_CONFIG } from "../config/levels.js";
import PathFinder from "./PathFinder.js";

class Board {
    /**
     * @param {Object} options
     * @param {string} options.orientation - 'LANDSCAPE' hoặc 'PORTRAIT'
     * @param {Object} options.levelConfig - Cấu hình từ LEVELS trong levels.js
     * @param {Object} options.directions - Enum DIRECTIONS từ constants.js
     * @param {Array<Array<number>>} [options.customMask] - Mặt nạ nhị phân tùy chỉnh (nếu có)
     * @param {number} [options.totalAvailableTypes=20] - Tổng số loại ô cờ có trong asset
     */
    constructor({
        orientation = "LANDSCAPE",
        levelConfig,
        directions,
        customMask = null,
        totalAvailableTypes = 20,
    }) {
        this.orientation = orientation;
        this.levelConfig = levelConfig;
        this.directions = directions;
        this.customMask = customMask;
        this.totalAvailableTypes = totalAvailableTypes;

        const baseGrid = GRID_CONFIG[this.orientation];
        this.innerCols = baseGrid.COLS;
        this.innerRows = baseGrid.ROWS;
        this.padding = GRID_CONFIG.PADDING;

        this.cols = this.innerCols + this.padding * 2;
        this.rows = this.innerRows + this.padding * 2;

        this.grid = [];
        this.mask = [];
        this.matchesCount = 0;
        this.selectedTypeIds = [];
        this.upcomingSpawnTiles = [];
        this.pathFinder = new PathFinder(this.grid, this.directions);

        this.init();
    }

    /**
     * Khởi tạo bàn cờ, sinh ô và kiểm tra Deadlock ban đầu
     */
    init() {
        this._initMask();
        this._pickRandomTypes();
        this._generateTiles();
        this._prepareNextSpawnTiles();
        this.pathFinder.setGrid(this.grid);

        if (this.isDeadlock()) {
            this.shuffle(false);
        }
    }

    /**
     * Chọn ngẫu nhiên N loại ô từ tổng số loại có sẵn cho màn chơi hiện tại
     * @private
     */
    _pickRandomTypes() {
        const allTypes = Array.from({ length: this.totalAvailableTypes }, (_, i) => i + 1);
        this._shuffleArray(allTypes);
        const count = Math.min(this.levelConfig.tileTypeCount, this.totalAvailableTypes);
        this.selectedTypeIds = allTypes.slice(0, count);
    }

    /**
     * Khởi tạo mặt nạ logic nhị phân có thêm padding
     * @private
     */
    _initMask() {
        this.mask = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => 0),
        );

        let activeCellsCount = 0;
        for (let r = 0; r < this.innerRows; r++) {
            for (let c = 0; c < this.innerCols; c++) {
                const maskValue = this.customMask ? this.customMask[r][c] : 1;
                const gridY = r + this.padding;
                const gridX = c + this.padding;

                this.mask[gridY][gridX] = maskValue;
                if (maskValue === 1) {
                    activeCellsCount++;
                }
            }
        }

        if (activeCellsCount % 2 !== 0) {
            throw new Error("Tổng số ô khả dụng trong mặt nạ bàn cờ phải là số chẵn.");
        }
    }

    /**
     * Khởi tạo và phân bổ quân cờ ban đầu lên lưới dựa trên danh sách loại ô đã random
     * @private
     */
    _generateTiles() {
        this.grid = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => CELL_STATE.EMPTY),
        );

        const activePositions = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.mask[r][c] === 1) {
                    activePositions.push({ x: c, y: r });
                }
            }
        }

        const totalPairs = activePositions.length / 2;
        const totalIceFirePairs = Math.min(this.levelConfig.iceFirePairs || 0, totalPairs);
        const totalNormalPairs = totalPairs - totalIceFirePairs;
        const typesPoolSize = this.selectedTypeIds.length;

        const tilePool = [];

        for (let i = 0; i < totalNormalPairs; i++) {
            const typeId = this.selectedTypeIds[i % typesPoolSize];
            tilePool.push(
                { typeId, element: TILE_ELEMENT.NORMAL },
                { typeId, element: TILE_ELEMENT.NORMAL },
            );
        }

        for (let i = 0; i < totalIceFirePairs; i++) {
            const typeId = this.selectedTypeIds[i % typesPoolSize];
            tilePool.push(
                { typeId, element: TILE_ELEMENT.ICE },
                { typeId, element: TILE_ELEMENT.FIRE },
            );
        }

        this._shuffleArray(tilePool);

        for (let i = 0; i < activePositions.length; i++) {
            const pos = activePositions[i];
            this.grid[pos.y][pos.x] = tilePool[i];
        }
    }

    /**
     * Kiểm tra hai quân cờ có khớp quy tắc ghép cặp hay không
     * @param {Object} tileA
     * @param {Object} tileB
     * @returns {boolean}
     */
    canMatch(tileA, tileB) {
        if (!tileA || !tileB) {
            return false;
        }

        if (tileA.typeId !== tileB.typeId) {
            return false;
        }

        const isBothNormal =
            tileA.element === TILE_ELEMENT.NORMAL && tileB.element === TILE_ELEMENT.NORMAL;
        const isIceFire =
            (tileA.element === TILE_ELEMENT.ICE && tileB.element === TILE_ELEMENT.FIRE) ||
            (tileA.element === TILE_ELEMENT.FIRE && tileB.element === TILE_ELEMENT.ICE);

        return isBothNormal || isIceFire;
    }

    /**
     * Kiểm tra và thực hiện ăn hai ô nếu hợp lệ
     * @param {Object} posA - { x, y }
     * @param {Object} posB - { x, y }
     * @returns {Object|null}
     */
    tryMatch(posA, posB) {
        const tileA = this.getTile(posA.x, posA.y);
        const tileB = this.getTile(posB.x, posB.y);

        if (!this.canMatch(tileA, tileB)) {
            return null;
        }

        const path = this.pathFinder.findPath(posA, posB);
        if (!path) {
            return null;
        }

        this.grid[posA.y][posA.x] = CELL_STATE.EMPTY;
        this.grid[posB.y][posB.x] = CELL_STATE.EMPTY;
        this.matchesCount++;

        const spawnedTiles = this._handleSpawner();

        return {
            path,
            tileA,
            tileB,
            spawnedTiles,
        };
    }

    /**
     * Xử lý cơ chế Spawner sau mỗi lượt ghép cặp
     * @private
     * @returns {Array<Object>}
     */
    _handleSpawner() {
        const spawnerConfig = SPAWNER_CONFIG[this.levelConfig.spawnerLevel];
        if (!spawnerConfig) {
            return [];
        }

        if (this.matchesCount % spawnerConfig.triggerMatches !== 0) {
            return [];
        }

        const emptySlots = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.mask[r][c] === 1 && this.grid[r][c] === CELL_STATE.EMPTY) {
                    emptySlots.push({ x: c, y: r });
                }
            }
        }

        const totalPairsNeeded = spawnerConfig.normalPairs + spawnerConfig.iceFirePairs;
        const totalSlotsNeeded = totalPairsNeeded * 2;

        if (emptySlots.length < totalSlotsNeeded) {
            this._prepareNextSpawnTiles();
            return [];
        }

        this._shuffleArray(emptySlots);

        const newTiles = [];
        this.upcomingSpawnTiles.forEach((tile) => {
            if (tile.element === TILE_ELEMENT.ICE) {
                newTiles.push(
                    { typeId: tile.typeId, element: TILE_ELEMENT.ICE },
                    { typeId: tile.typeId, element: TILE_ELEMENT.FIRE },
                );
            } else {
                newTiles.push(
                    { typeId: tile.typeId, element: TILE_ELEMENT.NORMAL },
                    { typeId: tile.typeId, element: TILE_ELEMENT.NORMAL },
                );
            }
        });

        const spawned = [];
        for (let i = 0; i < newTiles.length; i++) {
            const pos = emptySlots[i];
            const tile = newTiles[i];
            this.grid[pos.y][pos.x] = tile;
            spawned.push({ x: pos.x, y: pos.y, tile });
        }

        this._prepareNextSpawnTiles();

        if (this.isDeadlock()) {
            this.shuffle(false);
        }

        return spawned;
    }

    /**
     * Chuẩn bị trước danh sách quân cờ cho đợt spawn kế tiếp
     * @private
     */
    _prepareNextSpawnTiles() {
        const spawnerConfig = SPAWNER_CONFIG[this.levelConfig.spawnerLevel];
        if (!spawnerConfig) {
            this.upcomingSpawnTiles = [];
            return;
        }

        const typesPoolSize = this.selectedTypeIds.length;
        this.upcomingSpawnTiles = [];

        for (let i = 0; i < spawnerConfig.normalPairs; i++) {
            const randomIndex = Math.floor(Math.random() * typesPoolSize);
            const typeId = this.selectedTypeIds[randomIndex];
            this.upcomingSpawnTiles.push({ typeId, element: TILE_ELEMENT.NORMAL });
        }

        for (let i = 0; i < spawnerConfig.iceFirePairs; i++) {
            const randomIndex = Math.floor(Math.random() * typesPoolSize);
            const typeId = this.selectedTypeIds[randomIndex];
            this.upcomingSpawnTiles.push({ typeId, element: TILE_ELEMENT.ICE });
        }
    }

    /**
     * Lấy thông tin số lượt còn lại và danh sách preview cho UI
     * @returns {Object}
     */
    getSpawnerStatus() {
        const spawnerConfig = SPAWNER_CONFIG[this.levelConfig.spawnerLevel];
        if (!spawnerConfig) {
            return {
                isActive: false,
                remaining: 0,
                previewTiles: [],
            };
        }

        const trigger = spawnerConfig.triggerMatches;
        const remainder = this.matchesCount % trigger;
        const remaining = trigger - remainder;

        let visibleCount = 0;
        if (remaining === 3) visibleCount = 1;
        else if (remaining === 2) visibleCount = 2;
        else if (remaining === 1) visibleCount = 3;

        return {
            isActive: true,
            remaining,
            previewTiles: this.upcomingSpawnTiles.slice(0, visibleCount),
        };
    }

    /**
     * Tìm nước đi hợp lệ đầu tiên
     * @returns {Object|null}
     */
    findValidMove() {
        const activeTiles = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (tile !== CELL_STATE.EMPTY && tile !== null) {
                    activeTiles.push({ x: c, y: r, tile });
                }
            }
        }

        for (let i = 0; i < activeTiles.length; i++) {
            for (let j = i + 1; j < activeTiles.length; j++) {
                const itemA = activeTiles[i];
                const itemB = activeTiles[j];

                if (this.canMatch(itemA.tile, itemB.tile)) {
                    const path = this.pathFinder.findPath(
                        { x: itemA.x, y: itemA.y },
                        { x: itemB.x, y: itemB.y },
                    );
                    if (path) {
                        return {
                            posA: { x: itemA.x, y: itemA.y },
                            posB: { x: itemB.x, y: itemB.y },
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Kiểm tra Deadlock
     * @returns {boolean}
     */
    isDeadlock() {
        return this.findValidMove() === null;
    }

    /**
     * Xáo trộn bàn cờ
     * @param {boolean} [checkCountOnly=true]
     * @returns {boolean}
     */
    shuffle(checkCountOnly = true) {
        const positions = [];
        const tiles = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (tile !== CELL_STATE.EMPTY && tile !== null) {
                    positions.push({ x: c, y: r });
                    tiles.push(tile);
                }
            }
        }

        if (checkCountOnly && tiles.length === 0) {
            return false;
        }

        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            this._shuffleArray(tiles);

            for (let i = 0; i < positions.length; i++) {
                const pos = positions[i];
                this.grid[pos.y][pos.x] = tiles[i];
            }

            if (!this.isDeadlock()) {
                return true;
            }

            attempts++;
        }

        return false;
    }

    /**
     * Lấy dữ liệu ô tại tọa độ chỉ định
     * @param {number} x
     * @param {number} y
     * @returns {Object|null}
     */
    getTile(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return null;
        }
        const cell = this.grid[y][x];
        return cell === CELL_STATE.EMPTY ? null : cell;
    }

    /**
     * Kiểm tra bàn cờ đã sạch ô chưa
     * @returns {boolean}
     */
    isCleared() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.mask[r][c] === 1 && this.grid[r][c] !== CELL_STATE.EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Thuật toán xáo trộn Fisher-Yates
     * @private
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

export default Board;
