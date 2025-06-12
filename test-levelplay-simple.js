/**
 * 簡易レベルテストプレイ
 * 短時間でレベルの基本的な問題を検出
 */

class SimpleLevelTest {
    constructor() {
        this.maxTime = 30; // 最大30秒
        this.testSpeed = 5; // 5倍速でテスト
    }
    
    // 静的解析：レベルデータの基本チェック
    analyzeLevel() {
        const issues = [];
        
        // プラットフォームの配置チェック
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
        
        // ゴールの到達可能性チェック（基本的な距離計算）
        const startX = 100;
        const goalX = levelData.flag.x;
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
        const enemyDensity = levelData.enemies.length / (totalDistance / 1000);
        if (enemyDensity > 5) {
            issues.push({
                type: 'enemy_density_high',
                severity: 'medium',
                message: `敵の密度が高すぎます: ${enemyDensity.toFixed(1)}/1000px`,
                position: 0
            });
        }
        
        return issues;
    }
    
    // 高速シミュレーション：進行可能性チェック
    async quickSimulation() {
        const issues = [];
        
        // 簡単なAIで進行をテスト
        let playerX = 100;
        let playerY = 300;
        let onGround = true;
        let progress = 0;
        let stuckCounter = 0;
        let lastX = playerX;
        
        const maxIterations = 1000;
        
        for (let i = 0; i < maxIterations; i++) {
            // 基本的に右に進む
            playerX += 5;
            
            // スタック検出
            if (Math.abs(playerX - lastX) < 1) {
                stuckCounter++;
            } else {
                stuckCounter = 0;
            }
            lastX = playerX;
            
            if (stuckCounter > 50) {
                issues.push({
                    type: 'stuck_detected',
                    severity: 'high',
                    message: `プレイヤーがスタックする可能性があります`,
                    position: playerX
                });
                break;
            }
            
            // プラットフォーム衝突チェック
            const currentPlatform = levelData.platforms.find(p => 
                playerX >= p.x && 
                playerX <= p.x + p.width &&
                Math.abs(playerY + 60 - p.y) < 10
            );
            
            if (currentPlatform) {
                onGround = true;
                playerY = currentPlatform.y - 60;
            } else {
                onGround = false;
                // 落下シミュレーション
                playerY += 2;
                
                // 落下死チェック
                if (playerY > 600) {
                    // 近くにプラットフォームがあるかチェック
                    const nearbyPlatform = levelData.platforms.find(p => 
                        Math.abs(p.x - playerX) < 100 && p.y < 600
                    );
                    
                    if (!nearbyPlatform) {
                        issues.push({
                            type: 'death_pit',
                            severity: 'high',
                            message: `落下死の可能性があります`,
                            position: playerX
                        });
                    }
                    break;
                }
            }
            
            // 進行度計算
            progress = (playerX / levelData.flag.x) * 100;
            
            // ゴールに到達
            if (playerX >= levelData.flag.x) {
                break;
            }
        }
        
        return { issues, progress, finalPosition: playerX };
    }
    
    // 総合テスト実行
    async runQuickTest() {
        console.log('\n=== 簡易レベルテスト実行 ===');
        
        const startTime = performance.now();
        
        // 1. 静的解析
        console.log('1. 静的解析実行中...');
        const staticIssues = this.analyzeLevel();
        
        // 2. 高速シミュレーション
        console.log('2. 高速シミュレーション実行中...');
        const simResult = await this.quickSimulation();
        
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        
        // 結果をまとめ
        const allIssues = [...staticIssues, ...simResult.issues];
        const highSeverityIssues = allIssues.filter(issue => issue.severity === 'high');
        
        const result = {
            passed: highSeverityIssues.length === 0,
            duration: duration,
            progress: simResult.progress,
            finalPosition: simResult.finalPosition,
            issues: allIssues,
            summary: {
                total: allIssues.length,
                high: highSeverityIssues.length,
                medium: allIssues.filter(issue => issue.severity === 'medium').length
            }
        };
        
        this.displayQuickResult(result);
        return result;
    }
    
    displayQuickResult(result) {
        console.log('\n=== 簡易テスト結果 ===');
        console.log(`結果: ${result.passed ? '✅ 合格' : '❌ 要修正'}`);
        console.log(`実行時間: ${result.duration.toFixed(2)}秒`);
        console.log(`進行度: ${result.progress.toFixed(1)}%`);
        console.log(`問題数: ${result.summary.total} (重要: ${result.summary.high}, 中程度: ${result.summary.medium})`);
        
        if (result.issues.length > 0) {
            console.log('\n検出された問題:');
            result.issues.forEach((issue, index) => {
                const severity = issue.severity === 'high' ? '🔴' : '🟡';
                console.log(`  ${index + 1}. ${severity} ${issue.message} (位置: ${issue.position}px)`);
            });
        }
        
        if (result.passed) {
            console.log('\n👍 レベルは基本的な問題がなく、プレイ可能と思われます。');
        } else {
            console.log('\n⚠️  重要な問題が検出されました。修正を推奨します。');
        }
    }
}

// Node.js環境用のグローバル設定
if (typeof global !== 'undefined') {
    global.SimpleLevelTest = SimpleLevelTest;
}

// Node.js環境用のエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleLevelTest;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.SimpleLevelTest = SimpleLevelTest;
}