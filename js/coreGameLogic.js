import { COORDINATE_SYSTEM_MAX, DOT_SPAWN_MARGIN, INITIAL_LIVES, CORRECT_ENOUGH_PERCENTAGE, GAME_MODE_SETTINGS, DEFAULT_GAME_MODE, GAME_MODES } from './config.js';
import { game } from './gameState.js'; // Import the shared game object

// Utility functions using imported DOT_SPAWN_MARGIN
export function generateCoordinate() {
    return Math.random() * (1 - 2 * DOT_SPAWN_MARGIN) + DOT_SPAWN_MARGIN;
}

export function generateDot() {
    return { x: generateCoordinate(), y: generateCoordinate() };
}

export function calculateDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// --- New functions for Chunk 4 ---

// Internal helper to set up data for a new round
function setupNewRoundProblemData() {
    game.currentDot1 = generateDot();
    game.currentDot2 = generateDot();
    game.actualDistance = calculateDistance(game.currentDot1, game.currentDot2);
    while (game.actualDistance === 0) {
        console.warn("Generated zero distance, regenerating dots.");
        game.currentDot1 = generateDot();
        game.currentDot2 = generateDot();
        game.actualDistance = calculateDistance(game.currentDot1, game.currentDot2);
    }
    // console.log(`CoreLogic: New problem data: Dot1 (${game.currentDot1.x.toFixed(3)}, ...`);
    // console.log(`CoreLogic: Actual distance: ${game.actualDistance.toFixed(3)}`);
}

export function initializeCoreGameData(mode, durationOption = null) {
    console.log(`CoreLogic: Initializing game data for mode: ${mode}` + (durationOption ? ` with duration: ${durationOption}s` : ''));
    game.selectedGameMode = mode;
    const modeSettings = GAME_MODE_SETTINGS[mode];

    game.lives = modeSettings.initialLives;
    if (modeSettings.hasTimer) {
        // Use provided durationOption if valid, else use mode's defaultDuration, else 0
        let selectedDuration = modeSettings.defaultDuration || 0;
        if (durationOption && modeSettings.availableDurations && modeSettings.availableDurations.includes(parseInt(durationOption))) {
            selectedDuration = parseInt(durationOption);
        }
        game.timerValue = selectedDuration;
        game.timerDurationSetting = selectedDuration; // Store the chosen duration setting
        console.log(`CoreLogic: Timer set to ${game.timerValue}s for Time Trial.`);
    } else {
        delete game.timerDurationSetting; // Clear if not a timer mode
    }
    game.currentRoundNumber = 0;
    game.errorScores = [];
    game.runningMeanError = 0;
    game.totalScore = 0;
    game.consecutiveCorrectGuesses = 0; // Initialize consecutive correct guesses

    game.currentRoundNumber++;
    setupNewRoundProblemData();
}

export function prepareNextRoundData() {
    console.log("CoreLogic: Preparing next round data...");
    game.currentRoundNumber++;
    setupNewRoundProblemData();
}

// New Weber-law based scoring function
export function calculateScore(actualDistance, guessedDistance) {
    const mode = game.selectedGameMode || DEFAULT_GAME_MODE;
    const params = GAME_MODE_SETTINGS[mode].scoringParams;

    if (!params.usesWeberScoring) {
        return isGuessCorrect(actualDistance, guessedDistance) ? 10 : 0;
    }

    const A = params.A;
    const B = params.B;

    const error = Math.abs(guessedDistance - actualDistance);
    const tolerance = Math.max(A, B * actualDistance);

    if (tolerance === 0) return error === 0 ? 100 : 0;

    const ratio = error / tolerance;
    if (ratio >= 1) return 0;

    const score = Math.floor(100 * Math.pow(1 - ratio, 2));
    return Math.max(0, score);
}

export function isGuessCorrect(actualDistance, guessedDistance) {
    const mode = game.selectedGameMode || DEFAULT_GAME_MODE;
    if (GAME_MODE_SETTINGS[mode].scoringParams.usesWeberScoring) {
        return calculateScore(actualDistance, guessedDistance) > 0;
    }
    const difference = Math.abs(actualDistance - guessedDistance);
    const tolerance = actualDistance * CORRECT_ENOUGH_PERCENTAGE;
    return difference <= tolerance;
}

export function recordGuessResult(guessedDistance) {
    const error = Math.abs(game.actualDistance - guessedDistance);
    game.errorScores.push(error);
    const k = game.errorScores.length;
    game.runningMeanError = game.runningMeanError + (error - game.runningMeanError) / k;

    const currentModeKey = game.selectedGameMode || DEFAULT_GAME_MODE;
    const currentModeSettings = GAME_MODE_SETTINGS[currentModeKey];

    if (currentModeSettings.scoringParams.usesWeberScoring) {
        const scoreForRound = calculateScore(game.actualDistance, guessedDistance);
        game.totalScore += scoreForRound;
        console.log(`CoreLogic: Weber Score for round: ${scoreForRound}, Total Score: ${game.totalScore}`);
    }

    // Handle consecutive correct guesses for Classic mode (non-Weber scoring part)
    if (currentModeKey === GAME_MODES.CLASSIC && !currentModeSettings.scoringParams.usesWeberScoring) {
        if (isGuessCorrect(game.actualDistance, guessedDistance)) {
            game.consecutiveCorrectGuesses++;
            console.log(`CoreLogic: Consecutive correct guesses: ${game.consecutiveCorrectGuesses}`);
            if (game.consecutiveCorrectGuesses >= 3) {
                increaseLife();
                game.consecutiveCorrectGuesses = 0; // Reset counter
            }
        } else {
            game.consecutiveCorrectGuesses = 0; // Reset on incorrect guess
            console.log("CoreLogic: Incorrect guess, reset consecutive correct counter.");
        }
    }
}

export function decreaseLife() {
    const mode = game.selectedGameMode || DEFAULT_GAME_MODE;
    if (GAME_MODE_SETTINGS[mode].initialLives > 0 && !GAME_MODE_SETTINGS[mode].hasTimer) {
        if (game.lives > 0) {
            game.lives--;
            console.log(`CoreLogic: Life decreased. Lives remaining: ${game.lives}`);
        }
    }
}

export function increaseLife() {
    const classicModeSettings = GAME_MODE_SETTINGS[GAME_MODES.CLASSIC];
    if (game.selectedGameMode === GAME_MODES.CLASSIC && game.lives < classicModeSettings.initialLives) {
        game.lives++;
        console.log(`CoreLogic: Life increased for 3 consecutive correct! Lives remaining: ${game.lives}`);
    } else if (game.selectedGameMode === GAME_MODES.CLASSIC) {
        console.log(`CoreLogic: Attempted to increase life, but already at initial max lives (${classicModeSettings.initialLives}) or not Classic mode.`);
    }
}

// Placeholder for game over condition check - might expand based on game modes
export function checkGameOver() {
    const mode = game.selectedGameMode || DEFAULT_GAME_MODE;
    const modeSettings = GAME_MODE_SETTINGS[mode];

    if (modeSettings.hasTimer) {
        return game.timerValue !== undefined && game.timerValue <= 0;
    }
    return game.lives <= 0;
}

// Timer Logic
export let gameTimerInterval = null;

export function startGameTimer(onTickCallback, onEndCallback) {
    stopGameTimer();
    const mode = game.selectedGameMode || DEFAULT_GAME_MODE;
    const modeSettings = GAME_MODE_SETTINGS[mode];

    // Ensure timer should run for this mode and game.timerValue is validly set by initializeCoreGameData
    if (!modeSettings.hasTimer || game.timerValue === undefined || game.timerValue <= 0) {
        console.warn(`CoreLogic: Timer not started for mode ${mode}. HasTimer: ${modeSettings.hasTimer}, TimerValue: ${game.timerValue}`);
        return;
    }

    // game.timerValue is already set by initializeCoreGameData with the selected duration.
    console.log(`CoreLogic: Starting timer for ${mode} with initial duration ${game.timerValue}s`);
    onTickCallback(game.timerValue); // Initial tick to display starting time immediately

    gameTimerInterval = setInterval(() => {
        if (game.timerValue > 0) {
            game.timerValue--;
            onTickCallback(game.timerValue);
        }
        // Check if timer has reached zero after decrement
        if (game.timerValue <= 0) {
            stopGameTimer();
            onEndCallback();
        }
    }, 1000);
}

export function stopGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
        console.log("CoreLogic: Timer stopped.");
    }
}
