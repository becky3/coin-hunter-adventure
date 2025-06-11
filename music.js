/**
 * Web Audio APIを使用したオリジナル音楽生成システム
 */

class MusicSystem {
    constructor() {
        // AudioContextの初期化
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        
        // 現在再生中のBGM
        this.currentBGM = null;
        this.bgmLoopInterval = null;
        
        // 音量設定
        this.bgmVolume = 0.3;
    }
    
    // オーディオコンテキストの初期化（ユーザー操作後に呼ぶ必要がある）
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.bgmVolume;
            
            this.isInitialized = true;
            console.log('音楽システムを初期化しました');
        } catch (error) {
            console.error('音楽システムの初期化に失敗しました:', error);
        }
    }
    
    // ノートの周波数を取得
    getNoteFrequency(note) {
        const notes = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
            'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
        };
        return notes[note] || 440;
    }
    
    // 単音を再生
    playNote(frequency, duration, startTime, type = 'square', volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // エンベロープ
        const now = startTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // アタック
        gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + duration * 0.1); // ディケイ
        gainNode.gain.setValueAtTime(volume * 0.7, now + duration * 0.9); // サステイン
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // リリース
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    // コードを再生
    playChord(notes, duration, startTime, type = 'sine', volume = 0.2) {
        notes.forEach(note => {
            const freq = this.getNoteFrequency(note);
            this.playNote(freq, duration, startTime, type, volume);
        });
    }
    
    // ドラムサウンドを再生
    playDrum(type, startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const now = startTime;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        switch(type) {
            case 'kick':
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                gainNode.gain.setValueAtTime(1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
            case 'snare':
                const noise = this.audioContext.createBufferSource();
                const noiseBuffer = this.audioContext.createBuffer(1, 4410, this.audioContext.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < noiseData.length; i++) {
                    noiseData[i] = Math.random() * 2 - 1;
                }
                noise.buffer = noiseBuffer;
                noise.connect(gainNode);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                noise.start(now);
                break;
            case 'hihat':
                oscillator.type = 'square';
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;
        }
    }
    
    // タイトル画面のBGM
    playTitleBGM() {
        this.stopBGM();
        if (!this.isInitialized) return;
        
        const bpm = 120;
        const beatLength = 60 / bpm;
        let currentBeat = 0;
        
        const playBar = () => {
            const now = this.audioContext.currentTime;
            
            // ベースライン（8ビート）
            const bassPattern = ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'F3', 'F3'];
            for (let i = 0; i < 8; i++) {
                this.playNote(
                    this.getNoteFrequency(bassPattern[i]),
                    beatLength * 0.9,
                    now + i * beatLength * 0.5,
                    'sine',
                    0.4
                );
            }
            
            // コード進行（4拍子）
            const chords = [
                ['C4', 'E4', 'G4'],
                ['G4', 'B4', 'D5'],
                ['A4', 'C5', 'E5'],
                ['F4', 'A4', 'C5']
            ];
            
            for (let i = 0; i < 4; i++) {
                this.playChord(
                    chords[i],
                    beatLength * 0.9,
                    now + i * beatLength,
                    'triangle',
                    0.2
                );
            }
            
            // メロディー
            const melody = [
                { note: 'E5', duration: 0.5 },
                { note: 'D5', duration: 0.5 },
                { note: 'C5', duration: 1 },
                { note: 'G4', duration: 1 },
                { note: 'A4', duration: 0.5 },
                { note: 'B4', duration: 0.5 },
                { note: 'C5', duration: 1 }
            ];
            
            let melodyTime = now;
            melody.forEach(({ note, duration }) => {
                this.playNote(
                    this.getNoteFrequency(note),
                    duration * beatLength * 0.9,
                    melodyTime,
                    'square',
                    0.3
                );
                melodyTime += duration * beatLength;
            });
            
            currentBeat += 4;
        };
        
        // 最初のバーを再生
        playBar();
        
        // ループ設定
        this.bgmLoopInterval = setInterval(() => {
            playBar();
        }, beatLength * 4 * 1000);
        
        this.currentBGM = 'title';
    }
    
    // ゲームプレイ中のBGM
    playGameBGM() {
        this.stopBGM();
        if (!this.isInitialized) return;
        
        const bpm = 140;
        const beatLength = 60 / bpm;
        let currentBeat = 0;
        
        const playBar = () => {
            const now = this.audioContext.currentTime;
            
            // ドラムパターン
            for (let i = 0; i < 4; i++) {
                // キック
                this.playDrum('kick', now + i * beatLength);
                // スネア
                if (i === 1 || i === 3) {
                    this.playDrum('snare', now + i * beatLength);
                }
                // ハイハット
                for (let j = 0; j < 2; j++) {
                    this.playDrum('hihat', now + i * beatLength + j * beatLength * 0.5);
                }
            }
            
            // ベースライン（アルペジオパターン）
            const bassPattern = [
                'C3', 'E3', 'G3', 'E3',
                'F3', 'A3', 'C4', 'A3',
                'G3', 'B3', 'D4', 'B3',
                'C3', 'E3', 'G3', 'E3'
            ];
            
            for (let i = 0; i < 16; i++) {
                this.playNote(
                    this.getNoteFrequency(bassPattern[i]),
                    beatLength * 0.23,
                    now + i * beatLength * 0.25,
                    'sawtooth',
                    0.3
                );
            }
            
            // リードメロディー（2小節目から）
            if (currentBeat % 8 >= 4) {
                const leadNotes = [
                    { note: 'G5', duration: 0.5 },
                    { note: 'E5', duration: 0.5 },
                    { note: 'C5', duration: 0.5 },
                    { note: 'E5', duration: 0.5 },
                    { note: 'G5', duration: 1 },
                    { note: 'A5', duration: 0.5 },
                    { note: 'G5', duration: 0.5 }
                ];
                
                let leadTime = now;
                leadNotes.forEach(({ note, duration }) => {
                    this.playNote(
                        this.getNoteFrequency(note),
                        duration * beatLength * 0.8,
                        leadTime,
                        'square',
                        0.25
                    );
                    leadTime += duration * beatLength;
                });
            }
            
            currentBeat += 4;
        };
        
        // 最初のバーを再生
        playBar();
        
        // ループ設定
        this.bgmLoopInterval = setInterval(() => {
            playBar();
        }, beatLength * 4 * 1000);
        
        this.currentBGM = 'game';
    }
    
    // ゲームクリアのジングル
    playVictoryJingle() {
        this.stopBGM();
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const notes = [
            { note: 'C5', time: 0, duration: 0.2 },
            { note: 'E5', time: 0.2, duration: 0.2 },
            { note: 'G5', time: 0.4, duration: 0.2 },
            { note: 'C6', time: 0.6, duration: 0.6 }
        ];
        
        notes.forEach(({ note, time, duration }) => {
            this.playNote(
                this.getNoteFrequency(note),
                duration,
                now + time,
                'sine',
                0.4
            );
        });
        
        // 和音
        this.playChord(['C4', 'E4', 'G4', 'C5'], 1.2, now, 'triangle', 0.3);
    }
    
    // ゲームオーバーのジングル
    playGameOverJingle() {
        this.stopBGM();
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const notes = [
            { note: 'C4', time: 0, duration: 0.3 },
            { note: 'B3', time: 0.3, duration: 0.3 },
            { note: 'A3', time: 0.6, duration: 0.3 },
            { note: 'G3', time: 0.9, duration: 0.6 }
        ];
        
        notes.forEach(({ note, time, duration }) => {
            this.playNote(
                this.getNoteFrequency(note),
                duration,
                now + time,
                'sine',
                0.3
            );
        });
    }
    
    // BGMを停止
    stopBGM() {
        if (this.bgmLoopInterval) {
            clearInterval(this.bgmLoopInterval);
            this.bgmLoopInterval = null;
        }
        this.currentBGM = null;
    }
    
    // 音量を設定
    setVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.bgmVolume;
        }
    }
}

// グローバルに音楽システムをエクスポート
if (typeof window !== 'undefined') {
    window.MusicSystem = MusicSystem;
}

// Node.js環境用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicSystem;
}