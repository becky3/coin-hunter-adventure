/**
 * ピクセルアートレンダリングシステム
 */

class PixelArtSprite {
    constructor(pixelData, colors, scale = 1) {
        this.pixelData = pixelData;
        this.colors = colors;
        this.scale = scale;
        this.width = pixelData[0].length;
        this.height = pixelData.length;
        this.canvas = null;
        this.flippedCanvas = null;
        this._render();
    }
    
    // パレットを更新して再描画
    updatePalette(colors) {
        this.colors = colors;
        this._render();
    }

    _render() {
        // 通常版の描画
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        const ctx = this.canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        this._drawPixels(ctx, false);
        
        // 水平反転版の描画
        this.flippedCanvas = document.createElement('canvas');
        this.flippedCanvas.width = this.width * this.scale;
        this.flippedCanvas.height = this.height * this.scale;
        const flippedCtx = this.flippedCanvas.getContext('2d');
        flippedCtx.imageSmoothingEnabled = false;
        
        this._drawPixels(flippedCtx, true);
    }

    _drawPixels(ctx, flipped = false) {
        this.pixelData.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel > 0 && this.colors[pixel]) {
                    ctx.fillStyle = this.colors[pixel];
                    const drawX = flipped ? (this.width - 1 - x) * this.scale : x * this.scale;
                    ctx.fillRect(drawX, y * this.scale, this.scale, this.scale);
                }
            });
        });
    }

    draw(ctx, x, y, flipped = false) {
        const source = flipped ? this.flippedCanvas : this.canvas;
        ctx.drawImage(source, x, y);
    }
}

class PixelArtAnimation {
    constructor(frames, colors, scale = 1, frameDuration = 100) {
        this.frames = frames.map(frameData => new PixelArtSprite(frameData, colors, scale));
        this.frameDuration = frameDuration;
        this.currentFrame = 0;
        this.lastFrameTime = 0;
    }

    update(currentTime) {
        if (currentTime - this.lastFrameTime > this.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.lastFrameTime = currentTime;
        }
    }

    draw(ctx, x, y, flipped = false) {
        this.frames[this.currentFrame].draw(ctx, x, y, flipped);
    }

    reset() {
        this.currentFrame = 0;
        this.lastFrameTime = 0;
    }
}

class PixelArtRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.sprites = new Map();
        this.animations = new Map();
    }

    addSprite(name, pixelData, colors, scale = 1) {
        this.sprites.set(name, new PixelArtSprite(pixelData, colors, scale));
    }

    addAnimation(name, frames, colors, scale = 1, frameDuration = 100) {
        this.animations.set(name, new PixelArtAnimation(frames, colors, scale, frameDuration));
    }

    drawSprite(name, x, y, flipped = false) {
        const sprite = this.sprites.get(name);
        if (sprite) {
            sprite.draw(this.ctx, x, y, flipped);
        }
    }

    drawAnimation(name, x, y, currentTime, flipped = false) {
        const animation = this.animations.get(name);
        if (animation) {
            animation.update(currentTime);
            animation.draw(this.ctx, x, y, flipped);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    fillBackground(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// ピクセルフォント用のヘルパー関数
function drawPixelText(ctx, text, x, y, scale = 1, color = '#FFFFFF') {
    // 簡易的な数字のピクセルデータ（3x5）
    const numbers = {
        '0': [
            [1,1,1],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,1,1]
        ],
        '1': [
            [0,1,0],
            [1,1,0],
            [0,1,0],
            [0,1,0],
            [1,1,1]
        ],
        '2': [
            [1,1,1],
            [0,0,1],
            [1,1,1],
            [1,0,0],
            [1,1,1]
        ],
        '3': [
            [1,1,1],
            [0,0,1],
            [1,1,1],
            [0,0,1],
            [1,1,1]
        ],
        '4': [
            [1,0,1],
            [1,0,1],
            [1,1,1],
            [0,0,1],
            [0,0,1]
        ],
        '5': [
            [1,1,1],
            [1,0,0],
            [1,1,1],
            [0,0,1],
            [1,1,1]
        ],
        '6': [
            [1,1,1],
            [1,0,0],
            [1,1,1],
            [1,0,1],
            [1,1,1]
        ],
        '7': [
            [1,1,1],
            [0,0,1],
            [0,1,0],
            [0,1,0],
            [0,1,0]
        ],
        '8': [
            [1,1,1],
            [1,0,1],
            [1,1,1],
            [1,0,1],
            [1,1,1]
        ],
        '9': [
            [1,1,1],
            [1,0,1],
            [1,1,1],
            [0,0,1],
            [1,1,1]
        ]
    };

    ctx.fillStyle = color;
    let offsetX = 0;
    
    for (let char of text) {
        if (numbers[char]) {
            const charData = numbers[char];
            charData.forEach((row, y) => {
                row.forEach((pixel, x) => {
                    if (pixel) {
                        ctx.fillRect(
                            x * scale + offsetX + x,
                            y * scale + y,
                            scale,
                            scale
                        );
                    }
                });
            });
            offsetX += 4 * scale; // 文字間隔
        } else if (char === ' ') {
            offsetX += 3 * scale;
        }
    }
}

export { PixelArtRenderer, PixelArtSprite, PixelArtAnimation, drawPixelText };