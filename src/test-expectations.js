/**
 * テスト期待値定義システム
 * Claudeが自動的に検証できる期待値を定義
 */

class TestExpectations {
    constructor() {
        this.expectations = new Map();
        this.loadExpectations();
    }

    // 期待値の定義
    loadExpectations() {
        // プレイヤー移動テスト
        this.expectations.set('player-movement', {
            rightMove: {
                duration: 1000,
                minDistance: 50,
                maxDistance: 200,
                velocityRange: { min: 0, max: 5 }
            },
            leftMove: {
                duration: 1000,
                minDistance: 50,
                maxDistance: 200,
                velocityRange: { min: -5, max: 0 }
            },
            idle: {
                velocityTolerance: 0.1,
                positionTolerance: 0.5
            }
        });

        // ジャンプメカニクス
        this.expectations.set('jump-mechanics', {
            minJumpHeight: 40,
            maxJumpHeight: 120,
            jumpDuration: { min: 300, max: 1000 },
            gravity: 0.5,
            jumpVelocity: -10
        });

        // コイン収集
        this.expectations.set('coin-collection', {
            collectionRadius: 30,
            scoreIncrement: 1,
            animationFrames: 8
        });

        // 衝突検出
        this.expectations.set('collision-detection', {
            platformTolerance: 5,
            enemyDamageRadius: 25,
            springBounceHeight: 150
        });

        // ゲーム状態
        this.expectations.set('game-states', {
            validStates: ['menu', 'playing', 'paused', 'gameOver', 'levelComplete'],
            maxLives: 3,
            minLives: 0,
            maxCoins: 999,
            levelBounds: { x: { min: 0, max: 3000 }, y: { min: 0, max: 600 } }
        });
    }

    // 期待値の取得
    getExpectation(category, key) {
        const categoryExpectations = this.expectations.get(category);
        if (!categoryExpectations) {
            throw new Error(`Unknown expectation category: ${category}`);
        }
        return key ? categoryExpectations[key] : categoryExpectations;
    }

    // 値の検証
    validate(category, key, actual) {
        const expected = this.getExpectation(category, key);
        const result = {
            passed: true,
            expected: expected,
            actual: actual,
            errors: []
        };

        switch (category) {
            case 'player-movement':
                result.passed = this.validateMovement(key, expected, actual, result.errors);
                break;
            case 'jump-mechanics':
                result.passed = this.validateJump(key, expected, actual, result.errors);
                break;
            case 'coin-collection':
                result.passed = this.validateCoinCollection(expected, actual, result.errors);
                break;
            case 'collision-detection':
                result.passed = this.validateCollision(key, expected, actual, result.errors);
                break;
            case 'game-states':
                result.passed = this.validateGameState(key, expected, actual, result.errors);
                break;
        }

        return result;
    }

    // 移動検証
    validateMovement(type, expected, actual, errors) {
        if (type === 'rightMove' || type === 'leftMove') {
            if (Math.abs(actual.distance) < expected.minDistance) {
                errors.push(`Distance too small: ${actual.distance} < ${expected.minDistance}`);
                return false;
            }
            if (Math.abs(actual.distance) > expected.maxDistance) {
                errors.push(`Distance too large: ${actual.distance} > ${expected.maxDistance}`);
                return false;
            }
            if (actual.velocity < expected.velocityRange.min || 
                actual.velocity > expected.velocityRange.max) {
                errors.push(`Velocity out of range: ${actual.velocity}`);
                return false;
            }
        }
        return true;
    }

    // ジャンプ検証
    validateJump(key, expected, actual, errors) {
        if (actual.height < expected.minJumpHeight) {
            errors.push(`Jump too low: ${actual.height} < ${expected.minJumpHeight}`);
            return false;
        }
        if (actual.height > expected.maxJumpHeight) {
            errors.push(`Jump too high: ${actual.height} > ${expected.maxJumpHeight}`);
            return false;
        }
        return true;
    }

    // コイン収集検証
    validateCoinCollection(expected, actual, errors) {
        if (actual.distance > expected.collectionRadius) {
            errors.push(`Collection distance too large: ${actual.distance}`);
            return false;
        }
        if (actual.scoreChange !== expected.scoreIncrement) {
            errors.push(`Incorrect score increment: ${actual.scoreChange}`);
            return false;
        }
        return true;
    }

    // 衝突検証
    validateCollision(type, expected, actual, errors) {
        switch (type) {
            case 'platform':
                if (actual.penetration > expected.platformTolerance) {
                    errors.push(`Platform penetration too deep: ${actual.penetration}`);
                    return false;
                }
                break;
            case 'enemy':
                if (actual.distance < expected.enemyDamageRadius && !actual.damaged) {
                    errors.push(`Should have taken damage at distance: ${actual.distance}`);
                    return false;
                }
                break;
        }
        return true;
    }

    // ゲーム状態検証
    validateGameState(key, expected, actual, errors) {
        if (key === 'state' && !expected.validStates.includes(actual)) {
            errors.push(`Invalid game state: ${actual}`);
            return false;
        }
        if (key === 'lives' && (actual < expected.minLives || actual > expected.maxLives)) {
            errors.push(`Lives out of range: ${actual}`);
            return false;
        }
        if (key === 'position') {
            if (actual.x < expected.levelBounds.x.min || actual.x > expected.levelBounds.x.max) {
                errors.push(`X position out of bounds: ${actual.x}`);
                return false;
            }
            if (actual.y < expected.levelBounds.y.min || actual.y > expected.levelBounds.y.max) {
                errors.push(`Y position out of bounds: ${actual.y}`);
                return false;
            }
        }
        return true;
    }

    // カスタム期待値の追加
    addCustomExpectation(category, key, value) {
        if (!this.expectations.has(category)) {
            this.expectations.set(category, {});
        }
        this.expectations.get(category)[key] = value;
    }

    // 期待値のエクスポート
    exportExpectations() {
        const obj = {};
        this.expectations.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }

    // 期待値のインポート
    importExpectations(data) {
        Object.keys(data).forEach(category => {
            this.expectations.set(category, data[category]);
        });
    }
}

// シングルトンインスタンス
const testExpectations = new TestExpectations();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestExpectations, testExpectations };
}