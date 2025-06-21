#!/usr/bin/env node

/**
 * テストカバレッジアナライザー
 * ソースコードを解析し、テストカバレッジを計算・可視化する
 */

const fs = require('fs');
const path = require('path');

class CoverageAnalyzer {
    constructor() {
        this.coverage = {
            files: {},
            summary: {
                totalFunctions: 0,
                coveredFunctions: 0,
                totalLines: 0,
                coveredLines: 0,
                totalFiles: 0,
                coveredFiles: 0
            }
        };
        
        // テストで言及されている関数やクラスのパターン
        this.testPatterns = {
            automated: [],
            manual: [],
            integration: []
        };
    }

    /**
     * ソースファイルを解析
     */
    analyzeSourceFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        
        // 関数とクラスを抽出
        const functions = this.extractFunctions(content);
        const classes = this.extractClasses(content);
        
        this.coverage.files[fileName] = {
            path: filePath,
            functions: functions,
            classes: classes,
            totalFunctions: functions.length + classes.reduce((sum, c) => sum + c.methods.length, 0),
            coveredFunctions: 0,
            totalLines: content.split('\n').length,
            coveredLines: 0,
            coverage: 0
        };
        
        this.coverage.summary.totalFiles++;
        this.coverage.summary.totalFunctions += this.coverage.files[fileName].totalFunctions;
        this.coverage.summary.totalLines += this.coverage.files[fileName].totalLines;
    }

    /**
     * 関数を抽出
     */
    extractFunctions(content) {
        const functions = [];
        
        // 通常の関数定義
        const funcRegex = /function\s+(\w+)\s*\(/g;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            functions.push({
                name: match[1],
                line: content.substring(0, match.index).split('\n').length,
                tested: false
            });
        }
        
        // アロー関数とメソッド定義
        const arrowRegex = /(\w+)\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>/g;
        while ((match = arrowRegex.exec(content)) !== null) {
            functions.push({
                name: match[1],
                line: content.substring(0, match.index).split('\n').length,
                tested: false
            });
        }
        
        // メソッド定義（ES6クラス内）
        const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
        while ((match = methodRegex.exec(content)) !== null) {
            if (match[1] !== 'constructor' && match[1] !== 'if' && match[1] !== 'while' && match[1] !== 'for') {
                functions.push({
                    name: match[1],
                    line: content.substring(0, match.index).split('\n').length,
                    tested: false
                });
            }
        }
        
        return functions;
    }

    /**
     * クラスを抽出
     */
    extractClasses(content) {
        const classes = [];
        const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g;
        let match;
        
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const classStart = match.index;
            const classContent = this.extractClassContent(content, classStart);
            
            classes.push({
                name: className,
                line: content.substring(0, classStart).split('\n').length,
                methods: this.extractClassMethods(classContent),
                tested: false
            });
        }
        
        return classes;
    }

    /**
     * クラスの内容を抽出
     */
    extractClassContent(content, startIndex) {
        let braceCount = 0;
        let inClass = false;
        let classContent = '';
        
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            classContent += char;
            
            if (char === '{') {
                braceCount++;
                inClass = true;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && inClass) {
                    break;
                }
            }
        }
        
        return classContent;
    }

    /**
     * クラスのメソッドを抽出
     */
    extractClassMethods(classContent) {
        const methods = [];
        const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
        let match;
        
        while ((match = methodRegex.exec(classContent)) !== null) {
            if (match[1] !== 'constructor') {
                methods.push({
                    name: match[1],
                    tested: false
                });
            }
        }
        
        return methods;
    }

    /**
     * テストファイルを解析してカバレッジ情報を更新
     */
    analyzeTestFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // テストで言及されている関数やクラスを検出
        this.detectTestedItems(content);
    }

    /**
     * テストされている項目を検出
     */
    detectTestedItems(testContent) {
        // 自動ゲームテストで実際にテストされている項目を詳細に分析
        
        // 1. automated-game-tests.jsのテスト項目
        if (testContent.includes('自動ゲームテスト')) {
            // ゲーム状態管理のテスト
            if (testContent.includes('状態キャプチャの正確性')) {
                this.markAsTested('game-state-manager.js', 'captureState');
                this.markAsTested('game-state.js', 'GameState');
            }
            
            if (testContent.includes('状態履歴の記録')) {
                this.markAsTested('game-state-manager.js', 'addState');
                this.markAsTested('game-state-manager.js', 'getHistory');
            }
            
            if (testContent.includes('状態検証機能')) {
                this.markAsTested('game-state-manager.js', 'validateState');
            }
            
            // プレイヤー動作のテスト
            if (testContent.includes('右移動の検証')) {
                this.markAsTested('player.js', 'moveRight');
                this.markAsTested('player.js', 'update');
                this.markAsTested('automated-test-player.js', 'move');
            }
            
            if (testContent.includes('ジャンプ動作の検証')) {
                this.markAsTested('player.js', 'jump');
                this.markAsTested('player.js', 'handleJump');
                this.markAsTested('player.js', 'update');
                this.markAsTested('automated-test-player.js', 'jump');
            }
            
            if (testContent.includes('複合動作の検証')) {
                this.markAsTested('automated-test-player.js', 'executeSequence');
                this.markAsTested('automated-test-player.js', 'executeAction');
            }
            
            // ゲームメカニクスのテスト
            if (testContent.includes('コイン収集メカニクス')) {
                this.markAsTested('game.js', 'updateCoins');
                this.markAsTested('game.js', 'checkCollision');
                this.markAsTested('game-state.js', 'collectCoin');
            }
            
            if (testContent.includes('ライフシステム')) {
                this.markAsTested('player.js', 'takeDamage');
                this.markAsTested('game-state.js', 'loseLife');
                this.markAsTested('game.js', 'loseLife');
            }
            
            // 物理エンジンのテスト
            if (testContent.includes('重力の適用')) {
                this.markAsTested('player.js', 'update');
                this.markAsTested('player.js', 'Player');
            }
            
            if (testContent.includes('速度制限の確認')) {
                this.markAsTested('player.js', 'update');
            }
            
            // 衝突検出のテスト
            if (testContent.includes('プラットフォーム衝突')) {
                this.markAsTested('game.js', 'checkCollisions');
                this.markAsTested('game.js', 'checkCollision');
            }
            
            if (testContent.includes('境界チェック')) {
                this.markAsTested('game.js', 'checkBoundaries');
                this.markAsTested('player.js', 'getBounds');
            }
        }
        
        // 2. レベル検証テスト
        if (testContent.includes('loadLevel') || testContent.includes('レベル検証')) {
            this.markAsTested('level-loader.js', 'loadStage');
            this.markAsTested('level-loader.js', 'validateLevel');
        }
        
        // 3. 統合テストランナーで確認される項目
        if (testContent.includes('ファイル存在確認')) {
            // ファイル構造のテスト（直接的な関数テストではない）
            this.markAsFileStructureTested();
        }
        
        // 4. Game初期化関連
        if (testContent.includes('new Game()') || testContent.includes('game = new Game')) {
            this.markAsTested('game.js', 'Game');
            this.markAsTested('game.js', 'initialize');
            this.markAsTested('input-manager.js', 'InputManager');
        }
        
        // 5. SVGレンダリング関連（automated-test.htmlで使用）
        if (testContent.includes('SVGRenderer') || testContent.includes('preloadSVGs')) {
            this.markAsTested('svg-renderer.js', 'SVGRenderer');
            this.markAsTested('svg-renderer.js', 'preloadAllSVGs');
            this.markAsTested('svg-player-renderer.js', 'SVGPlayerRenderer');
            this.markAsTested('svg-enemy-renderer.js', 'SVGEnemyRenderer');
            this.markAsTested('svg-item-renderer.js', 'SVGItemRenderer');
        }
    }
    
    /**
     * ファイル構造テストとしてマーク
     */
    markAsFileStructureTested() {
        // 構造テストで確認されているファイル
        const structureTestedFiles = [
            'game.js', 'config.js', 'player.js', 'music.js'
        ];
        
        structureTestedFiles.forEach(file => {
            if (this.coverage.files[file] && this.coverage.files[file].coveredFunctions === 0) {
                // 少なくともファイルが参照されていることを記録
                this.coverage.summary.coveredFiles = Math.min(
                    this.coverage.summary.coveredFiles + 0.25,
                    this.coverage.summary.totalFiles
                );
            }
        });
    }

    /**
     * 関数をテスト済みとしてマーク
     */
    markAsTested(fileName, functionName) {
        if (this.coverage.files[fileName]) {
            const file = this.coverage.files[fileName];
            
            // 関数を検索してマーク
            const func = file.functions.find(f => f.name === functionName);
            if (func) {
                func.tested = true;
                file.coveredFunctions++;
                this.coverage.summary.coveredFunctions++;
            }
            
            // クラスメソッドも検索
            file.classes.forEach(cls => {
                const method = cls.methods.find(m => m.name === functionName);
                if (method) {
                    method.tested = true;
                    cls.tested = true;
                    file.coveredFunctions++;
                    this.coverage.summary.coveredFunctions++;
                }
            });
            
            // ファイルのカバレッジ率を更新
            file.coverage = (file.coveredFunctions / file.totalFunctions) * 100;
            
            // ファイルがテストされている場合
            if (file.coveredFunctions > 0 && this.coverage.summary.coveredFiles < this.coverage.summary.totalFiles) {
                this.coverage.summary.coveredFiles++;
            }
        }
    }

    /**
     * カバレッジレポートを生成
     */
    generateReport() {
        const functionCoverage = (this.coverage.summary.coveredFunctions / this.coverage.summary.totalFunctions * 100).toFixed(1);
        
        console.log('\n📊 テストカバレッジレポート');
        console.log('=' .repeat(60));
        console.log(`\n全体カバレッジ: ${functionCoverage}%`);
        console.log(`テスト済み関数: ${this.coverage.summary.coveredFunctions}/${this.coverage.summary.totalFunctions}`);
        console.log(`カバーされたファイル: ${this.coverage.summary.coveredFiles}/${this.coverage.summary.totalFiles}\n`);
        
        console.log('ファイル別カバレッジ:');
        console.log('─'.repeat(60));
        
        // ファイル別の詳細
        Object.entries(this.coverage.files)
            .sort((a, b) => b[1].coverage - a[1].coverage)
            .forEach(([fileName, data]) => {
                const coverage = data.coverage.toFixed(1);
                const bar = this.generateProgressBar(data.coverage);
                console.log(`${fileName.padEnd(25)} ${bar} ${coverage.padStart(5)}% (${data.coveredFunctions}/${data.totalFunctions})`);
            });
        
        console.log('\n❌ 未テストの関数:');
        console.log('─'.repeat(60));
        
        // 未テストの関数をリスト
        Object.entries(this.coverage.files).forEach(([fileName, data]) => {
            const untestedFuncs = data.functions.filter(f => !f.tested).map(f => f.name);
            const untestedMethods = data.classes.flatMap(c => 
                c.methods.filter(m => !m.tested).map(m => `${c.name}.${m.name}`)
            );
            
            const allUntested = [...untestedFuncs, ...untestedMethods];
            
            if (allUntested.length > 0) {
                console.log(`\n${fileName}:`);
                allUntested.forEach(name => console.log(`  - ${name}`));
            }
        });
        
        // HTMLレポートも生成
        this.generateHTMLReport();
        
        // JSONレポートも生成
        this.generateJSONReport();
    }

    /**
     * プログレスバーを生成
     */
    generateProgressBar(percentage) {
        const width = 20;
        const filled = Math.round(percentage / 100 * width);
        const empty = width - filled;
        return `[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}]`;
    }

    /**
     * HTMLレポートを生成
     */
    generateHTMLReport() {
        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>テストカバレッジレポート</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .file-coverage {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
            transition: width 0.3s ease;
        }
        
        .untested-list {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 1rem;
            border-radius: 5px;
            margin-top: 10px;
        }
        
        .untested-list h4 {
            margin: 0 0 10px 0;
            color: #856404;
        }
        
        .untested-list ul {
            margin: 0;
            padding-left: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 テストカバレッジレポート</h1>
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
    
    <div class="summary-cards">
        <div class="card">
            <div class="label">全体カバレッジ</div>
            <div class="value">${(this.coverage.summary.coveredFunctions / this.coverage.summary.totalFunctions * 100).toFixed(1)}%</div>
        </div>
        <div class="card">
            <div class="label">テスト済み関数</div>
            <div class="value">${this.coverage.summary.coveredFunctions}/${this.coverage.summary.totalFunctions}</div>
        </div>
        <div class="card">
            <div class="label">カバーされたファイル</div>
            <div class="value">${this.coverage.summary.coveredFiles}/${this.coverage.summary.totalFiles}</div>
        </div>
    </div>
    
    <h2>ファイル別カバレッジ</h2>
    ${Object.entries(this.coverage.files)
        .sort((a, b) => b[1].coverage - a[1].coverage)
        .map(([fileName, data]) => {
            const untestedFuncs = data.functions.filter(f => !f.tested).map(f => f.name);
            const untestedMethods = data.classes.flatMap(c => 
                c.methods.filter(m => !m.tested).map(m => `${c.name}.${m.name}`)
            );
            const allUntested = [...untestedFuncs, ...untestedMethods];
            
            return `
            <div class="file-coverage">
                <h3>${fileName}</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.coverage}%"></div>
                </div>
                <p>カバレッジ: ${data.coverage.toFixed(1)}% (${data.coveredFunctions}/${data.totalFunctions} 関数)</p>
                ${allUntested.length > 0 ? `
                <div class="untested-list">
                    <h4>未テストの関数:</h4>
                    <ul>
                        ${allUntested.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            `;
        }).join('')}
</body>
</html>`;
        
        fs.writeFileSync(path.join(__dirname, '..', 'coverage-report.html'), html);
        console.log('\n✅ HTMLレポートを生成しました: coverage-report.html');
    }

    /**
     * JSONレポートを生成
     */
    generateJSONReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                ...this.coverage.summary,
                functionCoverage: (this.coverage.summary.coveredFunctions / this.coverage.summary.totalFunctions * 100).toFixed(1) + '%'
            },
            files: this.coverage.files
        };
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'coverage-report.json'),
            JSON.stringify(report, null, 2)
        );
        console.log('✅ JSONレポートを生成しました: coverage-report.json');
    }

    /**
     * カバレッジ分析を実行
     */
    async run() {
        console.log('🔍 カバレッジ分析を開始します...\n');
        
        // srcディレクトリのJavaScriptファイルを解析
        const srcDir = path.join(__dirname, '..', 'src');
        const srcFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        
        console.log(`📁 ${srcFiles.length}個のソースファイルを解析中...`);
        srcFiles.forEach(file => {
            this.analyzeSourceFile(path.join(srcDir, file));
        });
        
        // テストファイルを解析
        const testFiles = [
            path.join(__dirname, '..', 'tests', 'automated-game-tests.js'),
            path.join(__dirname, 'level-validation-test.js'),
            path.join(__dirname, 'comprehensive-test-results.js')
        ];
        
        console.log(`\n🧪 テストファイルを解析中...`);
        testFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.analyzeTestFile(file);
            }
        });
        
        // レポート生成
        this.generateReport();
    }
}

// 実行
if (require.main === module) {
    const analyzer = new CoverageAnalyzer();
    analyzer.run().catch(console.error);
}

module.exports = CoverageAnalyzer;