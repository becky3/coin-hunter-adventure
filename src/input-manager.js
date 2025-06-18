/**
 * 入力管理クラス
 */

class InputManager {
    constructor() {
        this.keys = {};
        this.lastKeys = {};
        
        // イベントハンドラを保存して後でクリーンアップできるようにする
        this.keydownHandler = this.handleKeydown.bind(this);
        this.keyupHandler = this.handleKeyup.bind(this);
        this.blurHandler = this.handleBlur.bind(this);
        
        this.setupEventListeners();
    }
    
    handleKeydown(e) {
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
    }
    
    handleKeyup(e) {
        this.keys[e.code] = false;
    }
    
    handleBlur() {
        this.keys = {};
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        window.addEventListener('blur', this.blurHandler);
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
    
    // クリーンアップ
    destroy() {
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);
        window.removeEventListener('blur', this.blurHandler);
        this.keys = {};
        this.lastKeys = {};
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}