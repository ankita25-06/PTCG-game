import os
import random
from cg.api import Observation, to_observation_class

def read_deck_csv() -> list[int]:
    """Read deck.csv with robust fallback paths for local testing vs environment execution."""
    file_path = "deck.csv"
    if not os.path.exists(file_path):
        file_path = "/kaggle_simulations/agent/" + file_path
    if not os.path.exists(file_path):
        if os.path.exists("backend/deck.csv"):
            file_path = "backend/deck.csv"

    with open(file_path, "r") as file:
        csv = file.read().split("\n")
        
    deck = []
    for i in range(min(60, len(csv))):
        if csv[i].strip():
            deck.append(int(csv[i].strip()))
    return deck

def get_action_aggressive(options) -> list[int]:
    """Prioritize high-damage or rapid offensive options."""
    for index, option in enumerate(options):
        opt_str = str(option).lower()
        if "attack" in opt_str or "damage" in opt_str:
            return [index]
    return []

def get_action_defensive(options) -> list[int]:
    """Prioritize bench setup, energy conservation, or stalling actions."""
    for index, option in enumerate(options):
        opt_str = str(option).lower()
        if "bench" in opt_str or "heal" in opt_str or "energy" in opt_str:
            return [index]
    return []

def agent(obs_dict: dict) -> list[int]:
    """Main agent function with dynamic strategy evaluation."""
    obs: Observation = to_observation_class(obs_dict)
    
    # Handle initial deck submission phase
    if obs.select is None:
        return read_deck_csv()
    
    options = obs.select.option
    
    # Read strategy configuration from environment or default to balanced
    strategy = os.getenv("AI_STRATEGY", "balanced").lower()
    
    selected_indices = []
    if strategy == "aggressive":
        selected_indices = get_action_aggressive(options)
    elif strategy == "defensive":
        selected_indices = get_action_defensive(options)
        
    # Fallback to standard attack prioritization if strategy yields no specific action
    if not selected_indices:
        for index, option in enumerate(options):
            if "attack" in str(option).lower():
                selected_indices = [index]
                break
                
    # Final fallback: safe random sampling respecting count constraints
    if not selected_indices:
        min_count = getattr(obs.select, 'minCount', 1)
        max_count = getattr(obs.select, 'maxCount', len(options))
        sample_size = max(min_count, min(max_count, len(options)))
        selected_indices = random.sample(list(range(len(options))), sample_size)
        
    return selected_indices