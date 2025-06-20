/**
 * スコアアニメーションクラス
 */

class ScoreAnimation {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.opacity = 1;
        this.lifetime = 60; // フレーム数
        this.velY = -2;
    }
    
    update() {
        this.y += this.velY;
        this.velY *= 0.95; // 徐々に減速
        this.lifetime--;
        this.opacity = this.lifetime / 60;
        
        return this.lifetime > 0;
    }
    
    render(ctx, camera) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        
        const screenX = this.x - camera.x;
        ctx.strokeText(`+${this.value}`, screenX, this.y);
        ctx.fillText(`+${this.value}`, screenX, this.y);
        
        ctx.restore();
    }
}

// エクスポート  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreAnimation;
}