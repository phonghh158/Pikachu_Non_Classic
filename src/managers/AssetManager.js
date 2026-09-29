// src/managers/AssetManager.js
import { Assets } from "pixi.js";

class AssetManager {
    constructor() {
        this.textures = new Map();
        this.isLoaded = false;
    }

    /**
     * Tải trước toàn bộ Texture Atlas và cấu hình tài nguyên
     * @param {Array<string|Object>} assetList - Danh sách manifest hoặc đường dẫn atlas
     * @param {Function} [onProgress] - Callback tiến trình tải (0 - 1)
     * @returns {Promise<void>}
     */
    async loadAssets(assetList = [], onProgress = null) {
        if (this.isLoaded) {
            return;
        }

        try {
            if (assetList.length > 0) {
                await Assets.load(assetList, onProgress);
            }
            this.isLoaded = true;
        } catch (error) {
            console.error("Lỗi khi tải tài nguyên game:", error);
            throw error;
        }
    }

    /**
     * Lấy texture theo key định danh từ cache
     * @param {string} key
     * @returns {any}
     */
    getTexture(key) {
        return Assets.get(key) || null;
    }

    /**
     * Lấy texture tương ứng với ô dựa trên loại và nguyên tố
     * @param {number} typeId
     * @param {string} element
     * @returns {any}
     */
    getTileTexture(typeId, element) {
        const key = `tile_${typeId}_${element.toLowerCase()}`;
        return this.getTexture(key) || this.getTexture(`tile_${typeId}`) || null;
    }
}

export default new AssetManager();
