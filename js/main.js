import { initializeCoreGameData } from './coreGameLogic.js';
import { initializeEventListeners } from './eventListeners.js';
import { game, setGameState } from './gameState.js'; // game object imported for selectedGameMode init
import { GAME_STATES, DEFAULT_GAME_MODE } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main.js: DOM fully loaded. Initializing game...");

    // Set default game mode in the game state before core data init
    // Event listener for start button will read the actual UI selection.
    game.selectedGameMode = DEFAULT_GAME_MODE;

    // 1. Initialize core game data using the default mode.
    //    The actual game start will use the mode selected in UI via eventListeners.
    //    This primarily ensures game object is in a consistent state for first UI paint by setGameState.
    initializeCoreGameData(DEFAULT_GAME_MODE);

    // 2. Initialize all event listeners for game controls
    initializeEventListeners();

    // 3. Set the initial game state to show the start screen
    // The game object is now populated, and event listeners are ready.
    // updateUIForState (called by setGameState) will handle showing the correct elements.
    setGameState(GAME_STATES.START_SCREEN);

    console.log("Main.js: Game initialization complete. Waiting for user to start.");
});
