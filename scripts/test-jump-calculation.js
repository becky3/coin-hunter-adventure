#!/usr/bin/env node

/**
 * ジャンプ速度計算のテスト
 */

// 設定値
const GRAVITY = 0.65;
const JUMP_POWER = 12;

console.log('=== ジャンプ速度計算テスト ===');
console.log(`設定値: GRAVITY = ${GRAVITY}, JUMP_POWER = ${JUMP_POWER}`);
console.log('');

// Player.updateメソッドの処理順序をシミュレート
function simulateJumpFrame(onGround, jumpPressed) {
    let velY = 0;
    let isJumping = false;
    let canVariableJump = false;
    let jumpTime = 0;
    
    // 1. handleJump処理
    if (jumpPressed && onGround) {
        velY = -JUMP_POWER;
        isJumping = true;
        canVariableJump = true;
        console.log(`1. handleJump後: velY = ${velY}`);
    }
    
    // 2. 重力適用
    velY += GRAVITY;
    console.log(`2. 重力適用後: velY = ${velY} (${-JUMP_POWER} + ${GRAVITY})`);
    
    // 3. 可変ジャンプ処理（最初のフレームで適用される）
    if (canVariableJump && isJumping && jumpPressed && jumpTime < 20) {
        velY -= GRAVITY * 1.8;
        console.log(`3. 可変ジャンプ処理後: velY = ${velY} (重力の1.8倍を相殺)`);
    }
    
    return velY;
}

console.log('最初のジャンプフレームのシミュレーション:');
const resultVelY = simulateJumpFrame(true, true);
console.log('');
console.log(`最終的なvelY: ${resultVelY}`);
console.log(`計算式: -${JUMP_POWER} + ${GRAVITY} - (${GRAVITY} * 1.8) = ${resultVelY}`);
console.log('');

// テストで期待される値との比較
const expectedInOldTest = -JUMP_POWER;
const expectedInNewTest = -JUMP_POWER + GRAVITY - (GRAVITY * 1.8);

console.log('テスト期待値の比較:');
console.log(`古いテストの期待値: ${expectedInOldTest}`);
console.log(`新しいテストの期待値: ${expectedInNewTest.toFixed(2)}`);
console.log(`実際の計算結果: ${resultVelY.toFixed(2)}`);
console.log('');

if (Math.abs(resultVelY - expectedInNewTest) < 0.01) {
    console.log('✅ 新しいテストの期待値と一致します');
} else {
    console.log('❌ 期待値と一致しません');
}