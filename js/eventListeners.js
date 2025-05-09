import { uiElements } from './domUtils.js';
import { updateTextContent } from './domUtils.js'; // Removed setInputDisabled, focusElement as they are handled by gameState or not directly used here
import { game, setGameState, getCurrentGameState } from './gameState.js';
import { GAME_STATES, GAME_MODES, GAME_MODE_SETTINGS, DEFAULT_GAME_MODE } from './config.js';
import {
    initializeCoreGameData,
    prepareNextRoundData,
    isGuessCorrect, // Still used by displayNewProblem indirectly via calculateScore for Weber modes
    recordGuessResult,
    decreaseLife,
    checkGameOver,
    startGameTimer,
    stopGameTimer,
    calculateScore
} from './coreGameLogic.js';
import { renderDot, renderDistanceLine, clearProblemGraphics } from './graphics.js';

// Helper to update timer display on UI
function updateTimerDisplay(time) {
    if (uiElements.timeRemainingSpan) {
        updateTextContent(uiElements.timeRemainingSpan, time);
    }
}

// Helper for when time runs out in Time Trial
function handleTimeUp() {
    console.log("EventListeners: Time is up!");
    // Ensure game over state is set, which also handles UI updates
    if (getCurrentGameState() !== GAME_STATES.GAME_OVER) {
        setGameState(GAME_STATES.GAME_OVER);
    }
    // startGameTimer in coreGameLogic should already stop the timer, but an explicit stop here is safe.
    stopGameTimer();
}

function displayNewProblem() {
    console.log("EventListeners: Displaying new problem");
    clearProblemGraphics();

    if (!game.currentDot1 || !game.currentDot2) {
        console.error("Cannot display problem: dot data is missing.");
        return;
    }
    renderDot(game.currentDot1.x, game.currentDot1.y, 'red', 'dot1');
    renderDot(game.currentDot2.x, game.currentDot2.y, 'blue', 'dot2');

    if (uiElements.guessInput) uiElements.guessInput.value = '';

    // Update stats based on game object (lives/timer are handled by gameState.updateUIForState)
    updateTextContent(uiElements.roundCountDisplay, game.currentRoundNumber);
    updateTextContent(uiElements.currentScoreSpan, game.totalScore !== undefined ? game.totalScore : '0');
    if (game.errorScores && game.errorScores.length > 0) {
        updateTextContent(uiElements.meanErrorDisplay, game.runningMeanError.toFixed(3));
    } else {
        updateTextContent(uiElements.meanErrorDisplay, 'N/A');
    }
}

function handleSubmitGuess() {
    if (!uiElements.guessInput || !uiElements.feedbackDisplay) return;

    const guessedValue = uiElements.guessInput.value;
    if (guessedValue.trim() === '') {
        updateTextContent(uiElements.feedbackDisplay, 'Please enter a number.');
        uiElements.feedbackDisplay.className = 'feedback feedback-error';
        return;
    }
    const parsedGuess = parseFloat(guessedValue);
    if (isNaN(parsedGuess)) {
        updateTextContent(uiElements.feedbackDisplay, 'Invalid input. Please enter a valid number.');
        uiElements.feedbackDisplay.className = 'feedback feedback-error';
        return;
    }

    recordGuessResult(parsedGuess);
    const correctForClassic = isGuessCorrect(game.actualDistance, parsedGuess);
    updateTextContent(uiElements.currentScoreSpan, game.totalScore);

    // Calculate errors for feedback
    const absError = Math.abs(game.actualDistance - parsedGuess);
    const percError = game.actualDistance !== 0 ? (absError / game.actualDistance) * 100 : (absError > 0 ? Infinity : 0);
    const errorFeedback = ` Your Error: ${absError.toFixed(3)} (${percError.toFixed(1)}%).`;

    const currentModeSettings = GAME_MODE_SETTINGS[game.selectedGameMode];
    let feedbackMessageBase = '';
    let feedbackClass = '';

    if (currentModeSettings.scoringParams.usesWeberScoring) {
        const scoredPoints = calculateScore(game.actualDistance, parsedGuess); // Recalculate score for feedback context
        if (scoredPoints > 0) {
            feedbackMessageBase = `Correct! You scored ${scoredPoints} pts.`;
            feedbackClass = 'feedback-correct';
        } else {
            feedbackMessageBase = `Incorrect. Actual: ${game.actualDistance.toFixed(3)}.`;
            feedbackClass = 'feedback-incorrect';
        }
    } else {
        if (correctForClassic) {
            feedbackMessageBase = 'Correct! Well done.';
            feedbackClass = 'feedback-correct';
        } else {
            feedbackMessageBase = `Incorrect. Actual: ${game.actualDistance.toFixed(3)}.`;
            feedbackClass = 'feedback-incorrect';
        }
    }
    updateTextContent(uiElements.feedbackDisplay, feedbackMessageBase + errorFeedback);
    uiElements.feedbackDisplay.className = `feedback ${feedbackClass}`;

    if (game.selectedGameMode === GAME_MODES.CLASSIC && !correctForClassic) {
        decreaseLife();
    }

    renderDistanceLine(game.currentDot1, game.currentDot2,
        currentModeSettings.scoringParams.usesWeberScoring ? isGuessCorrect(game.actualDistance, parsedGuess) : correctForClassic);

    if (checkGameOver()) {
        stopGameTimer();
        setGameState(GAME_STATES.GAME_OVER);
    } else {
        setGameState(GAME_STATES.SHOWING_FEEDBACK);
    }
}

export function initializeEventListeners() {
    // Listener for main game mode selection (Classic vs Time Trial)
    function handleModeSelectionChange() {
        const previousMode = game.selectedGameMode;
        if (uiElements.classicModeRadio && uiElements.classicModeRadio.checked) {
            game.selectedGameMode = GAME_MODES.CLASSIC;
        } else if (uiElements.timeTrialModeRadio && uiElements.timeTrialModeRadio.checked) {
            game.selectedGameMode = GAME_MODES.TIME_TRIAL;
        }

        // If the mode actually changed and we are on the start screen, force a UI update for it.
        if (game.selectedGameMode !== previousMode && getCurrentGameState() === GAME_STATES.START_SCREEN) {
            console.log("EventListeners: Mode selection changed on start screen, forcing UI update.");
            setGameState(GAME_STATES.START_SCREEN, true); // Force update
        } else if (getCurrentGameState() === GAME_STATES.START_SCREEN) {
            // If mode didn't change but we are on start screen, ensure UI is consistent (e.g. if called initially)
            // This case might not be strictly necessary if main.js setup is robust.
            setGameState(GAME_STATES.START_SCREEN, true);
        }
    }

    if (uiElements.classicModeRadio) {
        uiElements.classicModeRadio.addEventListener('change', handleModeSelectionChange);
    }
    if (uiElements.timeTrialModeRadio) {
        uiElements.timeTrialModeRadio.addEventListener('change', handleModeSelectionChange);
    }

    if (uiElements.startGameButton) {
        uiElements.startGameButton.addEventListener('click', () => {
            if (getCurrentGameState() === GAME_STATES.START_SCREEN) {
                // Selected mode is already set in game.selectedGameMode by radio button listeners
                // or defaults if no interaction happened (though main.js sets a default too)
                let currentSelectedMode = game.selectedGameMode || DEFAULT_GAME_MODE;
                let duration = null;

                if (currentSelectedMode === GAME_MODES.TIME_TRIAL) {
                    if (uiElements.timeTrial30sRadio && uiElements.timeTrial30sRadio.checked) {
                        duration = 30;
                    } else if (uiElements.timeTrial15sRadio && uiElements.timeTrial15sRadio.checked) {
                        duration = 15;
                    } else {
                        // Fallback to default if somehow no duration radio is selected for time trial
                        duration = GAME_MODE_SETTINGS[GAME_MODES.TIME_TRIAL].defaultDuration;
                    }
                    console.log(`Starting Time Trial with duration: ${duration}s`);
                }

                initializeCoreGameData(currentSelectedMode, duration);
                setGameState(GAME_STATES.ACTIVE_GAME);

                const modeSettings = GAME_MODE_SETTINGS[currentSelectedMode];
                if (modeSettings.hasTimer) {
                    startGameTimer(updateTimerDisplay, handleTimeUp);
                }

                requestAnimationFrame(() => {
                    if (uiElements.coordinatePlane && uiElements.coordinatePlane.clientWidth > 0) {
                        displayNewProblem();
                    } else {
                        console.warn("Coordinate plane not ready, retrying displayNewProblem with setTimeout");
                        setTimeout(displayNewProblem, 0);
                    }
                });
            }
        });
    }

    if (uiElements.submitButton) {
        uiElements.submitButton.addEventListener('click', handleSubmitGuess);
    }
    if (uiElements.guessInput) {
        uiElements.guessInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && getCurrentGameState() === GAME_STATES.ACTIVE_GAME) {
                event.preventDefault();
                handleSubmitGuess();
            }
        });
    }

    if (uiElements.nextButton) {
        uiElements.nextButton.addEventListener('click', () => {
            if (getCurrentGameState() === GAME_STATES.SHOWING_FEEDBACK) {
                prepareNextRoundData();
                displayNewProblem();
                setGameState(GAME_STATES.ACTIVE_GAME);
            }
        });
    }

    if (uiElements.restartGameButton) {
        uiElements.restartGameButton.addEventListener('click', () => {
            console.log("Restart Game button clicked");
            stopGameTimer();
            let currentSelectedMode = game.selectedGameMode;
            let duration = null;
            if (currentSelectedMode === GAME_MODES.TIME_TRIAL) {
                // For restart, use the previously set duration for the time trial mode
                duration = game.timerDurationSetting || GAME_MODE_SETTINGS[GAME_MODES.TIME_TRIAL].defaultDuration;
            }
            initializeCoreGameData(currentSelectedMode, duration);
            setGameState(GAME_STATES.ACTIVE_GAME);
            const modeSettings = GAME_MODE_SETTINGS[currentSelectedMode];
            if (modeSettings.hasTimer) {
                startGameTimer(updateTimerDisplay, handleTimeUp);
            }
            requestAnimationFrame(() => {
                 if (uiElements.coordinatePlane && uiElements.coordinatePlane.clientWidth > 0) {
                    displayNewProblem();
                } else {
                    console.warn("Coordinate plane not ready, retrying displayNewProblem with setTimeout on restart");
                    setTimeout(displayNewProblem, 0);
                }
            });
        });
    }
    console.log("EventListeners: Initialized");
}
