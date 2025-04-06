// Game State
const gameState = {
    player: { x: 0, y: 0, health: 100 },
    enemies: [
        { x: 5, y: 5, health: 50, type: 'goblin' },
        { x: 7, y: 2, health: 30, type: 'skeleton' }
    ],
    objectives: [
        { x: 9, y: 9, type: 'treasure' }
    ],
    terrain: [],
    turn: 0,
    gameOver: false
};

// DOM Elements
const codeEditor = document.getElementById('code-editor');
const executeBtn = document.getElementById('execute-btn');
const resetBtn = document.getElementById('reset-btn');
const gameBoard = document.getElementById('game-board');
const battleLog = document.getElementById('battle-log');
const objectiveDisplay = document.getElementById('objective');

// Initialize Game Board
function initGameBoard() {
    gameBoard.innerHTML = '';
    
    // Generate terrain (0 = grass, 1 = mountain, 2 = water)
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const tile = document.createElement('div');
            tile.className = 'game-tile bg-green-700 flex items-center justify-center';
            tile.dataset.x = x;
            tile.dataset.y = y;
            
            // Random terrain (80% grass, 15% mountain, 5% water)
            const terrainType = Math.random();
            if (terrainType > 0.95) {
                tile.classList.add('bg-blue-600');
                gameState.terrain.push({ x, y, type: 'water' });
            } else if (terrainType > 0.8) {
                tile.classList.add('bg-gray-500');
                gameState.terrain.push({ x, y, type: 'mountain' });
            } else {
                gameState.terrain.push({ x, y, type: 'grass' });
            }
            
            gameBoard.appendChild(tile);
        }
    }
    
    updateGameBoard();
}

// Update game board with units and objectives
function updateGameBoard() {
    // Clear all icons
    document.querySelectorAll('.game-tile i').forEach(icon => icon.remove());
    
    // Place player
    const playerTile = document.querySelector(`.game-tile[data-x="${gameState.player.x}"][data-y="${gameState.player.y}"]`);
    if (playerTile) {
        const playerIcon = document.createElement('i');
        playerIcon.className = 'fas fa-user text-yellow-400 text-xl';
        playerTile.appendChild(playerIcon);
    }
    
    // Place enemies
    gameState.enemies.forEach(enemy => {
        if (enemy.health > 0) {
            const enemyTile = document.querySelector(`.game-tile[data-x="${enemy.x}"][data-y="${enemy.y}"]`);
            if (enemyTile) {
                const enemyIcon = document.createElement('i');
                enemyIcon.className = `fas fa-${enemy.type === 'goblin' ? 'skull' : 'ghost'} text-red-500 text-xl`;
                enemyTile.appendChild(enemyIcon);
            }
        }
    });
    
    // Place objectives
    gameState.objectives.forEach(obj => {
        const objTile = document.querySelector(`.game-tile[data-x="${obj.x}"][data-y="${obj.y}"]`);
        if (objTile) {
            const objIcon = document.createElement('i');
            objIcon.className = 'fas fa-treasure-chest text-yellow-300 text-xl';
            objTile.appendChild(objIcon);
        }
    });
}

// Execute player's code
function executeCode() {
    if (gameState.gameOver) return;
    
    const code = codeEditor.value;
    try {
        // Simple command parser
        const commands = code.split('\n').filter(cmd => cmd.trim());
        
        commands.forEach(command => {
            if (command.startsWith('move')) {
                const match = command.match(/move\((\d+),\s*["'](up|down|left|right)["']\)/);
                if (match) {
                    const steps = parseInt(match[1]);
                    const direction = match[2];
                    movePlayer(steps, direction);
                }
            } else if (command.startsWith('attack')) {
                attack();
            } else if (command.startsWith('wait')) {
                // Do nothing for this turn
            }
        });
        
        gameState.turn++;
        enemyTurn();
        checkGameState();
    } catch (error) {
        logMessage(`Error: ${error.message}`);
    }
}

// Move player function
function movePlayer(steps, direction) {
    let newX = gameState.player.x;
    let newY = gameState.player.y;
    
    for (let i = 0; i < steps; i++) {
        switch (direction) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }
        
        // Check boundaries
        if (newX < 0 || newX > 9 || newY < 0 || newY > 9) {
            logMessage("Can't move outside the map!");
            return;
        }
        
        // Check terrain
        const tile = gameState.terrain.find(t => t.x === newX && t.y === newY);
        if (tile && tile.type === 'mountain') {
            logMessage("Can't move through mountains!");
            return;
        }
        if (tile && tile.type === 'water') {
            logMessage("Can't move through water!");
            return;
        }
    }
    
    gameState.player.x = newX;
    gameState.player.y = newY;
    logMessage(`Moved ${steps} steps ${direction}`);
    updateGameBoard();
}

// Attack function
function attack() {
    const player = gameState.player;
    let attacked = false;
    
    gameState.enemies.forEach(enemy => {
        if (enemy.health > 0 && 
            Math.abs(enemy.x - player.x) <= 1 && 
            Math.abs(enemy.y - player.y) <= 1) {
            enemy.health -= 20;
            logMessage(`Attacked ${enemy.type}! (${enemy.health} HP left)`);
            attacked = true;
        }
    });
    
    if (!attacked) {
        logMessage("No enemies in range to attack!");
    }
    
    updateGameBoard();
}

// Enemy turn logic
function enemyTurn() {
    gameState.enemies.forEach(enemy => {
        if (enemy.health > 0) {
            // Simple AI: move toward player if not adjacent
            const dx = gameState.player.x - enemy.x;
            const dy = gameState.player.y - enemy.y;
            
            if (Math.abs(dx) + Math.abs(dy) > 1) {
                // Move toward player
                if (Math.abs(dx) > Math.abs(dy)) {
                    enemy.x += dx > 0 ? 1 : -1;
                } else {
                    enemy.y += dy > 0 ? 1 : -1;
                }
            } else if (Math.abs(dx) + Math.abs(dy) === 1) {
                // Attack if adjacent
                gameState.player.health -= 10;
                logMessage(`${enemy.type} attacked you! (${gameState.player.health} HP left)`);
            }
        }
    });
}

// Check win/lose conditions
function checkGameState() {
    // Check if player reached treasure
    const treasure = gameState.objectives.find(obj => 
        obj.x === gameState.player.x && 
        obj.y === gameState.player.y
    );
    
    if (treasure) {
        logMessage("You found the treasure! You win!", 'text-yellow-300');
        gameState.gameOver = true;
        return;
    }
    
    // Check if player died
    if (gameState.player.health <= 0) {
        logMessage("You were defeated! Game over.", 'text-red-500');
        gameState.gameOver = true;
        return;
    }
    
    // Check if all enemies defeated
    if (gameState.enemies.every(enemy => enemy.health <= 0)) {
        logMessage("All enemies defeated! You win!", 'text-green-400');
        gameState.gameOver = true;
        return;
    }
}

// Log messages to battle log
function logMessage(message, colorClass = 'text-white') {
    const messageElement = document.createElement('div');
    messageElement.className = colorClass;
    messageElement.textContent = `Turn ${gameState.turn}: ${message}`;
    battleLog.appendChild(messageElement);
    battleLog.scrollTop = battleLog.scrollHeight;
}

// Setup drag and drop for commands
function setupDragAndDrop() {
    document.querySelectorAll('.draggable-command').forEach(button => {
        button.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', button.dataset.command);
        });
    });
    
    codeEditor.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    codeEditor.addEventListener('drop', (e) => {
        e.preventDefault();
        const command = e.dataTransfer.getData('text/plain');
        const cursorPos = codeEditor.selectionStart;
        const textBefore = codeEditor.value.substring(0, cursorPos);
        const textAfter = codeEditor.value.substring(cursorPos);
        codeEditor.value = textBefore + command + '\n' + textAfter;
    });
}

// Initialize game
function initGame() {
    initGameBoard();
    setupDragAndDrop();
    
    executeBtn.addEventListener('click', executeCode);
    resetBtn.addEventListener('click', () => {
        gameState.player = { x: 0, y: 0, health: 100 };
        gameState.enemies = [
            { x: 5, y: 5, health: 50, type: 'goblin' },
            { x: 7, y: 2, health: 30, type: 'skeleton' }
        ];
        gameState.turn = 0;
        gameState.gameOver = false;
        codeEditor.value = '';
        battleLog.innerHTML = '';
        initGameBoard();
        logMessage("Game reset. Good luck!");
    });
    
    logMessage("Game started! Write commands to move and attack.");
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);