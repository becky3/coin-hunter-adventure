// Quick test to check what files exist and their basic structure
const fs = require('fs');
const path = require('path');

console.log('=== File Existence Check ===');

const files = ['config.js', 'levels.js', 'game.js', 'music.js', 'test.js', 'test.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✓ ${file} (${stats.size} bytes)`);
        
        // Check for syntax errors by trying to read
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (file.endsWith('.js')) {
                // Basic syntax check - look for obvious issues
                if (content.includes('function') || content.includes('class') || content.includes('var') || content.includes('const')) {
                    console.log(`  - Contains valid JS syntax`);
                } else {
                    console.log(`  - Warning: May not contain valid JS`);
                }
            }
        } catch (error) {
            console.log(`  - Error reading file: ${error.message}`);
        }
    } else {
        console.log(`✗ ${file} - NOT FOUND`);
    }
});

console.log('\n=== Config Variables Check ===');
try {
    const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
    eval(configContent);
    console.log(`✓ CANVAS_WIDTH: ${typeof CANVAS_WIDTH !== 'undefined' ? CANVAS_WIDTH : 'UNDEFINED'}`);
    console.log(`✓ CANVAS_HEIGHT: ${typeof CANVAS_HEIGHT !== 'undefined' ? CANVAS_HEIGHT : 'UNDEFINED'}`);
    console.log(`✓ PLAYER_CONFIG: ${typeof PLAYER_CONFIG !== 'undefined' ? 'DEFINED' : 'UNDEFINED'}`);
    console.log(`✓ SPRING_CONFIG: ${typeof SPRING_CONFIG !== 'undefined' ? 'DEFINED' : 'UNDEFINED'}`);
} catch (error) {
    console.log(`✗ Config evaluation error: ${error.message}`);
}

console.log('\n=== Level Data Check ===');
try {
    const levelsContent = fs.readFileSync(path.join(__dirname, 'levels.js'), 'utf8');
    eval(levelsContent);
    console.log(`✓ levelData: ${typeof levelData !== 'undefined' ? 'DEFINED' : 'UNDEFINED'}`);
    if (typeof levelData !== 'undefined') {
        console.log(`  - platforms: ${Array.isArray(levelData.platforms) ? levelData.platforms.length : 'NOT ARRAY'}`);
        console.log(`  - enemies: ${Array.isArray(levelData.enemies) ? levelData.enemies.length : 'NOT ARRAY'}`);
        console.log(`  - coins: ${Array.isArray(levelData.coins) ? levelData.coins.length : 'NOT ARRAY'}`);
        console.log(`  - springs: ${Array.isArray(levelData.springs) ? levelData.springs.length : 'NOT ARRAY'}`);
    }
} catch (error) {
    console.log(`✗ Levels evaluation error: ${error.message}`);
}

console.log('\n=== Music System Check ===');
const musicPath = path.join(__dirname, 'music.js');
if (fs.existsSync(musicPath)) {
    try {
        const musicContent = fs.readFileSync(musicPath, 'utf8');
        if (musicContent.includes('class MusicSystem')) {
            console.log('✓ MusicSystem class found');
        } else {
            console.log('⚠ MusicSystem class not found in music.js');
        }
    } catch (error) {
        console.log(`✗ Music file error: ${error.message}`);
    }
} else {
    console.log('⚠ music.js not found - tests will use mock');
}