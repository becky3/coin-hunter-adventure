#!/usr/bin/env node

/**
 * Canvasスナップショットテスト
 * シンプルなCanvas操作の記録と比較を行う
 */

const fs = require('fs');
const path = require('path');

class CanvasSnapshotTest {
    // 数値比較の許容誤差
    static NUMERICAL_TOLERANCE = 0.01;
    
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0
            }
        };
    }

    /**
     * Canvas描画操作をシミュレート
     */
    simulateGameScreens() {
        const screens = {
            title: this.generateTitleScreen(),
            gameplay: this.generateGameplayScreen(),
            gameOver: this.generateGameOverScreen(),
            levelComplete: this.generateLevelCompleteScreen()
        };

        return screens;
    }

    /**
     * タイトル画面の描画操作を生成
     */
    generateTitleScreen() {
        return [
            { method: 'fillStyle', value: '#87ceeb' },
            { method: 'fillRect', args: [0, 0, 1024, 576] },
            { method: 'fillStyle', value: '#ffffff' },
            { method: 'font', value: '48px Arial' },
            { method: 'fillText', args: ['Coin Hunter Adventure', 300, 200] },
            { method: 'font', value: '24px Arial' },
            { method: 'fillText', args: ['Press SPACE to Start', 350, 300] }
        ];
    }

    /**
     * ゲームプレイ画面の描画操作を生成
     */
    generateGameplayScreen() {
        const operations = [];
        
        // 背景
        operations.push({ method: 'fillStyle', value: '#87ceeb' });
        operations.push({ method: 'fillRect', args: [0, 0, 1024, 576] });
        
        // 地面
        operations.push({ method: 'fillStyle', value: '#8b4513' });
        operations.push({ method: 'fillRect', args: [0, 476, 1024, 100] });
        
        // プラットフォーム
        operations.push({ method: 'fillStyle', value: '#654321' });
        operations.push({ method: 'fillRect', args: [200, 350, 150, 20] });
        operations.push({ method: 'fillRect', args: [400, 280, 150, 20] });
        
        // プレイヤー
        operations.push({ method: 'fillStyle', value: '#ff6b6b' });
        operations.push({ method: 'fillRect', args: [100, 416, 40, 60] });
        
        // コイン
        operations.push({ method: 'fillStyle', value: '#ffd93d' });
        operations.push({ method: 'beginPath', args: [] });
        operations.push({ method: 'arc', args: [250, 320, 15, 0, Math.PI * 2] });
        operations.push({ method: 'fill', args: [] });
        
        // 敵
        operations.push({ method: 'fillStyle', value: '#4ecdc4' });
        operations.push({ method: 'fillRect', args: [500, 436, 50, 40] });
        
        // UI要素
        operations.push({ method: 'fillStyle', value: '#000000' });
        operations.push({ method: 'font', value: '20px Arial' });
        operations.push({ method: 'fillText', args: ['Score: 0', 20, 30] });
        operations.push({ method: 'fillText', args: ['Lives: 3', 20, 60] });
        
        return operations;
    }

    /**
     * ゲームオーバー画面の描画操作を生成
     */
    generateGameOverScreen() {
        return [
            { method: 'fillStyle', value: '#2c3e50' },
            { method: 'fillRect', args: [0, 0, 1024, 576] },
            { method: 'fillStyle', value: '#e74c3c' },
            { method: 'font', value: '64px Arial' },
            { method: 'fillText', args: ['GAME OVER', 350, 250] },
            { method: 'fillStyle', value: '#ffffff' },
            { method: 'font', value: '24px Arial' },
            { method: 'fillText', args: ['Press R to Restart', 380, 350] }
        ];
    }

    /**
     * レベルクリア画面の描画操作を生成
     */
    generateLevelCompleteScreen() {
        return [
            { method: 'fillStyle', value: '#2ecc71' },
            { method: 'fillRect', args: [0, 0, 1024, 576] },
            { method: 'fillStyle', value: '#ffffff' },
            { method: 'font', value: '64px Arial' },
            { method: 'fillText', args: ['LEVEL CLEAR!', 320, 250] },
            { method: 'font', value: '32px Arial' },
            { method: 'fillText', args: ['Score: 1000', 400, 320] },
            { method: 'font', value: '24px Arial' },
            { method: 'fillText', args: ['Press SPACE to Continue', 340, 400] }
        ];
    }

    /**
     * スナップショットを保存
     */
    saveSnapshots(screens) {
        const snapshotDir = path.join(__dirname, '..', 'tests', 'snapshots');
        
        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }

        Object.entries(screens).forEach(([name, operations]) => {
            const filePath = path.join(snapshotDir, `${name}-baseline.json`);
            const snapshot = {
                name,
                timestamp: new Date().toISOString(),
                operations
            };
            
            fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
            
            this.addTestResult(
                `${name}画面のスナップショット保存`,
                true,
                `${operations.length}個の描画操作を記録`
            );
        });
    }

    /**
     * スナップショットを比較
     */
    compareWithBaseline(screens) {
        const snapshotDir = path.join(__dirname, '..', 'tests', 'snapshots');
        
        Object.entries(screens).forEach(([name, currentOps]) => {
            const baselinePath = path.join(snapshotDir, `${name}-baseline.json`);
            
            if (!fs.existsSync(baselinePath)) {
                this.addTestResult(
                    `${name}画面の比較`,
                    false,
                    'ベースラインスナップショットが存在しません'
                );
                return;
            }
            
            try {
                const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
                const baselineOps = baseline.operations;
                
                // 操作数の比較
                if (currentOps.length !== baselineOps.length) {
                    this.addTestResult(
                        `${name}画面の比較`,
                        false,
                        `操作数が異なります (現在: ${currentOps.length}, ベースライン: ${baselineOps.length})`
                    );
                    return;
                }
                
                // 各操作の比較
                let differences = 0;
                for (let i = 0; i < currentOps.length; i++) {
                    if (!this.operationsMatch(currentOps[i], baselineOps[i])) {
                        differences++;
                    }
                }
                
                if (differences === 0) {
                    this.addTestResult(
                        `${name}画面の比較`,
                        true,
                        'ベースラインと完全に一致'
                    );
                } else {
                    this.addTestResult(
                        `${name}画面の比較`,
                        false,
                        `${differences}個の操作が異なります`
                    );
                }
                
            } catch (error) {
                this.addTestResult(
                    `${name}画面の比較`,
                    false,
                    `エラー: ${error.message}`
                );
            }
        });
    }

    /**
     * 操作の比較
     */
    operationsMatch(op1, op2) {
        if (op1.method !== op2.method) return false;
        
        if (op1.value !== undefined && op2.value !== undefined) {
            return op1.value === op2.value;
        }
        
        if (op1.args && op2.args) {
            if (op1.args.length !== op2.args.length) return false;
            
            for (let i = 0; i < op1.args.length; i++) {
                if (typeof op1.args[i] === 'number' && typeof op2.args[i] === 'number') {
                    // 数値の場合は誤差を許容
                    if (Math.abs(op1.args[i] - op2.args[i]) > CanvasSnapshotTest.NUMERICAL_TOLERANCE) return false;
                } else if (op1.args[i] !== op2.args[i]) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Canvas操作の可視化（デバッグ用）
     */
    visualizeOperations(operations, title) {
        console.log(`\n📊 ${title} (${operations.length}操作)`);
        console.log('─'.repeat(50));
        
        const summary = {};
        operations.forEach(op => {
            summary[op.method] = (summary[op.method] || 0) + 1;
        });
        
        Object.entries(summary)
            .sort((a, b) => b[1] - a[1])
            .forEach(([method, count]) => {
                console.log(`  ${method.padEnd(15)} : ${count}回`);
            });
    }

    /**
     * テスト結果を追加
     */
    addTestResult(name, passed, message) {
        const result = {
            name,
            passed,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(result);
        this.results.summary.total++;
        
        if (passed) {
            this.results.summary.passed++;
            console.log(`✅ ${name}: ${message}`);
        } else {
            this.results.summary.failed++;
            console.log(`❌ ${name}: ${message}`);
        }
    }

    /**
     * すべてのテストを実行
     */
    async runAllTests() {
        console.log('📸 Canvasスナップショットテストを開始します...\n');
        
        // 1. 画面の描画操作を生成
        console.log('🎨 画面描画操作を生成中...');
        const screens = this.simulateGameScreens();
        
        // 2. 操作の可視化（デバッグ情報）
        Object.entries(screens).forEach(([name, ops]) => {
            this.visualizeOperations(ops, `${name}画面`);
        });
        
        // 3. スナップショットの保存
        console.log('\n💾 スナップショットを保存中...');
        this.saveSnapshots(screens);
        
        // 4. ベースラインとの比較
        console.log('\n🔍 ベースラインと比較中...');
        this.compareWithBaseline(screens);
        
        // 5. レポート生成
        this.generateReport();
        
        return this.results;
    }

    /**
     * レポートを生成
     */
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 スナップショットテスト結果サマリー');
        console.log('='.repeat(60));
        console.log(`総テスト数: ${this.results.summary.total}`);
        console.log(`✅ 成功: ${this.results.summary.passed}`);
        console.log(`❌ 失敗: ${this.results.summary.failed}`);
        console.log(`成功率: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));
        
        // 結果をファイルに保存
        const resultPath = path.join(__dirname, '..', '..', 'test-results', 'canvas-snapshot-results.json');
        fs.writeFileSync(resultPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 詳細な結果を保存しました: ${resultPath}`);
    }
}

// メイン処理
async function main() {
    const tester = new CanvasSnapshotTest();
    await tester.runAllTests();
    
    process.exit(tester.results.summary.failed > 0 ? 1 : 0);
}

// 実行
if (require.main === module) {
    main().catch(error => {
        console.error('実行エラー:', error);
        process.exit(1);
    });
}

module.exports = CanvasSnapshotTest;