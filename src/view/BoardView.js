// src/view/BoardView.js
import { TILE_SIZE, CELL_STATE } from "../config/constants.js";
import TileSprite from "./TileSprite.js";
import LineRenderer from "./LineRenderer.js";

class BoardView {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.boardContainer - Container HTML chứa lưới ô
     * @param {HTMLElement} options.hiddenBackground - Thẻ hiển thị ảnh nền ẩn
     * @param {HTMLCanvasElement} options.lineCanvas - Canvas vẽ đường nối
     * @param {Function} options.onTileClick - Callback click ô
     */
    constructor({ boardContainer, hiddenBackground, lineCanvas, onTileClick }) {
        this.container = boardContainer;
        this.hiddenBackground = hiddenBackground;
        this.lineCanvas = lineCanvas;
        this.onTileClick = onTileClick;

        this.lineRenderer = new LineRenderer(lineCanvas);
        this.tileViews = new Map();
        this.cols = 0;
        this.rows = 0;

        this.tileWidth = TILE_SIZE.TILE_WIDTH_L;
        this.tileHeight = TILE_SIZE.TILE_HEIGHT_L;
        this.currentGrid = null;
        this.currentLevelId = 1;

        this._setupResizeListener();
    }

    /**
     * Xác định kích thước ô dựa theo chiều cao màn hình (ngưỡng Laptop <= 850px)
     * @private
     */
    _updateTileDimensions() {
        if (window.innerWidth <= 1200 && window.innerHeight <= 1080) {
            this.tileWidth = TILE_SIZE.TILE_WIDTH_S;
            this.tileHeight = TILE_SIZE.TILE_HEIGHT_S;
        } else {
            this.tileWidth = TILE_SIZE.TILE_WIDTH_L;
            this.tileHeight = TILE_SIZE.TILE_HEIGHT_L;
        }
    }

    /**
     * Lắng nghe sự kiện resize của window để tự động tính toán lại vị trí tuyệt đối và canvas
     * @private
     */
    _setupResizeListener() {
        window.addEventListener("resize", () => {
            const oldWidth = this.tileWidth;
            this._updateTileDimensions();
            if (oldWidth !== this.tileWidth && this.currentGrid) {
                this._refreshPositions();
            }
        });
    }

    /**
     * Dựng bàn cờ theo kích thước pixel thực tế dựa trên số hàng, cột và padding
     * @param {Array<Array<any>>} grid
     * @param {number} levelId
     */
    renderBoard(grid, levelId) {
        this.clear();
        this.currentGrid = grid;
        this.currentLevelId = levelId;
        this.rows = grid.length;
        this.cols = grid[0].length;

        this._updateTileDimensions();
        this._updateBoardDimensions();

        const imgIndex = ((levelId - 1) % 7) + 1;
        this.hiddenBackground.style.backgroundImage = `url('/assets/hide_images/${imgIndex}.webp')`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = grid[r][c];
                if (tile !== CELL_STATE.EMPTY && tile !== null) {
                    this._createTile(c, r, tile);
                }
            }
        }
    }

    /**
     * Cập nhật kích thước vùng chứa bàn cờ và canvas
     * @private
     */
    _updateBoardDimensions() {
        const totalWidth = this.cols * this.tileWidth;
        const totalHeight = this.rows * this.tileHeight;

        this.container.style.width = `${totalWidth}px`;
        this.container.style.height = `${totalHeight}px`;

        this.lineCanvas.width = totalWidth;
        this.lineCanvas.height = totalHeight;
        this.lineCanvas.style.width = `${totalWidth}px`;
        this.lineCanvas.style.height = `${totalHeight}px`;
        this.lineRenderer.resize(totalWidth, totalHeight);
    }

    /**
     * Cập nhật lại kích thước và tọa độ cho toàn bộ các ô khi resize màn hình
     * @private
     */
    _refreshPositions() {
        this._updateBoardDimensions();

        this.tileViews.forEach((tileSprite) => {
            tileSprite.setSize(this.tileWidth, this.tileHeight);
            tileSprite.element.style.left = `${tileSprite.x * this.tileWidth}px`;
            tileSprite.element.style.top = `${tileSprite.y * this.tileHeight}px`;
        });
    }

    /**
     * Tạo phần tử ô cờ và định vị tọa độ tuyệt đối bằng pixel
     * @private
     */
    _createTile(x, y, tile) {
        const tileSprite = new TileSprite({
            x,
            y,
            tile,
            width: this.tileWidth,
            height: this.tileHeight,
            onClick: (posX, posY) => {
                if (typeof this.onTileClick === "function") {
                    this.onTileClick(posX, posY);
                }
            },
        });

        const pixelLeft = x * this.tileWidth;
        const pixelTop = y * this.tileHeight;

        tileSprite.element.style.position = "absolute";
        tileSprite.element.style.left = `${pixelLeft}px`;
        tileSprite.element.style.top = `${pixelTop}px`;

        this.container.appendChild(tileSprite.element);
        this.tileViews.set(`${x},${y}`, tileSprite);
    }

    /**
     * Bật / tắt trạng thái chọn
     * @param {Object|null} selectedTile - { x, y }
     */
    setSelected(selectedTile) {
        this.tileViews.forEach((tileSprite) => {
            tileSprite.setSelected(false);
        });

        if (selectedTile) {
            const key = `${selectedTile.x},${selectedTile.y}`;
            const target = this.tileViews.get(key);
            if (target) {
                target.setSelected(true);
            }
        }
    }

    /**
     * Hiển thị đường nối qua Canvas tâm ô
     * @param {Array<Object>} path - Danh sách [{ x, y }] tọa độ logic
     */
    showMatchPath(path) {
        const pixelPoints = path.map((point) => ({
            x: point.x * this.tileWidth + this.tileWidth / 2,
            y: point.y * this.tileHeight + this.tileHeight / 2,
        }));

        this.lineRenderer.drawPath(pixelPoints);
    }

    /**
     * Xóa 2 ô ăn điểm khỏi bàn cờ
     * @param {Object} posA - { x, y }
     * @param {Object} posB - { x, y }
     */
    removeTiles(posA, posB) {
        const keyA = `${posA.x},${posA.y}`;
        const keyB = `${posB.x},${posB.y}`;

        const tileA = this.tileViews.get(keyA);
        const tileB = this.tileViews.get(keyB);

        if (tileA) {
            tileA.destroy();
            this.tileViews.delete(keyA);
        }

        if (tileB) {
            tileB.destroy();
            this.tileViews.delete(keyB);
        }
    }

    /**
     * Thêm ô sinh mới
     * @param {Array<Object>} spawnedList
     */
    addSpawnedTiles(spawnedList = []) {
        spawnedList.forEach((item) => {
            this._createTile(item.x, item.y, item.tile);
        });
    }

    /**
     * Xáo trộn bàn cờ
     * @param {Array<Array<any>>} grid
     */
    updateAfterShuffle(grid) {
        this.currentGrid = grid;
        this.tileViews.forEach((tileView) => tileView.destroy());
        this.tileViews.clear();

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = grid[r][c];
                if (tile !== CELL_STATE.EMPTY && tile !== null) {
                    this._createTile(c, r, tile);
                }
            }
        }
    }

    /**
     * Dọn dẹp hiển thị
     */
    clear() {
        this.tileViews.forEach((tileView) => tileView.destroy());
        this.tileViews.clear();
        this.container.innerHTML = "";
        this.lineRenderer.clear();
    }
}

export default BoardView;
