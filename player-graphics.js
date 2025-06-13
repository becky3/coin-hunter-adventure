/**
 * プレイヤーキャラクターのグラフィックリソース
 * 描画情報を構造化して管理
 */

// プレイヤーグラフィック設定
const PLAYER_GRAPHICS_CONFIG = {
    // 基本色設定
    colors: {
        skin: '#F4C2A1',           // 自然な肌色
        clothHealthy: '#6B8EC8',   // 青い服（健康時）
        clothDamaged: '#E3A8C7',   // ピンクの服（ダメージ時）
        hatHealthy: '#8BC34A',     // 緑の帽子（健康時）
        hatDamaged: '#FFB74D',     // オレンジの帽子（ダメージ時）
        eye: '#2C2C2C',           // 目の色
        nose: '#E6967A',          // 鼻の色
        mouth: '#8B4513'          // 口の色
    },
    
    // サイズ比率設定
    ratios: {
        // 体のパーツ
        body: { width: 0.35, height: 0.25 },
        head: { width: 0.3, height: 0.26 },
        hat: { width: 0.32, height: 0.28 },
        hatBrim: { width: 0.25, height: 0.1 },
        
        // 顔のパーツ
        eye: 0.06,
        nose: { width: 0.025, height: 0.015 },
        mouth: 0.06,
        
        // 手足
        arm: 0.07,
        armBack: 0.06,
        leg: 0.08,
        legBack: 0.07
    },
    
    // 位置設定
    positions: {
        // 体の位置
        body: { x: 0.5, y: 0.65 },
        head: { x: 0.5, y: 0.35 },
        hat: { x: 0.5, y: 0.35 },
        hatBrim: { x: 0.65, y: 0.35 },
        
        // 顔のパーツ位置
        eye: { x: 0.6, y: 0.32 },
        nose: { x: 0.72, y: 0.37 },
        mouth: { x: 0.68, y: 0.41 },
        
        // 待機ポーズの手足位置
        idle: {
            armBack: { x: 0.25, y: 0.58 },
            armFront: { x: 0.75, y: 0.58 },
            legBack: { x: 0.35, y: 0.85 },
            legFront: { x: 0.65, y: 0.85 }
        },
        
        // 歩行ポーズ1の手足位置
        walk1: {
            body: { x: 0.52, y: 0.67 },
            head: { x: 0.55, y: 0.35 },
            armBack: { x: 0.15, y: 0.50 },
            armFront: { x: 0.85, y: 0.65 },
            legBack: { x: 0.3, y: 0.88 },
            legFront: { x: 0.75, y: 0.75 }
        },
        
        // 歩行ポーズ2の手足位置
        walk2: {
            body: { x: 0.48, y: 0.67 },
            head: { x: 0.45, y: 0.35 },
            armBack: { x: 0.15, y: 0.65 },
            armFront: { x: 0.85, y: 0.50 },
            legBack: { x: 0.25, y: 0.75 },
            legFront: { x: 0.7, y: 0.88 }
        },
        
        // ジャンプポーズの手足位置
        jump: {
            body: { x: 0.5, y: 0.6 },
            head: { x: 0.5, y: 0.3 },
            armBack: { x: 0.05, y: 0.25 },
            armFront: { x: 0.9, y: 0.2 },
            legBack: { x: 0.15, y: 0.65 },
            legFront: { x: 0.85, y: 0.7 }
        }
    },
    
    // アニメーション設定
    animation: {
        walkFrameDuration: 15,  // 歩行アニメーションのフレーム時間
        blinkDuration: 180,     // まばたきの間隔
        blinkFrames: 5          // まばたきの持続フレーム
    }
};

// プレイヤーグラフィック描画クラス
class PlayerGraphicsRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.config = PLAYER_GRAPHICS_CONFIG;
    }
    
    // メイン描画メソッド
    drawPlayer(x, y, width, height, health, direction, invulnerable, animFrame, velX = 0, velY = 0) {
        const colors = this.getColors(health);
        const scale = health === 2 ? 1.0 : 0.85;
        const actualWidth = width * scale;
        const actualHeight = height * scale;
        const offsetY = health === 1 ? height * 0.15 : 0;
        
        // アニメーション状態を判定
        const animState = this.getAnimationState(velX, velY, animFrame);
        const eyeBlink = this.getEyeBlinkState(animFrame);
        
        this.ctx.save();
        
        // 無敵時間中の点滅
        if (invulnerable) {
            this.ctx.globalAlpha = animFrame % 8 < 4 ? 0.6 : 1.0;
        }
        
        // 向きによる反転
        this.ctx.translate(x + width / 2, y + offsetY);
        if (direction < 0) {
            this.ctx.scale(-1, 1);
        }
        this.ctx.translate(-actualWidth / 2, 0);
        
        // 状態に応じた描画
        this.drawPlayerPose(actualWidth, actualHeight, colors, animState, eyeBlink);
        
        this.ctx.restore();
    }
    
    // 健康状態に応じた色を取得
    getColors(health) {
        const config = this.config.colors;
        return {
            skin: config.skin,
            cloth: health === 2 ? config.clothHealthy : config.clothDamaged,
            hat: health === 2 ? config.hatHealthy : config.hatDamaged,
            eye: config.eye,
            nose: config.nose,
            mouth: config.mouth
        };
    }
    
    // アニメーション状態を判定
    getAnimationState(velX, velY, animFrame) {
        const isMoving = Math.abs(velX) > 0.1;
        const isJumping = velY < -1;
        const isOnGround = velY >= -0.1 && velY <= 0.1;
        
        if (isJumping) {
            return 'jump';
        } else if (isMoving && isOnGround) {
            return Math.floor(animFrame / this.config.animation.walkFrameDuration) % 2 === 0 ? 'walk1' : 'walk2';
        } else {
            return 'idle';
        }
    }
    
    // まばたき状態を取得
    getEyeBlinkState(animFrame) {
        return animFrame % this.config.animation.blinkDuration > 
               (this.config.animation.blinkDuration - this.config.animation.blinkFrames) ? 0.2 : 1.0;
    }
    
    // ポーズに応じた描画
    drawPlayerPose(actualWidth, actualHeight, colors, animState, eyeBlink) {
        switch (animState) {
            case 'jump':
                this.drawJumpPose(actualWidth, actualHeight, colors, eyeBlink);
                break;
            case 'walk1':
                this.drawWalk1Pose(actualWidth, actualHeight, colors, eyeBlink);
                break;
            case 'walk2':
                this.drawWalk2Pose(actualWidth, actualHeight, colors, eyeBlink);
                break;
            default:
                this.drawIdlePose(actualWidth, actualHeight, colors, eyeBlink);
                break;
        }
    }
    
    // 待機ポーズ描画
    drawIdlePose(actualWidth, actualHeight, colors, eyeBlink) {
        const pos = this.config.positions.idle;
        
        // 体
        this.drawBody(actualWidth, actualHeight, colors.cloth, pos.body || this.config.positions.body);
        
        // 頭
        this.drawHead(actualWidth, actualHeight, colors.skin, this.config.positions.head);
        
        // 顔
        this.drawFace(actualWidth, actualHeight, colors, eyeBlink);
        
        // 手足
        this.drawLimbs(actualWidth, actualHeight, colors.skin, pos);
    }
    
    // 歩行ポーズ1描画
    drawWalk1Pose(actualWidth, actualHeight, colors, eyeBlink) {
        const pos = this.config.positions.walk1;
        
        // 体（前傾）
        this.drawBodyTilted(actualWidth, actualHeight, colors.cloth, pos.body, 0.1);
        
        // 頭
        this.drawHead(actualWidth, actualHeight, colors.skin, pos.head);
        
        // 顔（オフセット付き）
        this.drawFace(actualWidth, actualHeight, colors, eyeBlink, 0.05);
        
        // 手足
        this.drawLimbs(actualWidth, actualHeight, colors.skin, pos);
    }
    
    // 歩行ポーズ2描画
    drawWalk2Pose(actualWidth, actualHeight, colors, eyeBlink) {
        const pos = this.config.positions.walk2;
        
        // 体（前傾）
        this.drawBodyTilted(actualWidth, actualHeight, colors.cloth, pos.body, -0.1);
        
        // 頭
        this.drawHead(actualWidth, actualHeight, colors.skin, pos.head);
        
        // 顔（オフセット付き）
        this.drawFace(actualWidth, actualHeight, colors, eyeBlink, -0.05);
        
        // 手足
        this.drawLimbs(actualWidth, actualHeight, colors.skin, pos);
    }
    
    // ジャンプポーズ描画
    drawJumpPose(actualWidth, actualHeight, colors, eyeBlink) {
        const pos = this.config.positions.jump;
        
        // 体
        this.drawBody(actualWidth, actualHeight, colors.cloth, pos.body, { width: 0.32, height: 0.28 });
        
        // 頭
        this.drawHead(actualWidth, actualHeight, colors.skin, pos.head);
        
        // 顔
        this.drawFace(actualWidth, actualHeight, colors, eyeBlink);
        
        // 手足
        this.drawLimbs(actualWidth, actualHeight, colors.skin, pos);
        
        // ジャンプエフェクト
        this.drawJumpEffects(actualWidth, actualHeight);
    }
    
    // 基本的な体の描画
    drawBody(actualWidth, actualHeight, color, position, customSize = null) {
        const size = customSize || this.config.ratios.body;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(
            actualWidth * position.x,
            actualHeight * position.y,
            actualWidth * size.width,
            actualHeight * size.height,
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();
    }
    
    // 傾いた体の描画
    drawBodyTilted(actualWidth, actualHeight, color, position, tilt) {
        const size = this.config.ratios.body;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(
            actualWidth * position.x,
            actualHeight * position.y,
            actualWidth * size.width,
            actualHeight * size.height,
            tilt, 0, 2 * Math.PI
        );
        this.ctx.fill();
    }
    
    // 頭の描画
    drawHead(actualWidth, actualHeight, color, position) {
        const size = this.config.ratios.head;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(
            actualWidth * position.x,
            actualHeight * position.y,
            actualWidth * size.width,
            actualWidth * size.height,
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();
    }
    
    // 顔の描画
    drawFace(actualWidth, actualHeight, colors, eyeBlink, offsetX = 0) {
        // 帽子
        this.drawHat(actualWidth, actualHeight, colors.hat, offsetX);
        
        // 目
        this.drawEye(actualWidth, actualHeight, colors.eye, eyeBlink, offsetX);
        
        // 鼻
        this.drawNose(actualWidth, actualHeight, colors.nose, offsetX);
        
        // 口
        this.drawMouth(actualWidth, actualHeight, colors.mouth, offsetX);
    }
    
    // 帽子の描画
    drawHat(actualWidth, actualHeight, color, offsetX = 0) {
        const hatPos = this.config.positions.hat;
        const hatSize = this.config.ratios.hat;
        const brimPos = this.config.positions.hatBrim;
        const brimSize = this.config.ratios.hatBrim;
        
        this.ctx.fillStyle = color;
        
        // 帽子本体
        this.ctx.beginPath();
        this.ctx.ellipse(
            actualWidth * (hatPos.x + offsetX),
            actualHeight * hatPos.y,
            actualWidth * hatSize.width,
            actualWidth * hatSize.height,
            0, Math.PI, 2 * Math.PI
        );
        this.ctx.fill();
        
        // つば
        this.ctx.beginPath();
        this.ctx.ellipse(
            actualWidth * (brimPos.x + offsetX),
            actualHeight * brimPos.y,
            actualWidth * brimSize.width,
            actualWidth * brimSize.height,
            0, 0, Math.PI
        );
        this.ctx.fill();
    }
    
    // 目の描画
    drawEye(actualWidth, actualHeight, color, eyeBlink, offsetX = 0) {
        const eyePos = this.config.positions.eye;
        const eyeSize = actualWidth * this.config.ratios.eye;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            actualWidth * (eyePos.x + offsetX),
            actualHeight * eyePos.y,
            eyeSize * eyeBlink,
            0, 2 * Math.PI
        );
        this.ctx.fill();
    }
    
    // 鼻の描画
    drawNose(actualWidth, actualHeight, color, offsetX = 0) {
        const nosePos = this.config.positions.nose;
        const noseSize = this.config.ratios.nose;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(
            actualWidth * (nosePos.x + offsetX),
            actualHeight * nosePos.y,
            actualWidth * noseSize.width,
            actualWidth * noseSize.height,
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();
    }
    
    // 口の描画
    drawMouth(actualWidth, actualHeight, color, offsetX = 0) {
        const mouthPos = this.config.positions.mouth;
        const mouthSize = actualWidth * this.config.ratios.mouth;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(
            actualWidth * (mouthPos.x + offsetX),
            actualHeight * mouthPos.y,
            mouthSize,
            0.1 * Math.PI, 0.5 * Math.PI
        );
        this.ctx.stroke();
    }
    
    // 手足の描画
    drawLimbs(actualWidth, actualHeight, color, positions) {
        this.ctx.fillStyle = color;
        
        // 後ろの手
        if (positions.armBack) {
            this.ctx.beginPath();
            this.ctx.arc(
                actualWidth * positions.armBack.x,
                actualHeight * positions.armBack.y,
                actualWidth * this.config.ratios.armBack,
                0, 2 * Math.PI
            );
            this.ctx.fill();
        }
        
        // 前の手
        if (positions.armFront) {
            this.ctx.beginPath();
            this.ctx.arc(
                actualWidth * positions.armFront.x,
                actualHeight * positions.armFront.y,
                actualWidth * this.config.ratios.arm,
                0, 2 * Math.PI
            );
            this.ctx.fill();
        }
        
        // 後ろの足
        if (positions.legBack) {
            this.ctx.beginPath();
            this.ctx.arc(
                actualWidth * positions.legBack.x,
                actualHeight * positions.legBack.y,
                actualWidth * this.config.ratios.legBack,
                0, 2 * Math.PI
            );
            this.ctx.fill();
        }
        
        // 前の足
        if (positions.legFront) {
            this.ctx.beginPath();
            this.ctx.arc(
                actualWidth * positions.legFront.x,
                actualHeight * positions.legFront.y,
                actualWidth * this.config.ratios.leg,
                0, 2 * Math.PI
            );
            this.ctx.fill();
        }
    }
    
    // ジャンプエフェクトの描画
    drawJumpEffects(actualWidth, actualHeight) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        // 動きの軌跡線
        this.ctx.beginPath();
        this.ctx.moveTo(actualWidth * 0.1, actualHeight * 0.3);
        this.ctx.lineTo(actualWidth * 0.15, actualHeight * 0.35);
        this.ctx.moveTo(actualWidth * 0.85, actualHeight * 0.25);
        this.ctx.lineTo(actualWidth * 0.9, actualHeight * 0.3);
        this.ctx.stroke();
    }
}

// Node.js環境用のエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PLAYER_GRAPHICS_CONFIG,
        PlayerGraphicsRenderer
    };
}

// ブラウザ環境用のグローバル設定
if (typeof window !== 'undefined') {
    window.PLAYER_GRAPHICS_CONFIG = PLAYER_GRAPHICS_CONFIG;
    window.PlayerGraphicsRenderer = PlayerGraphicsRenderer;
}