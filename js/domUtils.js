export const uiElements = {
    coordinatePlane: document.getElementById('coordinate-plane'),
    guessInput: document.getElementById('guess-input'),
    submitButton: document.getElementById('submit-guess'),
    nextButton: document.getElementById('next-problem'),
    feedbackDisplay: document.getElementById('feedback'),
    livesDisplay: document.getElementById('lives-display'),
    livesCountDisplay: document.getElementById('lives-count'),
    timerDisplayElement: document.getElementById('timer-display'),
    timeRemainingSpan: document.getElementById('time-remaining'),
    meanErrorDisplay: document.getElementById('mean-error'),
    roundCountDisplay: document.getElementById('round-count'),
    scoreDisplayElement: document.getElementById('score-display'),
    currentScoreSpan: document.getElementById('current-score'),
    startScreen: document.getElementById('start-screen'),
    gameActiveArea: document.getElementById('game-active-area'),
    gameOverScreen: document.getElementById('game-over-screen'),
    startGameButton: document.getElementById('start-game-button'),
    restartGameButton: document.getElementById('restart-game-button'),
    gameModeSelectionContainer: document.getElementById('game-mode-selection'),
    classicModeRadio: document.getElementById('classicModeRadio'),
    timeTrialModeRadio: document.getElementById('timeTrialModeRadio'),
    timeTrialDurationSelectionContainer: document.getElementById('time-trial-duration-selection'),
    timeTrial15sRadio: document.getElementById('timeTrial15sRadio'),
    timeTrial30sRadio: document.getElementById('timeTrial30sRadio'),
    finalScoreDisplayElement: document.getElementById('final-score-display'),
    finalScoreSpan: document.getElementById('final-score'),
    finalMeanErrorDisplay: document.getElementById('final-mean-error'),
    finalRoundsDisplay: document.getElementById('final-rounds')
};

export function showElement(element) {
    if (element) element.style.display = element.tagName === 'DIV' || element.tagName === 'SECTION' ? 'block' : 'inline-block'; // Basic default, flex might be better for some
}

export function hideElement(element) {
    if (element) element.style.display = 'none';
}

export function updateTextContent(element, text) {
    if (element) element.textContent = text;
}

export function setInputDisabled(inputElement, disabled) {
    if (inputElement) inputElement.disabled = disabled;
}

export function focusElement(element) {
    if (element) element.focus();
}

// Add more DOM utility functions as needed, e.g., for adding/removing classes
