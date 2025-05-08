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
        dotElement.classList.add('dot-appear'); // Added for animation
        dotElement.id = id;
        dotElement.style.backgroundColor = color;
        // Convert 0-1 coordinates to percentage for CSS positioning
        dotElement.style.left = `${x * 100}%`;
        dotElement.style.top = `${y * 100}%`;
        coordinatePlane.appendChild(dotElement);
        return dotElement;
    }

    function clearProblemElements() { // Renamed from clearDots
        const existingDots = coordinatePlane.querySelectorAll('.dot');
        existingDots.forEach(dot => dot.remove());
        const existingLine = coordinatePlane.querySelector('.distance-line');
        if (existingLine) {
            existingLine.remove();
        }
    }

    function renderDistanceLine(p1, p2, isCorrectGuess) {
        const lineElement = document.createElement('div');
        lineElement.classList.add('distance-line');

        const deltaX = p2.x - p1.x;
        const deltaY = p2.y - p1.y;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 100; // Percentage of plane width/height
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Angle in degrees

        // Assuming coordinatePlane is square for simplicity in scaling length.
        // The actual distance is in 0-1 units, so length * 100 gives percentage of plane size.
        // For positioning, use the midpoint and CSS transforms.
        const midX = (p1.x + p2.x) / 2 * 100; // Midpoint X in percentage
        const midY = (p1.y + p2.y) / 2 * 100; // Midpoint Y in percentage

        lineElement.style.width = `${length}%`;
        lineElement.style.position = 'absolute'; // Position relative to coordinatePlane
        // Adjust left/top to be the start of the line, then transform origin for rotation
        lineElement.style.left = `${p1.x * 100}%`;
        lineElement.style.top = `${p1.y * 100}%`;
        lineElement.style.transformOrigin = '0 50%'; // Rotate around the starting point (left-center)
        lineElement.style.transform = `translateY(-50%) rotate(${angle}deg)`; // Center line vertically then rotate


        // Style based on correctness
        if (isCorrectGuess) {
            lineElement.style.backgroundColor = 'rgba(76, 175, 80, 0.7)'; // Greenish for correct
            lineElement.classList.add('line-correct-animation');
        } else {
            lineElement.style.backgroundColor = 'rgba(255, 152, 0, 0.7)'; // Orangeish for incorrect
             lineElement.classList.add('line-incorrect-animation');
        }
        lineElement.style.height = '3px'; // Line thickness


        coordinatePlane.appendChild(lineElement);
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
        // Clear distance line when not showing feedback or when starting a new game active state
        if (newState !== GAME_STATES.SHOWING_FEEDBACK && coordinatePlane.querySelector('.distance-line')) {
             const existingLine = coordinatePlane.querySelector('.distance-line');
             if (existingLine) existingLine.remove();
        }
        updateUIForState();
    }

    function setupNewProblem() {
        clearProblemElements(); // Use renamed function
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
        // Ensure no old lines persist if game is re-initialized mid-state
        const existingLine = coordinatePlane.querySelector('.distance-line');
        if (existingLine) {
            existingLine.remove();
        }

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
            feedbackDisplay.style.color = ''; // Reset color to be sure CSS class takes over
            guessInput.focus();
            return;
        }
        const guess = parseFloat(guessString);

        if (guess < 0) {
            feedbackDisplay.textContent = "Distance cannot be negative.";
            feedbackDisplay.className = 'feedback-error';
            feedbackDisplay.style.color = ''; // Reset color to be sure CSS class takes over
            guessInput.value = '';
            guessInput.focus();
            return;
        }
        // MAX_POSSIBLE_DISTANCE check can remain or be adjusted
        // const submissionResult = game.submitGuess(guess); // Call new game logic
        // if (submissionResult.needsValidInput) { // Example of handling specific error from game.submitGuess
        //     feedbackDisplay.textContent = "Guessed distance cannot be negative (from game logic).";
        //     feedbackDisplay.className = 'feedback-error';
        //     guessInput.value = '';
        //     guessInput.focus();
        //     return;
        // }

        console.log(`UI: Guess submitted: ${guess}`);
        const result = game.submitGuess(guess); // Use the JS game object

        let feedbackMessage = "";
        if (result.correct) {
            let percentageOff = 0;
            if (game.actualDistance !== 0) { // Avoid division by zero if actual distance is 0
                percentageOff = (result.error / game.actualDistance) * 100;
            }
            // If actualDistance is 0 and guess is correct, error is 0, so percentageOff remains 0.
            feedbackMessage = `Correct! Your guess ${guess.toFixed(3)} was ${percentageOff.toFixed(1)}% off the actual distance ${game.actualDistance.toFixed(3)}.`;
            feedbackDisplay.className = 'feedback-correct';
            feedbackDisplay.style.color = ''; // Reset color
        } else {
            feedbackMessage = `Incorrect. Your guess was ${guess.toFixed(3)}. Actual distance: ${game.actualDistance.toFixed(3)}.`;
            if (guess > game.actualDistance) {
                feedbackMessage += " You guessed too high.";
            } else {
                feedbackMessage += " You guessed too low.";
            }
            feedbackDisplay.className = 'feedback-incorrect';
            feedbackDisplay.style.color = ''; // Reset color
        }
        feedbackMessage += ` (Error: ${result.error.toFixed(3)})`;
        feedbackDisplay.textContent = feedbackMessage;

        if(livesCountDisplay) livesCountDisplay.textContent = game.lives;
        if(meanErrorDisplay && game.errorScores.length > 0) {
            meanErrorDisplay.textContent = game.runningMeanError.toFixed(3);
        }

        if (result.gameOver) {
            setGameState(GAME_STATES.GAME_OVER);
        } else {
            setGameState(GAME_STATES.SHOWING_FEEDBACK);
            // Render the distance line after feedback is set
            renderDistanceLine(game.currentDot1, game.currentDot2, result.correct);
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
                    // Clear the old line before setting up a new problem
                    const existingLine = coordinatePlane.querySelector('.distance-line');
                    if (existingLine) {
                        existingLine.remove();
                    }
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
                // Clear the old line if restarting from feedback state
                const existingLine = coordinatePlane.querySelector('.distance-line');
                if (existingLine) {
                    existingLine.remove();
                }
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
