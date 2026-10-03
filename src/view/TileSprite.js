// src/view/TileSprite.js
import { TILE_ELEMENT } from "../config/constants.js";

class TileSprite {
    /**
     * @param {Object} options
     * @param {number} options.x - Tọa độ cột trên bàn cờ
     * @param {number} options.y - Tọa độ hàng trên bàn cờ
     * @param {Object} options.tile - Dữ liệu { typeId, element }
     * @param {number} options.width - Chiều rộng pixel
     * @param {number} options.height - Chiều cao pixel
     * @param {Function} options.onClick - Callback khi click vào ô
     */
    constructor({ x, y, tile, width, height, onClick }) {
        this.x = x;
        this.y = y;
        this.tile = tile;
        this.width = width;
        this.height = height;
        this.onClick = onClick;

        this.element = null;
        this.iconElement = null;
        this.badgeElement = null;

        this._createDOM();
    }

    /**
     * Tạo phần tử HTML tương ứng cho ô cờ
     * @private
     */
    _createDOM() {
        this.element = document.createElement("div");
        this.element.className = "tile";
        this.setSize(this.width, this.height);

        if (this.tile.element === TILE_ELEMENT.ICE) {
            this.element.classList.add("tile-ice");
        } else if (this.tile.element === TILE_ELEMENT.FIRE) {
            this.element.classList.add("tile-fire");
        }

        this.iconElement = document.createElement("div");
        this.iconElement.className = "tile-icon";
        this._applySpriteOffset();
        this.element.appendChild(this.iconElement);

        if (this.tile.element === TILE_ELEMENT.ICE) {
            this.badgeElement = document.createElement("img");
            this.badgeElement.className = "tile-element-badge";
            this.badgeElement.src = "/assets/elements/ice.webp";
            this.badgeElement.alt = "ice";
            this.element.appendChild(this.badgeElement);
        } else if (this.tile.element === TILE_ELEMENT.FIRE) {
            this.badgeElement = document.createElement("img");
            this.badgeElement.className = "tile-element-badge";
            this.badgeElement.src = "/assets/elements/fire.webp";
            this.badgeElement.alt = "fire";
            this.element.appendChild(this.badgeElement);
        }

        this.element.addEventListener("click", () => {
            if (typeof this.onClick === "function") {
                this.onClick(this.x, this.y);
            }
        });
    }

    /**
     * Cập nhật kích thước ô cờ theo pixel
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        if (this.element) {
            this.element.style.width = `${this.width}px`;
            this.element.style.height = `${this.height}px`;
        }
    }

    /**
     * Tính toán offset background cho icon 32x32 trên spritesheet 160x128
     * @private
     */
    _applySpriteOffset() {
        const index = Math.max(0, this.tile.typeId - 1);
        const col = index % 5;
        const row = Math.floor(index / 5);

        const offsetX = -(col * 32);
        const offsetY = -(row * 32);

        this.iconElement.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    }

    /**
     * Bật / tắt trạng thái viền chọn
     * @param {boolean} isSelected
     */
    setSelected(isSelected) {
        if (!this.element) {
            return;
        }

        if (isSelected) {
            this.element.classList.add("tile-selected");
        } else {
            this.element.classList.remove("tile-selected");
        }
    }

    /**
     * Cập nhật lại dữ liệu quân cờ khi bị đảo hoặc sinh mới
     * @param {Object} newTile
     */
    updateTile(newTile) {
        this.tile = newTile;
        this.element.className = "tile";

        if (this.tile.element === TILE_ELEMENT.ICE) {
            this.element.classList.add("tile-ice");
        } else if (this.tile.element === TILE_ELEMENT.FIRE) {
            this.element.classList.add("tile-fire");
        }

        this._applySpriteOffset();

        if (this.badgeElement) {
            this.badgeElement.remove();
            this.badgeElement = null;
        }

        if (this.tile.element === TILE_ELEMENT.ICE) {
            this.badgeElement = document.createElement("img");
            this.badgeElement.className = "tile-element-badge";
            this.badgeElement.src = "/assets/elements/ice.webp";
            this.badgeElement.alt = "ice";
            this.element.appendChild(this.badgeElement);
        } else if (this.tile.element === TILE_ELEMENT.FIRE) {
            this.badgeElement = document.createElement("img");
            this.badgeElement.className = "tile-element-badge";
            this.badgeElement.src = "/assets/elements/fire.webp";
            this.badgeElement.alt = "fire";
            this.element.appendChild(this.badgeElement);
        }
    }

    /**
     * Xóa element khỏi DOM
     */
    destroy() {
        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
        this.element = null;
        this.iconElement = null;
        this.badgeElement = null;
    }
}

export default TileSprite;
