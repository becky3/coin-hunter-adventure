/**
 * 入力管理クラス
 */

class InputManager {
    constructor() {
        this.keys = {};
        this.lastKeys = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            
            // @キーの直接検出とデバッグ切り替え
            if (e.key === '@') {
                if (window.game) {
                    window.game.showJumpDebug = !window.game.showJumpDebug;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }
    
    update() {
        // 前フレームの状態を保存
        this.lastKeys = { ...this.keys };
    }
    
    getInput() {
        return {
            left: this.keys['ArrowLeft'] || this.keys['KeyA'],
            right: this.keys['ArrowRight'] || this.keys['KeyD'],
            jump: this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'],
            action: this.keys['Enter'] || this.keys['KeyE']
        };
    }
    
    isKeyJustPressed(keyCode) {
        return this.keys[keyCode] && !this.lastKeys[keyCode];
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode];
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}