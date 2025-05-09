import { GAME_STATES, GAME_MODES, GAME_MODE_SETTINGS, DEFAULT_GAME_MODE } from './config.js';
import { uiElements, showElement, hideElement, updateTextContent, setInputDisabled, focusElement } from './domUtils.js';
import { clearDistanceLine as clearGraphicsDistanceLine } from './graphics.js';

export let game = {
    selectedGameMode: DEFAULT_GAME_MODE, // Initialize with default
    totalScore: 0,
    // other properties (lives, currentRoundNumber, errorScores, runningMeanError, currentDot1, currentDot2, actualDistance, timerValue) will be initialized by coreGameLogic
};
let currentGameState; // Internal module state

function updateUIForState() {
    // Hide all state-specific sections by default
    hideElement(uiElements.startScreen);
    hideElement(uiElements.gameActiveArea);
    hideElement(uiElements.gameOverScreen);

    // Hide mode-specific displays by default, then show based on mode
    hideElement(uiElements.livesDisplay);
    hideElement(uiElements.timerDisplayElement);
    // Score display is generally always visible during active game/game over
    showElement(uiElements.scoreDisplayElement);
    hideElement(uiElements.timeTrialDurationSelectionContainer); // Ensure hidden by default

    const modeSettings = GAME_MODE_SETTINGS[game.selectedGameMode || DEFAULT_GAME_MODE];

    // Controls within gameActiveArea that also need individual management
    if (uiElements.coordinatePlane) uiElements.coordinatePlane.style.display = 'block';
    hideElement(uiElements.guessInput);
    setInputDisabled(uiElements.guessInput, true);
    hideElement(uiElements.submitButton);
    setInputDisabled(uiElements.submitButton, true);
    hideElement(uiElements.nextButton);
    hideElement(uiElements.feedbackDisplay);

    switch (currentGameState) {
        case GAME_STATES.START_SCREEN:
            showElement(uiElements.startScreen);
            if (game.selectedGameMode === GAME_MODES.CLASSIC && uiElements.classicModeRadio) {
                uiElements.classicModeRadio.checked = true;
                hideElement(uiElements.timeTrialDurationSelectionContainer); // Hide duration options for Classic
            } else if (game.selectedGameMode === GAME_MODES.TIME_TRIAL && uiElements.timeTrialModeRadio) {
                uiElements.timeTrialModeRadio.checked = true;
                showElement(uiElements.timeTrialDurationSelectionContainer); // Show duration options for Time Trial
                 // Ensure default duration radio is checked if visible
                if (uiElements.timeTrial15sRadio && GAME_MODE_SETTINGS[GAME_MODES.TIME_TRIAL].defaultDuration === 15) uiElements.timeTrial15sRadio.checked = true;
                else if (uiElements.timeTrial30sRadio && GAME_MODE_SETTINGS[GAME_MODES.TIME_TRIAL].defaultDuration === 30) uiElements.timeTrial30sRadio.checked = true;
            }
            console.log("State: START_SCREEN");
            break;
        case GAME_STATES.ACTIVE_GAME:
        case GAME_STATES.SHOWING_FEEDBACK:
            if (uiElements.gameActiveArea) uiElements.gameActiveArea.style.display = 'flex';
            updateTextContent(uiElements.currentScoreSpan, game.totalScore !== undefined ? game.totalScore : '0');

            if (modeSettings.hasTimer) {
                showElement(uiElements.timerDisplayElement);
                updateTextContent(uiElements.timeRemainingSpan, game.timerValue !== undefined ? game.timerValue : (modeSettings.defaultDuration || '0'));
            } else {
                showElement(uiElements.livesDisplay);
                updateTextContent(uiElements.livesCountDisplay, game.lives !== undefined ? game.lives : modeSettings.initialLives);
            }

            if (currentGameState === GAME_STATES.ACTIVE_GAME) {
                showElement(uiElements.guessInput);
                setInputDisabled(uiElements.guessInput, false);
                focusElement(uiElements.guessInput);
                showElement(uiElements.submitButton);
                setInputDisabled(uiElements.submitButton, false);
                updateTextContent(uiElements.feedbackDisplay, '');
                if (uiElements.feedbackDisplay) {
                    uiElements.feedbackDisplay.classList.remove('feedback-correct', 'feedback-incorrect', 'feedback-error');
                    uiElements.feedbackDisplay.style.color = '';
                }
                console.log("State: ACTIVE_GAME");
            } else { // SHOWING_FEEDBACK
                showElement(uiElements.guessInput);
                setInputDisabled(uiElements.guessInput, true);
                showElement(uiElements.nextButton);
                focusElement(uiElements.nextButton);
                console.log("State: SHOWING_FEEDBACK");
            }
            showElement(uiElements.feedbackDisplay);
            break;
        case GAME_STATES.GAME_OVER:
            showElement(uiElements.gameOverScreen);
            updateTextContent(uiElements.finalScoreSpan, game.totalScore !== undefined ? game.totalScore : '0');
            showElement(uiElements.finalScoreDisplayElement);

            if (game.runningMeanError !== undefined) {
                updateTextContent(uiElements.finalMeanErrorDisplay, game.runningMeanError.toFixed(3));
            }
            if (game.currentRoundNumber !== undefined) {
                updateTextContent(uiElements.finalRoundsDisplay, game.currentRoundNumber);
            }
            focusElement(uiElements.restartGameButton);
            console.log("State: GAME_OVER");
            break;
        default:
            console.error("Unknown game state:", currentGameState);
    }
}

export function setGameState(newState, forceUpdate = false) {
    if (!forceUpdate && currentGameState === newState) {
        console.log(`GameState: State ${newState} is already active. No transition.`);
        return;
    }
    console.log(`GameState: Transitioning from ${currentGameState} to ${newState}. Force update: ${forceUpdate}`);
    currentGameState = newState;
    if (newState !== GAME_STATES.SHOWING_FEEDBACK) {
        clearGraphicsDistanceLine();
    }
    updateUIForState();
}

export const getCurrentGameState = () => currentGameState;
