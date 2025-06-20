/**
 * ゲーム状態管理クラス
 */

class GameState {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.time = 0;
        this.state = 'start'; // start, playing, paused, gameOver, levelComplete
        this.currentLevel = 1;
        this.coinsCollected = 0;
        this.enemiesDefeated = 0;
        this.maxTime = 300; // 5分のタイムリミット
    }
    
    // スコア加算
    addScore(points) {
        this.score += points;
    }
    
    // コイン収集
    collectCoin() {
        this.coinsCollected++;
        this.addScore(10);
    }
    
    // 敵撃破
    defeatEnemy() {
        this.enemiesDefeated++;
        this.addScore(100);
    }
    
    // ライフ減少
    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.setState('gameOver');
            return true; // ゲームオーバー
        }
        return false;
    }
    
    // 時間更新
    updateTime(deltaTime) {
        this.time += deltaTime;
        if (this.time >= this.maxTime) {
            this.setState('gameOver');
            return true; // タイムアップ
        }
        return false;
    }
    
    // 状態変更
    setState(newState) {
        this.state = newState;
    }
    
    // ゲーム中判定
    isPlaying() {
        return this.state === 'playing';
    }
    
    // リセット
    reset() {
        this.score = 0;
        this.lives = 3;
        this.time = 0;
        this.coinsCollected = 0;
        this.enemiesDefeated = 0;
        this.state = 'playing';
    }
    
    // レベルクリア
    completeLevel() {
        this.setState('levelComplete');
        // ボーナススコア（残り時間）
        const timeBonus = Math.floor((this.maxTime - this.time) * 10);
        this.addScore(timeBonus);
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}