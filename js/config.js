export const GAME_STATES = {
    START_SCREEN: 'START_SCREEN',
    ACTIVE_GAME: 'ACTIVE_GAME',
    SHOWING_FEEDBACK: 'SHOWING_FEEDBACK',
    GAME_OVER: 'GAME_OVER'
};

export const COORDINATE_SYSTEM_MAX = 1.0;
// MAX_POSSIBLE_DISTANCE depends on COORDINATE_SYSTEM_MAX, so we calculate it here.
export const MAX_POSSIBLE_DISTANCE = Math.sqrt(2 * Math.pow(COORDINATE_SYSTEM_MAX, 2));
export const CORRECT_ENOUGH_PERCENTAGE = 0.15;
export const INITIAL_LIVES = 3;
export const MAX_LIVES = 5;
export const DOT_SPAWN_MARGIN = 0.05;

// New: Game Mode Definitions
export const GAME_MODES = {
    CLASSIC: 'CLASSIC',
    TIME_TRIAL: 'TIME_TRIAL'
};

// New: Settings for each game mode
export const GAME_MODE_SETTINGS = {
    [GAME_MODES.CLASSIC]: {
        initialLives: INITIAL_LIVES,
        hasTimer: false,
        timerDuration: null,
        // Scoring parameters for Weber's Law based scoring if we apply it to Classic too
        // For now, classic uses the old isGuessCorrect logic
        scoringParams: { A: 0.015, B: 0.10, usesWeberScoring: false } // Defaulting to not use it for classic yet
    },
    [GAME_MODES.TIME_TRIAL]: {
        initialLives: 0, // No lives in Time Trial
        hasTimer: true,
        // timerDuration: 60, // Old fixed duration
        availableDurations: [15, 30], // New: available durations in seconds
        defaultDuration: 15,         // New: default duration in seconds
        scoringParams: { A: 0.015, B: 0.10, usesWeberScoring: true }
    }
};

// Default game mode if none is selected (e.g., first load)
export const DEFAULT_GAME_MODE = GAME_MODES.CLASSIC;
