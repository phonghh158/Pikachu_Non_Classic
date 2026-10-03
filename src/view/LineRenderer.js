// src/view/LineRenderer.js
class LineRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.clearTimeoutId = null;
    }

    /**
     * Đồng bộ kích thước Canvas với kích thước vùng chứa
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Vẽ đường nối gấp khúc qua danh sách điểm và tự động xóa sau hiệu ứng
     * @param {Array<Object>} pixelPoints - Danh sách [{ x, y }] tọa độ pixel tâm ô
     * @param {string} [color="#ffe600"] - Màu sắc đường nối
     * @param {number} [duration=300] - Thời gian hiển thị (ms)
     */
    drawPath(pixelPoints, color = "#ffe600", duration = 300) {
        if (!pixelPoints || pixelPoints.length < 2) {
            return;
        }

        this.clear();

        this.ctx.beginPath();
        this.ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);

        for (let i = 1; i < pixelPoints.length; i++) {
            this.ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
        }

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();

        this.clearTimeoutId = setTimeout(() => {
            this.clear();
        }, duration);
    }

    /**
     * Xóa nội dung trên Canvas
     */
    clear() {
        if (this.clearTimeoutId) {
            clearTimeout(this.clearTimeoutId);
            this.clearTimeoutId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default LineRenderer;
