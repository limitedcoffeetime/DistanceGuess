import random
import math

# Phase 1: Core Game Logic Foundation

# Define the coordinate system (0,0 to 1,1)
COORDINATE_SYSTEM_MIN = 0.0
COORDINATE_SYSTEM_MAX = 1.0

class Dot:
    def __init__(self, x: float, y: float):
        if not (COORDINATE_SYSTEM_MIN <= x <= COORDINATE_SYSTEM_MAX and
                COORDINATE_SYSTEM_MIN <= y <= COORDINATE_SYSTEM_MAX):
            raise ValueError(f"Coordinates ({x}, {y}) must be within the defined system [{COORDINATE_SYSTEM_MIN}, {COORDINATE_SYSTEM_MAX}]")
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Dot({self.x:.4f}, {self.y:.4f})"

def generate_dot() -> Dot:
    """
    Generates a single dot with uniformly random coordinates within the defined system.
    """
    x = random.uniform(COORDINATE_SYSTEM_MIN, COORDINATE_SYSTEM_MAX)
    y = random.uniform(COORDINATE_SYSTEM_MIN, COORDINATE_SYSTEM_MAX)
    return Dot(x, y)

def generate_two_dots() -> tuple[Dot, Dot]:
    """
    Generates two distinct dots.
    Ensures the two dots are not in the exact same location.
    """
    dot1 = generate_dot()
    dot2 = generate_dot()
    while dot1.x == dot2.x and dot1.y == dot2.y: # Ensure dots are not identical
        dot2 = generate_dot()
    return dot1, dot2

def calculate_euclidean_distance(dot1: Dot, dot2: Dot) -> float:
    """
    Calculates the Euclidean distance between two dots.
    Distance = sqrt((x2 - x1)^2 + (y2 - y1)^2)
    """
    return math.sqrt((dot2.x - dot1.x)**2 + (dot2.y - dot1.y)**2)

# Define "correct enough" range for distance guesses
# This can be a percentage of the actual distance or a fixed epsilon.
# For now, let's define it as a percentage of the actual distance.
# Example: If actual distance is 0.5, and CORRECT_ENOUGH_PERCENTAGE is 0.1 (10%),
# then guesses between 0.45 and 0.55 are considered correct.
CORRECT_ENOUGH_PERCENTAGE = 0.15 # 15% tolerance
# Maximum lives a player can have
MAX_LIVES = 5

def is_guess_correct(actual_distance: float, guessed_distance: float, tolerance_percentage: float = CORRECT_ENOUGH_PERCENTAGE) -> bool:
    """
    Determines if the guessed distance is "correct enough" compared to the actual distance.
    """
    if actual_distance < 0 or guessed_distance < 0:
        raise ValueError("Distances cannot be negative.")

    # Handle edge case where actual distance is 0 (dots are at the same theoretical point if allowed, though generate_two_dots prevents this)
    if actual_distance == 0:
        return guessed_distance == 0 # Only a guess of 0 is correct if actual is 0

    error_margin = actual_distance * tolerance_percentage
    lower_bound = actual_distance - error_margin
    upper_bound = actual_distance + error_margin
    return lower_bound <= guessed_distance <= upper_bound

# Phase 5: Game Progression System
class Game:
    def __init__(self, initial_lives: int = 3):
        self.lives = initial_lives
        self.max_lives = MAX_LIVES
        self.current_dot1: Dot | None = None
        self.current_dot2: Dot | None = None
        self.actual_distance: float | None = None
        self.error_scores: list[float] = []
        self.running_mean_error: float = 0.0
        self.current_round_number: int = 0
        self.correct_guesses_in_a_row: int = 0 # Optional: for mechanics like bonus life
        self.start_new_round()

    def start_new_round(self):
        """Initializes a new round by generating two new dots and calculating their distance."""
        self.current_dot1, self.current_dot2 = generate_two_dots()
        self.actual_distance = calculate_euclidean_distance(self.current_dot1, self.current_dot2)
        self.current_round_number += 1
        # Reset per-round state if any, e.g., if there was a flag for guess submitted this round

    def submit_guess(self, guessed_distance: float) -> tuple[bool, float]:
        """
        Processes a player's guess.
        Updates lives, error score, and running mean error.
        If game is already over, no state changes occur.
        Returns a tuple: (is_correct, error_amount)
        """
        if self.is_game_over():
            # Game is over, do not process further. Return values indicate no successful guess.
            return False, 0.0 # Error amount of 0.0 as no new error was processed.

        if self.actual_distance is None:
            # This should not happen if a round is active
            raise ValueError("No active round. Call start_new_round() first.")

        if guessed_distance < 0:
            # Optionally handle this as an invalid guess scenario instead of raising ValueError
            raise ValueError("Guessed distance cannot be negative.")

        correct = is_guess_correct(self.actual_distance, guessed_distance, CORRECT_ENOUGH_PERCENTAGE)
        error = abs(self.actual_distance - guessed_distance)
        self.error_scores.append(error)
        self.running_mean_error = sum(self.error_scores) / len(self.error_scores)

        if correct:
            self.correct_guesses_in_a_row +=1
            # Gain a life for a correct guess, up to MAX_LIVES
            if self.lives < self.max_lives:
                self.lives += 1
        else:
            self.correct_guesses_in_a_row = 0
            self.lives -= 1

        return correct, error

    def get_game_state(self) -> dict:
        """Returns the current state of the game (lives, mean error, round number)."""
        return {
            "lives": self.lives,
            "max_lives": self.max_lives,
            "running_mean_error": self.running_mean_error,
            "current_round_number": self.current_round_number,
            "dot1": self.current_dot1,
            "dot2": self.current_dot2,
            "actual_distance": self.actual_distance # For feedback, not for player to see before guessing
        }

    def is_game_over(self) -> bool:
        """Checks if the game is over (lives reached zero)."""
        return self.lives <= 0

    def next_round(self):
        """Advances to the next round if the game is not over."""
        if not self.is_game_over():
            self.start_new_round()
        # Else: could handle game over state transition here or let UI do it based on is_game_over()

# Example Usage for Game class (can be moved to a main script or test file)
if __name__ == '__main__':
    # Example Usage for Phase 1
    print(f"Coordinate System: [{COORDINATE_SYSTEM_MIN}, {COORDINATE_SYSTEM_MAX}]")

    dot_a, dot_b = generate_two_dots()
    print(f"Generated Dot 1: {dot_a}")
    print(f"Generated Dot 2: {dot_b}")

    actual_dist = calculate_euclidean_distance(dot_a, dot_b)
    print(f"Actual Euclidean Distance: {actual_dist:.4f}")

    print(f"\"Correct Enough\" tolerance: {CORRECT_ENOUGH_PERCENTAGE*100}% of actual distance.")

    # Test cases for is_guess_correct
    test_guesses = [
        actual_dist, 								# Perfect guess
        actual_dist * (1 + CORRECT_ENOUGH_PERCENTAGE / 2), 		# Within tolerance (upper)
        actual_dist * (1 - CORRECT_ENOUGH_PERCENTAGE / 2), 		# Within tolerance (lower)
        actual_dist * (1 + CORRECT_ENOUGH_PERCENTAGE), 		# Exactly at upper tolerance boundary
        actual_dist * (1 - CORRECT_ENOUGH_PERCENTAGE), 		# Exactly at lower tolerance boundary
        actual_dist * (1 + CORRECT_ENOUGH_PERCENTAGE * 1.1), 	# Just outside tolerance (upper)
        actual_dist * (1 - CORRECT_ENOUGH_PERCENTAGE * 1.1), 	# Just outside tolerance (lower)
        0.0,
        actual_dist + 0.0000001, # Very close
        actual_dist - 0.0000001  # Very close
    ]

    if actual_dist == 0: # Unlikely with current generation but good to cover
        print("\nTesting with actual_dist = 0:")
        print(f"Guess 0.0: {is_guess_correct(0.0, 0.0)}")
        print(f"Guess 0.0001: {is_guess_correct(0.0, 0.0001)}")
    else:
        print("\nTesting is_guess_correct function:")
        for i, guess in enumerate(test_guesses):
            if guess < 0: continue # Skip invalid test guesses for this scenario
            correct = is_guess_correct(actual_dist, guess)
            print(f"Test Guess {i+1}: {guess:.4f} -> Correct? {correct}")

    # Test with a known small distance
    dot_c = Dot(0.1, 0.1)
    dot_d = Dot(0.10001, 0.10001)
    small_dist = calculate_euclidean_distance(dot_c, dot_d)
    print(f"\nGenerated Dot C: {dot_c}")
    print(f"Generated Dot D: {dot_d}")
    print(f"Small Actual Euclidean Distance: {small_dist:.8f}")
    print(f"Test Guess {small_dist:.8f} (exact): {is_guess_correct(small_dist, small_dist)}")
    print(f"Test Guess {small_dist * 1.05:.8f} (5% off, within 10% tolerance): {is_guess_correct(small_dist, small_dist * 1.05)}")
    print(f"Test Guess {small_dist * 1.15:.8f} (15% off, outside 10% tolerance): {is_guess_correct(small_dist, small_dist * 1.15)}")

    # Test "correct enough" range with fixed epsilon (alternative approach, not currently used by default)
    # FIXED_EPSILON = 0.01
    # def is_guess_correct_epsilon(actual_distance: float, guessed_distance: float, epsilon: float = FIXED_EPSILON) -> bool:
    #     return abs(actual_distance - guessed_distance) <= epsilon
    # print(f"\nTesting with fixed epsilon ({FIXED_EPSILON}):")
    # test_guess_epsilon = actual_dist + FIXED_EPSILON / 2
    # print(f"Guess {test_guess_epsilon:.4f} -> Correct (epsilon)? {is_guess_correct_epsilon(actual_dist, test_guess_epsilon)}")
    # test_guess_epsilon_too_far = actual_dist + FIXED_EPSILON * 1.1
    # print(f"Guess {test_guess_epsilon_too_far:.4f} -> Correct (epsilon)? {is_guess_correct_epsilon(actual_dist, test_guess_epsilon_too_far)}")

    print("\n--- Game Class Example ---")
    game = Game(initial_lives=3)
    print(f"Initial State: Lives={game.lives}, Round={game.current_round_number}")
    print(f"Dot 1: {game.current_dot1}, Dot 2: {game.current_dot2}, Actual Distance: {game.actual_distance:.4f}")

    # Simulate a few rounds
    for i in range(5): # Simulate 5 rounds or until game over
        if game.is_game_over():
            print(f"\nGame Over! Final score (mean error): {game.running_mean_error:.4f}, Rounds played: {game.current_round_number-1}") # -1 because round increments before check
            break

        print(f"\n--- Round {game.current_round_number} ---")
        print(f"Lives: {game.lives}/{game.max_lives}")
        #print(f"Current dots: {game.current_dot1}, {game.current_dot2}") # Already printed at start of game and new round
        print(f"Actual distance (for testing): {game.actual_distance:.4f}")

        # Simulate a guess
        # Alternate between a correct guess (within 5% tolerance) and an incorrect guess (15% off)
        if i % 2 == 0: # Correct guess
            simulated_guess = game.actual_distance * (1 + CORRECT_ENOUGH_PERCENTAGE * 0.5)
        else: # Incorrect guess
            simulated_guess = game.actual_distance * (1 + CORRECT_ENOUGH_PERCENTAGE * 1.5)

        print(f"Simulating guess: {simulated_guess:.4f}")

        try:
            is_correct, error_amount = game.submit_guess(simulated_guess)
            print(f"Guess was correct: {is_correct}, Error: {error_amount:.4f}")
            print(f"Lives after guess: {game.lives}/{game.max_lives}")
            print(f"Running Mean Error: {game.running_mean_error:.4f}")
        except ValueError as e:
            print(f"Error submitting guess: {e}")
            # Potentially handle this by ending the game or skipping the round
            break

        if not game.is_game_over():
            print("Advancing to next round...")
            game.next_round()
            if not game.is_game_over(): # Only print new dot info if game is not over after advancing
                 print(f"New Dot 1: {game.current_dot1}, New Dot 2: {game.current_dot2}, New Actual Distance: {game.actual_distance:.4f}")

    if not game.is_game_over():
        # If loop finished due to completing 5 rounds, not game over
        print(f"\nGame simulation completed 5 rounds. Final Mean Error: {game.running_mean_error:.4f}, Lives: {game.lives}")
