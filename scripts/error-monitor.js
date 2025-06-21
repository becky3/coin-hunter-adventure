#!/usr/bin/env node

/**
 * エラー監視システム
 * console.errorとconsole.warnを監視し、エラー情報を収集・分析する
 */

class ErrorMonitor {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.originalConsoleError = null;
        this.originalConsoleWarn = null;
        this.isMonitoring = false;
        
        // 無視リスト（既知の警告や環境依存のエラー）
        this.ignorePatterns = [
            // JSDOMの警告
            /Could not parse CSS stylesheet/,
            /Error: Not implemented:/,
            /Canvas.prototype.getContext/,
            
            // Node.js環境の警告
            /ExperimentalWarning:/,
            /DeprecationWarning:/,
            
            // 音楽システムの警告（テスト環境では音楽再生は不要）
            /AudioContext is not defined/,
            /Audio is not defined/
        ];
    }

    /**
     * 監視を開始
     */
    start() {
        if (this.isMonitoring) {
            console.warn('ErrorMonitor: 既に監視中です');
            return;
        }

        // console.errorをインターセプト
        this.originalConsoleError = console.error;
        console.error = (...args) => {
            const errorInfo = this.createErrorInfo('error', args);
            if (!this.shouldIgnore(errorInfo)) {
                this.errors.push(errorInfo);
            }
            // 元のconsole.errorも呼び出す
            this.originalConsoleError.apply(console, args);
        };

        // console.warnをインターセプト
        this.originalConsoleWarn = console.warn;
        console.warn = (...args) => {
            const errorInfo = this.createErrorInfo('warning', args);
            if (!this.shouldIgnore(errorInfo)) {
                this.warnings.push(errorInfo);
            }
            // 元のconsole.warnも呼び出す
            this.originalConsoleWarn.apply(console, args);
        };

        this.isMonitoring = true;
    }

    /**
     * 監視を停止
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }

        // console.errorとconsole.warnを元に戻す
        if (this.originalConsoleError) {
            console.error = this.originalConsoleError;
            this.originalConsoleError = null;
        }

        if (this.originalConsoleWarn) {
            console.warn = this.originalConsoleWarn;
            this.originalConsoleWarn = null;
        }

        this.isMonitoring = false;
    }

    /**
     * エラー情報を作成
     */
    createErrorInfo(type, args) {
        const message = args.map(arg => {
            if (arg instanceof Error) {
                return `${arg.message}\n${arg.stack}`;
            }
            return String(arg);
        }).join(' ');

        const stack = new Error().stack;
        const stackLines = stack.split('\n');
        // ErrorMonitor自身のスタックトレースを除外
        const relevantStack = stackLines.slice(3).join('\n');

        return {
            type,
            message,
            timestamp: new Date().toISOString(),
            stack: relevantStack,
            raw: args
        };
    }

    /**
     * エラーを無視するかチェック
     */
    shouldIgnore(errorInfo) {
        return this.ignorePatterns.some(pattern => 
            pattern.test(errorInfo.message)
        );
    }

    /**
     * 無視パターンを追加
     */
    addIgnorePattern(pattern) {
        if (pattern instanceof RegExp) {
            this.ignorePatterns.push(pattern);
        } else {
            this.ignorePatterns.push(new RegExp(pattern));
        }
    }

    /**
     * エラーをクリア
     */
    clear() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * エラーレポートを生成
     */
    generateReport() {
        const report = {
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                timestamp: new Date().toISOString()
            },
            errors: this.analyzeErrors(this.errors),
            warnings: this.analyzeErrors(this.warnings),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * エラーを分析
     */
    analyzeErrors(errorList) {
        const grouped = {};
        
        errorList.forEach(error => {
            // エラーメッセージの最初の行をキーとして使用
            const key = error.message.split('\n')[0];
            if (!grouped[key]) {
                grouped[key] = {
                    message: key,
                    count: 0,
                    firstOccurrence: error.timestamp,
                    lastOccurrence: error.timestamp,
                    locations: []
                };
            }
            
            grouped[key].count++;
            grouped[key].lastOccurrence = error.timestamp;
            
            // スタックトレースから発生箇所を抽出
            const location = this.extractLocation(error.stack);
            if (location && !grouped[key].locations.includes(location)) {
                grouped[key].locations.push(location);
            }
        });

        // 発生頻度順にソート
        return Object.values(grouped).sort((a, b) => b.count - a.count);
    }

    /**
     * スタックトレースから発生箇所を抽出
     */
    extractLocation(stack) {
        const lines = stack.split('\n');
        for (const line of lines) {
            // ファイル名と行番号を含む行を探す
            const match = line.match(/at .* \((.*:\d+:\d+)\)/);
            if (match) {
                const location = match[1];
                // OSに依存しないパス比較のため、パス区切り文字を正規化
                const normalizedLocation = location.replace(/\\/g, '/');
                // node_modulesやErrorMonitor自身を除外
                if (!normalizedLocation.includes('node_modules') && 
                    !normalizedLocation.includes('error-monitor.js')) {
                    return location;
                }
            }
        }
        return null;
    }

    /**
     * 修正案を生成
     */
    generateRecommendations() {
        const recommendations = [];

        // エラーが多い場合
        if (this.errors.length > 10) {
            recommendations.push({
                severity: 'high',
                message: '多数のエラーが検出されました。主要なエラーから順に修正することを推奨します。'
            });
        }

        // 同じエラーが繰り返し発生している場合
        const analyzed = this.analyzeErrors(this.errors);
        const repetitiveErrors = analyzed.filter(e => e.count > 3);
        if (repetitiveErrors.length > 0) {
            recommendations.push({
                severity: 'medium',
                message: `${repetitiveErrors.length}個のエラーが繰り返し発生しています。根本原因の修正が必要です。`,
                details: repetitiveErrors.map(e => ({
                    message: e.message,
                    count: e.count,
                    locations: e.locations
                }))
            });
        }

        // 特定のパターンのエラーに対する具体的な修正案
        this.errors.forEach(error => {
            if (error.message.includes('Cannot read property') || 
                error.message.includes('Cannot read properties')) {
                recommendations.push({
                    severity: 'medium',
                    message: 'null/undefinedチェックが不足している可能性があります。',
                    suggestion: 'オプショナルチェーニング（?.）やnullチェックの追加を検討してください。'
                });
            }
            
            if (error.message.includes('is not a function')) {
                recommendations.push({
                    severity: 'medium',
                    message: '関数呼び出しのエラーが検出されました。',
                    suggestion: 'メソッドの存在確認や、正しいオブジェクトに対して呼び出しているか確認してください。'
                });
            }
        });

        // 重複を除去
        const uniqueRecommendations = [];
        const seen = new Set();
        recommendations.forEach(rec => {
            const key = `${rec.severity}:${rec.message}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRecommendations.push(rec);
            }
        });

        return uniqueRecommendations;
    }

    /**
     * コンソールにレポートを表示
     */
    displayReport() {
        const report = this.generateReport();
        
        console.log('\n' + '='.repeat(60));
        console.log('🚨 エラー検出レポート');
        console.log('='.repeat(60));
        console.log(`総エラー数: ${report.summary.totalErrors}`);
        console.log(`総警告数: ${report.summary.totalWarnings}`);
        console.log(`生成時刻: ${new Date(report.summary.timestamp).toLocaleString()}`);
        
        if (report.errors.length > 0) {
            console.log('\n❌ エラー一覧:');
            report.errors.forEach((error, index) => {
                console.log(`\n${index + 1}. ${error.message}`);
                console.log(`   発生回数: ${error.count}回`);
                console.log(`   発生箇所: ${error.locations.join(', ') || '不明'}`);
            });
        }
        
        if (report.warnings.length > 0) {
            console.log('\n⚠️  警告一覧:');
            report.warnings.forEach((warning, index) => {
                console.log(`\n${index + 1}. ${warning.message}`);
                console.log(`   発生回数: ${warning.count}回`);
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 修正案:');
            report.recommendations.forEach((rec, index) => {
                console.log(`\n${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
                if (rec.suggestion) {
                    console.log(`   提案: ${rec.suggestion}`);
                }
                if (rec.details) {
                    rec.details.forEach(detail => {
                        console.log(`   - ${detail.message} (${detail.count}回)`);
                    });
                }
            });
        }
        
        console.log('\n' + '='.repeat(60));
    }

    /**
     * テスト結果として取得
     */
    getTestResults() {
        return {
            passed: this.errors.length === 0,
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
            errors: this.errors.map(e => ({
                message: e.message.split('\n')[0],
                timestamp: e.timestamp
            })),
            warnings: this.warnings.map(w => ({
                message: w.message.split('\n')[0],
                timestamp: w.timestamp
            }))
        };
    }
}

module.exports = ErrorMonitor;