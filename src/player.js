/**
 * プレイヤークラス
 */

// グローバル変数から設定を読み込み
const PLAYER_CONFIG = typeof window !== 'undefined' && window.PLAYER_CONFIG ? window.PLAYER_CONFIG : {
    width: 40,
    height: 40,
    speed: 5,
    jumpPower: -12,
    maxHealth: 3,
    invulnerabilityTime: 120,
    spawnX: 100,
    spawnY: 300,
    minJumpTime: 5,
    maxJumpTime: 20
};

const GRAVITY = typeof window !== 'undefined' && window.GRAVITY ? window.GRAVITY : 0.5;
const CANVAS_WIDTH = typeof window !== 'undefined' && window.CANVAS_WIDTH ? window.CANVAS_WIDTH : 1024;
const CANVAS_HEIGHT = typeof window !== 'undefined' && window.CANVAS_HEIGHT ? window.CANVAS_HEIGHT : 576;

class Player {
    constructor() {
        this.width = PLAYER_CONFIG.width;
        this.height = PLAYER_CONFIG.height;
        this.x = PLAYER_CONFIG.spawnX;
        this.y = PLAYER_CONFIG.spawnY;
        this.velX = 0;
        this.velY = 0;
        this.speed = PLAYER_CONFIG.speed;
        this.jumpPower = PLAYER_CONFIG.jumpPower;
        this.onGround = false;
        this.health = PLAYER_CONFIG.maxHealth;
        this.maxHealth = PLAYER_CONFIG.maxHealth;
        this.isDead = false;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.facing = 'right';
        this.animFrame = 0;
        this.animTimer = 0;
        
        // ジャンプ制御用
        this.isJumping = false;
        this.jumpButtonPressed = false;
        this.jumpTime = 0;
        this.canVariableJump = false;
        this.jumpButtonHoldTime = 0;
        this.lastJumpStats = null;
        this.jumpMaxHeight = 0;
        this.jumpStartY = 0;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    update(input) {
        if (this.isDead) return;
        
        // アニメーション更新
        this.animTimer++;
        if (this.animTimer % 8 === 0) {
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        // 移動処理
        if (input.left) {
            this.velX = -this.speed;
            this.facing = 'left';
        } else if (input.right) {
            this.velX = this.speed;
            this.facing = 'right';
        } else {
            this.velX *= 0.8;
        }
        
        // ジャンプ処理
        this.handleJump(input);
        
        // 重力適用
        this.velY += GRAVITY;
        
        // 位置更新
        const oldX = this.x;
        const oldY = this.y;
        const newX = this.x + this.velX;
        const newY = this.y + this.velY;
        
        if (isFinite(newX) && isFinite(newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            console.error('無効な位置計算:', newX, newY);
            this.velX = 0;
            this.velY = 0;
        }
        
        // ジャンプ中の最高到達点を記録
        if (this.isJumping && !this.onGround) {
            const currentHeight = this.jumpStartY - this.y;
            if (currentHeight > this.jumpMaxHeight) {
                this.jumpMaxHeight = currentHeight;
            }
        }
        
        if (this.invulnerable) {
            this.invulnerabilityTime--;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    handleJump(input) {
        // ジャンプボタンが押された瞬間
        if (input.jump && !this.jumpButtonPressed && this.onGround) {
            this.velY = this.jumpPower;
            this.onGround = false;
            this.isJumping = true;
            this.jumpButtonPressed = true;
            this.jumpTime = 0;
            this.canVariableJump = true;
            this.jumpButtonHoldTime = 0;
            this.jumpMaxHeight = 0;
            this.jumpStartY = this.y;
        }
        
        // ジャンプ時間をカウント
        if (this.isJumping && !this.onGround) {
            this.jumpTime++;
        }
        
        // 可変ジャンプ処理
        if (this.canVariableJump && this.isJumping && !this.onGround) {
            // ジャンプボタンが押されている間の処理
            if (input.jump) {
                this.jumpButtonHoldTime++;
                
                // 最大保持時間内なら継続的な上昇力を付与
                if (this.jumpTime < PLAYER_CONFIG.maxJumpTime && this.velY < 0) {
                    // 重力を相殺して上昇を維持（倍率を1.8倍に調整）
                    this.velY -= GRAVITY * 1.8; // 重力の1.8倍を相殺で適度な高さに調整
                } else if (this.jumpTime >= PLAYER_CONFIG.maxJumpTime && this.velY < 0) {
                    // 最大時間に達したら上昇を停止
                    this.velY = 0;
                    this.canVariableJump = false;
                }
            } else {
                // ボタンが離された時
                if (this.jumpTime >= PLAYER_CONFIG.minJumpTime && this.velY < 0) {
                    // 最小時間経過後なら上昇を即座に停止
                    this.velY = 0;
                }
                // 最小時間前に離した場合は、最小時間まで上昇を継続
                this.jumpButtonPressed = false;
                this.canVariableJump = false;
            }
        }
        
        // ジャンプ状態のリセット
        if (!input.jump) {
            this.jumpButtonPressed = false;
        }
        
        // 着地判定
        if (this.onGround && this.isJumping) {
            this.isJumping = false;
            this.canVariableJump = false;
            
            // ジャンプ統計を記録
            this.recordJumpStats();
        }
    }
    
    takeDamage() {
        if (this.invulnerable) {
            return false;
        }
        
        this.health--;
        this.invulnerable = true;
        this.invulnerabilityTime = PLAYER_CONFIG.invulnerabilityTime;
        
        if (this.health <= 0) {
            this.isDead = true;
            return true;
        }
        
        return false;
    }
    
    reset() {
        this.x = PLAYER_CONFIG.spawnX;
        this.y = PLAYER_CONFIG.spawnY;
        this.velX = 0;
        this.velY = 0;
        this.health = PLAYER_CONFIG.maxHealth;
        this.isDead = false;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.isJumping = false;
        this.jumpButtonPressed = false;
        this.jumpTime = 0;
        this.canVariableJump = false;
        this.onGround = false;
    }
    
    recordJumpStats() {
        this.lastJumpStats = {
            buttonHoldTime: this.jumpButtonHoldTime,
            actualJumpTime: this.jumpTime,
            maxHeight: this.jumpMaxHeight,
            heightInPlayerUnits: (this.jumpMaxHeight / this.height).toFixed(1)
        };
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}