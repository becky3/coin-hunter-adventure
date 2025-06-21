/**
 * レベル検証テスト
 * レベル設計の静的解析を行い、基本的な問題を検出
 */

const fs = require('fs');
const path = require('path');

class LevelValidationTest {
    constructor() {
        this.issues = [];
    }

    // レベルデータを読み込む
    async loadLevelData(stageName = 'stage1') {
        try {
            const levelPath = path.join(__dirname, '..', 'levels', `${stageName}.json`);
            const data = fs.readFileSync(levelPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`レベルデータの読み込みに失敗: ${error.message}`);
        }
    }

    // 静的解析：レベルデータの基本チェック
    analyzeLevel(levelData) {
        const issues = [];
        
        // プラットフォームの配置チェック
        if (!levelData.platforms || !Array.isArray(levelData.platforms)) {
            issues.push({
                type: 'missing_platforms',
                severity: 'critical',
                message: 'プラットフォームデータが存在しません',
                position: 0
            });
            return issues;
        }

        const platforms = levelData.platforms;
        const groundPlatforms = platforms.filter(p => p.y === 476).sort((a, b) => a.x - b.x);
        
        // 大きすぎる隙間のチェック
        for (let i = 0; i < groundPlatforms.length - 1; i++) {
            const gap = groundPlatforms[i + 1].x - (groundPlatforms[i].x + groundPlatforms[i].width);
            if (gap > 200) {
                issues.push({
                    type: 'gap_too_large',
                    severity: 'high',
                    message: `地面プラットフォーム間の隙間が大きすぎます: ${gap}px`,
                    position: groundPlatforms[i].x
                });
            }
        }
        
        // ゴールの到達可能性チェック
        if (!levelData.goal || typeof levelData.goal.x !== 'number') {
            issues.push({
                type: 'missing_goal',
                severity: 'critical',
                message: 'ゴールフラグが設定されていません',
                position: 0
            });
        } else {
            const startX = 100;
            const goalX = levelData.goal.x;
            const totalDistance = goalX - startX;
            
            if (totalDistance > 4000) {
                issues.push({
                    type: 'level_too_long',
                    severity: 'medium',
                    message: `レベルが長すぎる可能性があります: ${totalDistance}px`,
                    position: goalX
                });
            }

            // 敵の密度チェック
            if (levelData.enemies && Array.isArray(levelData.enemies)) {
                const enemyDensity = levelData.enemies.length / (totalDistance / 1000);
                if (enemyDensity > 5) {
                    issues.push({
                        type: 'enemy_density_high',
                        severity: 'medium',
                        message: `敵の密度が高すぎます: ${enemyDensity.toFixed(1)}/1000px`,
                        position: 0
                    });
                }
            }
        }

        // 必須要素の存在チェック
        if (!levelData.coins || !Array.isArray(levelData.coins) || levelData.coins.length === 0) {
            issues.push({
                type: 'missing_coins',
                severity: 'low',
                message: 'コインが配置されていません',
                position: 0
            });
        }

        // プラットフォームの高低差チェック
        if (platforms.length > 0) {
            const minY = Math.min(...platforms.map(p => p.y));
            const maxY = Math.max(...platforms.map(p => p.y));
            const heightDiff = maxY - minY;
            
            if (heightDiff < 100) {
                issues.push({
                    type: 'insufficient_height_variation',
                    severity: 'low',
                    message: `高低差が不足しています: ${heightDiff}px`,
                    position: 0
                });
            }
        }
        
        return issues;
    }

    // テスト実行
    async runTests(stageName = 'stage1') {
        console.log(`🔍 レベル検証テスト実行中: ${stageName}`);
        
        try {
            // レベルデータの読み込み
            const levelData = await this.loadLevelData(stageName);
            
            // 静的解析
            const issues = this.analyzeLevel(levelData);
            
            // 結果をまとめる
            const criticalIssues = issues.filter(i => i.severity === 'critical');
            const highIssues = issues.filter(i => i.severity === 'high');
            const mediumIssues = issues.filter(i => i.severity === 'medium');
            const lowIssues = issues.filter(i => i.severity === 'low');
            
            const result = {
                success: criticalIssues.length === 0,
                stageName,
                summary: {
                    total: issues.length,
                    critical: criticalIssues.length,
                    high: highIssues.length,
                    medium: mediumIssues.length,
                    low: lowIssues.length
                },
                issues,
                levelStats: {
                    platforms: levelData.platforms ? levelData.platforms.length : 0,
                    enemies: levelData.enemies ? levelData.enemies.length : 0,
                    coins: levelData.coins ? levelData.coins.length : 0,
                    springs: levelData.springs ? levelData.springs.length : 0,
                    goalPosition: levelData.goal ? levelData.goal.x : 0
                }
            };
            
            return result;
        } catch (error) {
            return {
                success: false,
                stageName,
                error: error.message,
                summary: {
                    total: 1,
                    critical: 1,
                    high: 0,
                    medium: 0,
                    low: 0
                },
                issues: [{
                    type: 'test_error',
                    severity: 'critical',
                    message: error.message,
                    position: 0
                }]
            };
        }
    }

    // 結果の表示
    displayResults(result) {
        console.log('\n📊 レベル検証結果');
        console.log('─'.repeat(40));
        console.log(`ステージ: ${result.stageName}`);
        console.log(`結果: ${result.success ? '✅ 合格' : '❌ 重大な問題あり'}`);
        
        if (result.levelStats) {
            console.log('\n📈 レベル統計:');
            console.log(`  プラットフォーム: ${result.levelStats.platforms}個`);
            console.log(`  敵: ${result.levelStats.enemies}体`);
            console.log(`  コイン: ${result.levelStats.coins}枚`);
            console.log(`  スプリング: ${result.levelStats.springs}個`);
            console.log(`  ゴール位置: ${result.levelStats.goalPosition}px`);
        }
        
        console.log('\n🔍 問題サマリー:');
        console.log(`  合計: ${result.summary.total}件`);
        console.log(`  重大: ${result.summary.critical}件`);
        console.log(`  高: ${result.summary.high}件`);
        console.log(`  中: ${result.summary.medium}件`);
        console.log(`  低: ${result.summary.low}件`);
        
        if (result.issues.length > 0) {
            console.log('\n❗ 検出された問題:');
            result.issues.forEach((issue, index) => {
                const severityIcon = {
                    critical: '🔴',
                    high: '🟠',
                    medium: '🟡',
                    low: '🟢'
                }[issue.severity];
                console.log(`  ${index + 1}. ${severityIcon} [${issue.severity}] ${issue.message}`);
            });
        }
        
        if (result.error) {
            console.log(`\n❌ エラー: ${result.error}`);
        }
    }
}

// エクスポート
module.exports = LevelValidationTest;

// 直接実行された場合
if (require.main === module) {
    const validator = new LevelValidationTest();
    validator.runTests().then(result => {
        validator.displayResults(result);
        process.exit(result.success ? 0 : 1);
    });
}