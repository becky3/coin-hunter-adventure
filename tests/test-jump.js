/**
 * ジャンプ機能のテスト
 */

function testJumpFunctionality() {
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        details: []
    };
    
    function assert(condition, testName, details = '') {
        results.total++;
        if (condition) {
            results.passed++;
            results.details.push(`✅ ${testName}`);
        } else {
            results.failed++;
            results.details.push(`❌ ${testName}: ${details}`);
        }
    }
    
    // ゲームが初期化されているか確認
    assert(window.game !== undefined, 'ゲームインスタンスが存在する');
    assert(window.game.player !== undefined, 'プレイヤーが存在する');
    
    if (!window.game || !window.game.player) {
        return results;
    }
    
    const player = window.game.player;
    const initialY = player.y;
    
    // 初期状態のテスト
    assert(player.onGround === true || player.onGround === false, 
           'onGroundフラグが定義されている', 
           `onGround: ${player.onGround}`);
    
    // プレイヤーの位置情報
    results.details.push(`📍 プレイヤー位置: x=${player.x}, y=${player.y}`);
    results.details.push(`📍 onGround: ${player.onGround}`);
    results.details.push(`📍 velY: ${player.velY}`);
    
    // プラットフォームとの位置関係を確認
    if (window.game.platforms && window.game.platforms.length > 0) {
        const firstPlatform = window.game.platforms[0];
        results.details.push(`📍 最初のプラットフォーム: y=${firstPlatform.y}, height=${firstPlatform.height}`);
        
        const expectedPlayerY = firstPlatform.y - player.height;
        const isOnPlatform = Math.abs(player.y - expectedPlayerY) < 5;
        
        results.details.push(`📍 プレイヤーがプラットフォーム上にいる: ${isOnPlatform}`);
        results.details.push(`📍 期待されるY座標: ${expectedPlayerY}, 実際のY座標: ${player.y}`);
    }
    
    // ジャンプのシミュレーション
    if (player.onGround) {
        // ジャンプ前の状態を記録
        const beforeJump = {
            y: player.y,
            velY: player.velY,
            onGround: player.onGround,
            isJumping: player.isJumping
        };
        
        // ジャンプを実行
        const jumpInput = { jump: true };
        player.handleJump(jumpInput);
        
        // ジャンプ後の状態を確認
        assert(player.velY < 0, 'ジャンプ後のvelYが負の値', 
               `velY: ${beforeJump.velY} → ${player.velY}`);
        assert(player.isJumping === true, 'isJumpingフラグがtrue');
        assert(player.onGround === false, 'onGroundフラグがfalse');
        
        results.details.push(`📍 ジャンプ実行: velY=${beforeJump.velY} → ${player.velY}`);
    } else {
        results.details.push(`⚠️ プレイヤーが地面にいないためジャンプテストをスキップ`);
    }
    
    // 入力システムのテスト
    if (window.game.inputManager) {
        const input = window.game.inputManager.getInput();
        results.details.push(`📍 入力状態: jump=${input.jump}, left=${input.left}, right=${input.right}`);
    }
    
    return results;
}

// テスト実行
if (typeof window !== 'undefined' && window.game && window.game.isInitialized) {
    window.jumpTestResults = testJumpFunctionality();
    console.log('ジャンプテスト結果:', window.jumpTestResults);
} else {
    console.log('ゲームが初期化されていません。ゲーム開始後に再度テストしてください。');
}