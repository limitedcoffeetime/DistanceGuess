document.addEventListener('DOMContentLoaded', () => {
    const coordinatePlane = document.getElementById('coordinate-plane');
    const guessInput = document.getElementById('guess-input');
    const submitButton = document.getElementById('submit-guess');
    const nextButton = document.getElementById('next-problem');
    const feedbackDisplay = document.getElementById('feedback');
    const livesCountDisplay = document.getElementById('lives-count');
    const meanErrorDisplay = document.getElementById('mean-error');

    // New UI elements for states
    const startScreen = document.getElementById('start-screen');
    const gameActiveArea = document.getElementById('game-active-area');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startGameButton = document.getElementById('start-game-button');
    const restartGameButton = document.getElementById('restart-game-button');
    const finalMeanErrorDisplay = document.getElementById('final-mean-error');
    const finalRoundsDisplay = document.getElementById('final-rounds'); // Assuming an element for final rounds

    // Phase 3: Game State Management
    const GAME_STATES = {
        START_SCREEN: 'START_SCREEN', // Or 'LOADING' / 'INITIALIZING'
        ACTIVE_GAME: 'ACTIVE_GAME',   // Player can make a guess
        SHOWING_FEEDBACK: 'SHOWING_FEEDBACK', // Player sees results of their guess
        GAME_OVER: 'GAME_OVER'      // Game has ended
    };
    let currentGameState;

    // Game logic constants
    const COORDINATE_SYSTEM_MAX = 1.0;
    const MAX_POSSIBLE_DISTANCE = Math.sqrt(2 * Math.pow(COORDINATE_SYSTEM_MAX, 2));
    const CORRECT_ENOUGH_PERCENTAGE = 0.15;
    const INITIAL_LIVES = 3;
    const MAX_LIVES = 5;

    // Centralized game state object, mirroring Python's Game class
    let game = {};

    function generateCoordinate() {
        // Generates a random coordinate between 0 and 1
        return Math.random();
    }

    function generateDot() {
        // Returns an object {x, y}
        return { x: generateCoordinate(), y: generateCoordinate() };
    }

    function calculateDistance(p1, p2) {
        // Calculates Euclidean distance
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    // End of Phase 1 placeholders

    function renderDot(x, y, color, id) {
        const dotElement = document.createElement('div');
        dotElement.classList.add('dot');
        dotElement.id = id;
        dotElement.style.backgroundColor = color;
        // Convert 0-1 coordinates to percentage for CSS positioning
        dotElement.style.left = `${x * 100}%`;
        dotElement.style.top = `${y * 100}%`;
        coordinatePlane.appendChild(dotElement);
        return dotElement;
    }

    function clearDots() {
        const existingDots = coordinatePlane.querySelectorAll('.dot');
        existingDots.forEach(dot => dot.remove());
        // Also clear any existing distance lines
        const existingLines = coordinatePlane.querySelectorAll('.distance-line');
        existingLines.forEach(line => line.remove());
    }

    function showActualDistance() {
        const dot1 = document.getElementById('dot1');
        const dot2 = document.getElementById('dot2');

        if (!dot1 || !dot2) return;

        // Create line element
        const line = document.createElement('div');
        line.classList.add('distance-line');

        // Calculate line position and length
        const x1 = parseFloat(dot1.style.left);
        const y1 = parseFloat(dot1.style.top);
        const x2 = parseFloat(dot2.style.left);
        const y2 = parseFloat(dot2.style.top);

        // Calculate line length and angle
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        // Position and rotate line
        line.style.width = `${length}%`;
        line.style.left = `${x1}%`;
        line.style.top = `${y1}%`;
        line.style.transform = `rotate(${angle}deg)`;

        coordinatePlane.appendChild(line);
    }

    function updateUIForState() {
        // Hide all state-specific sections by default
        if (startScreen) startScreen.style.display = 'none';
        if (gameActiveArea) gameActiveArea.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';

        // Controls within gameActiveArea that also need individual management
        coordinatePlane.style.display = 'block'; // Assuming it's part of gameActiveArea
        guessInput.style.display = 'none';
        submitButton.style.display = 'none';
        nextButton.style.display = 'none';
        feedbackDisplay.style.display = 'none';

        switch (currentGameState) {
            case GAME_STATES.START_SCREEN:
                if (startScreen) startScreen.style.display = 'block';
                console.log("State: START_SCREEN");
                break;
            case GAME_STATES.ACTIVE_GAME:
                if (gameActiveArea) gameActiveArea.style.display = 'block';
                guessInput.style.display = 'block';
                guessInput.disabled = false;
                guessInput.focus(); // Auto-focus on input field
                submitButton.style.display = 'inline-block';
                submitButton.disabled = false;
                nextButton.style.display = 'none';
                feedbackDisplay.textContent = ''; // Clear previous feedback
                feedbackDisplay.style.display = 'block';
                console.log("State: ACTIVE_GAME");
                break;
            case GAME_STATES.SHOWING_FEEDBACK:
                if (gameActiveArea) gameActiveArea.style.display = 'block';
                guessInput.style.display = 'block';
                guessInput.disabled = true;
                submitButton.style.display = 'none';
                nextButton.style.display = 'inline-block';
                nextButton.focus(); // Auto-focus on next button
                feedbackDisplay.style.display = 'block';
                console.log("State: SHOWING_FEEDBACK");
                break;
            case GAME_STATES.GAME_OVER:
                if (gameOverScreen) gameOverScreen.style.display = 'block';
                if (finalMeanErrorDisplay) finalMeanErrorDisplay.textContent = game.runningMeanError.toFixed(3);
                if (finalRoundsDisplay) finalRoundsDisplay.textContent = game.currentRoundNumber; // Show total rounds played
                restartGameButton.focus(); // Auto-focus on restart
                console.log("State: GAME_OVER");
                break;
            default:
                console.error("Unknown game state:", currentGameState);
        }
    }

    function setGameState(newState) {
        if (currentGameState === newState) return; // Avoid redundant updates

        console.log(`Transitioning from ${currentGameState} to ${newState}`);
        currentGameState = newState;
        updateUIForState();
    }

    function setupNewProblem() {
        clearDots();
        // Dots are now generated by game.startNewRound() or game.nextRound()
        renderDot(game.currentDot1.x, game.currentDot1.y, 'red', 'dot1');
        renderDot(game.currentDot2.x, game.currentDot2.y, 'blue', 'dot2');

        console.log(`UI: New problem: Dot1 (${game.currentDot1.x.toFixed(3)}, ${game.currentDot1.y.toFixed(3)}), Dot2 (${game.currentDot2.x.toFixed(3)}, ${game.currentDot2.y.toFixed(3)})`);
        console.log(`UI: Actual distance: ${game.actualDistance.toFixed(3)}`);

        guessInput.value = '';
        if(livesCountDisplay) livesCountDisplay.textContent = game.lives;
        if(meanErrorDisplay && game.errorScores.length > 0) {
            meanErrorDisplay.textContent = game.runningMeanError.toFixed(3);
        } else if (meanErrorDisplay) {
            meanErrorDisplay.textContent = 'N/A';
        }
    }

    function initializeGame() {
        console.log("Initializing game UI and logic...");
        initializeGameLogic(); // Sets up the 'game' object with initial round

        if(livesCountDisplay) livesCountDisplay.textContent = game.lives;
        if(meanErrorDisplay) meanErrorDisplay.textContent = 'N/A';

        // No need to call setupNewProblem here as initializeGameLogic starts the first round
        setGameState(GAME_STATES.START_SCREEN);
    }

    // Initial setup
    initializeGame();

    // --- Event Listeners ---
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (currentGameState === GAME_STATES.START_SCREEN) {
                console.log("Start Game button clicked");
                // Game logic is already initialized, including first round's dots
                setupNewProblem(); // Render the first problem
                setGameState(GAME_STATES.ACTIVE_GAME);
            }
        });
    }

    function handleSubmitGuess() {
        if (currentGameState !== GAME_STATES.ACTIVE_GAME) return;

        const guessString = guessInput.value.trim();
        if (guessString === '' || isNaN(guessString)) {
            feedbackDisplay.textContent = "Please enter a valid number.";
            feedbackDisplay.className = 'feedback-error';
            guessInput.focus();
            return;
        }
        const guess = parseFloat(guessString);

        if (guess < 0) {
            feedbackDisplay.textContent = "Distance cannot be negative.";
            feedbackDisplay.className = 'feedback-error';
            guessInput.value = '';
            guessInput.focus();
            return;
        }

        console.log(`UI: Guess submitted: ${guess}`);
        const result = game.submitGuess(guess);

        let feedbackMessage = "";
        if (result.correct) {
            let percentageOff = 0;
            if (game.actualDistance !== 0) {
                percentageOff = (result.error / game.actualDistance) * 100;
            }
            feedbackMessage = `Correct! Your guess ${guess.toFixed(3)} was ${percentageOff.toFixed(1)}% off the actual distance ${game.actualDistance.toFixed(3)}.`;
            feedbackDisplay.className = 'feedback-correct';
        } else {
            feedbackMessage = `Incorrect. Your guess was ${guess.toFixed(3)}. Actual distance: ${game.actualDistance.toFixed(3)}.`;
            if (guess > game.actualDistance) {
                feedbackMessage += " You guessed too high.";
            } else {
                feedbackMessage += " You guessed too low.";
            }
            feedbackDisplay.className = 'feedback-incorrect';
        }
        feedbackMessage += ` (Error: ${result.error.toFixed(3)})`;
        feedbackDisplay.textContent = feedbackMessage;

        // Show the actual distance line
        showActualDistance();

        if(livesCountDisplay) livesCountDisplay.textContent = game.lives;
        if(meanErrorDisplay && game.errorScores.length > 0) {
            meanErrorDisplay.textContent = game.runningMeanError.toFixed(3);
        }

        if (result.gameOver) {
            setGameState(GAME_STATES.GAME_OVER);
        } else {
            setGameState(GAME_STATES.SHOWING_FEEDBACK);
        }
    }

    if (submitButton) {
        submitButton.addEventListener('click', handleSubmitGuess);
    }

    // Add Enter key listener for guess input
    if (guessInput) {
        guessInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' || event.keyCode === 13) { // 'Enter' or keyCode 13
                event.preventDefault(); // Prevent default form submission if it's in a form
                if (currentGameState === GAME_STATES.ACTIVE_GAME) {
                    handleSubmitGuess();
                } else if (currentGameState === GAME_STATES.SHOWING_FEEDBACK) {
                    // If feedback is showing, Enter could also trigger "Next"
                     if(nextButton && nextButton.style.display !== 'none') {
                        nextButton.click();
                    }
                }
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentGameState === GAME_STATES.SHOWING_FEEDBACK) {
                if (game.isGameOver()) { // Should already be handled by submit, but double check
                    setGameState(GAME_STATES.GAME_OVER);
                } else {
                    game.nextRound(); // Advances game logic to new round
                    setupNewProblem(); // Updates UI with new dots from game logic
                    setGameState(GAME_STATES.ACTIVE_GAME);
                }
            }
        });
    }

    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => {
            // Allow restart from GAME_OVER or even if player clicks it while feedback is shown (e.g. if they want to quit early)
            if (currentGameState === GAME_STATES.GAME_OVER || currentGameState === GAME_STATES.SHOWING_FEEDBACK) {
                console.log("Restart Game button clicked - direct to active game");
                initializeGameLogic(); // Resets game data and starts a new round internally
                setupNewProblem();     // Renders the new problem (dots, reset UI stats)
                setGameState(GAME_STATES.ACTIVE_GAME); // Switch to active game view
            }
        });
    }

    // // Example: Force Game Over state for testing (remove in production)
    // setTimeout(() => {
    //     console.log("Forcing GAME_OVER state for testing UI.");
    //     setGameState(GAME_STATES.GAME_OVER);
    // }, 5000); // After 5 seconds

    // Game class equivalent in JavaScript
    function initializeGameLogic() {
        game.lives = INITIAL_LIVES;
        game.maxLives = MAX_LIVES;
        game.currentDot1 = null;
        game.currentDot2 = null;
        game.actualDistance = null;
        game.errorScores = [];
        game.runningMeanError = 0.0;
        game.currentRoundNumber = 0;
        // game.correctGuessesInARow = 0; // If needed for bonus lives

        game.startNewRound = function() {
            this.currentDot1 = generateDot();
            this.currentDot2 = generateDot();
            while (calculateDistance(this.currentDot1, this.currentDot2) === 0) { // Ensure distinct dots
                this.currentDot2 = generateDot();
            }
            this.actualDistance = calculateDistance(this.currentDot1, this.currentDot2);
            this.currentRoundNumber++;
            console.log(`JS Game Logic: New round ${this.currentRoundNumber}. Actual dist: ${this.actualDistance.toFixed(3)}`);
        };

        game.submitGuess = function(guessedDistance) {
            if (this.actualDistance === null) {
                console.error("JS Game Logic: No active round to submit guess.");
                return { correct: false, error: 0, gameOver: this.isGameOver() };
            }
            if (guessedDistance < 0) {
                 console.error("JS Game Logic: Guess cannot be negative.");
                 // UI should handle this error message
                 return { correct: false, error: 0, needsValidInput: true, gameOver: this.isGameOver()};
            }

            const correct = isGuessCorrectJS(this.actualDistance, guessedDistance, CORRECT_ENOUGH_PERCENTAGE);
            const error = Math.abs(this.actualDistance - guessedDistance);
            this.errorScores.push(error);
            this.runningMeanError = this.errorScores.reduce((a, b) => a + b, 0) / this.errorScores.length;

            if (correct) {
                if (this.lives < this.maxLives) {
                    this.lives++;
                }
            } else {
                this.lives--;
            }
            console.log(`JS Game Logic: Guess submitted. Correct: ${correct}. Lives: ${this.lives}. Mean Error: ${this.runningMeanError.toFixed(3)}`);
            return { correct, error, gameOver: this.isGameOver() };
        };

        game.isGameOver = function() {
            return this.lives <= 0;
        };

        game.nextRound = function() { // Renamed from Python's next_round for JS convention
            if (!this.isGameOver()) {
                this.startNewRound();
            }
        };

        // Initialize the first round
        game.startNewRound();
    }

    // Phase 4: Comparison logic helper function
    function isGuessCorrectJS(actualDistance, guessedDistance, tolerancePercentage) {
        if (actualDistance < 0 || guessedDistance < 0) {
            // This case should ideally be caught by input validation earlier
            console.error("Distances cannot be negative for comparison.");
            return false;
        }
        if (actualDistance === 0) {
            return guessedDistance === 0;
        }
        const errorMargin = actualDistance * tolerancePercentage;
        const lowerBound = actualDistance - errorMargin;
        const upperBound = actualDistance + errorMargin;
        return guessedDistance >= lowerBound && guessedDistance <= upperBound;
    }

});
