import os
import random
from cg.api import Observation, to_observation_class

def read_deck_csv() -> list[int]:
    """Read deck.csv with robust fallback paths for local testing vs environment execution.
    
    Returns:
        list[int]: A list of 60 card IDs in the deck.
    """
    file_path = "deck.csv"
    # Fallback paths if running from a different directory structure locally
    if not os.path.exists(file_path):
        file_path = "/kaggle_simulations/agent/" + file_path
    if not os.path.exists(file_path):
        # Check backend or local subfolders if applicable
        if os.path.exists("backend/deck.csv"):
            file_path = "backend/deck.csv"

    with open(file_path, "r") as file:
        csv = file.read().split("\n")
        
    deck = []
    for i in range(min(60, len(csv))):
        if csv[i].strip():
            deck.append(int(csv[i].strip()))
    return deck

def agent(obs_dict: dict) -> list[int]:
    """Implement Your Pokémon Trading Card Game Agent.
    
    Combines safe input parsing, deck loading, and attack-prioritization heuristics.
    """
    obs: Observation = to_observation_class(obs_dict)
    
    # Handle initial deck submission phase
    if obs.select is None:
        return read_deck_csv()
    
    options = obs.select.option
    
    # Priority Rule (from your old code): Attack if an attack option is available!
    for index, option in enumerate(options):
        if "attack" in str(option).lower():
            return [index]
            
    # Fallback selection: safe random sampling respecting min/max count constraints
    min_count = getattr(obs.select, 'minCount', 1)
    max_count = getattr(obs.select, 'maxCount', len(options))
    sample_size = max(min_count, min(max_count, len(options)))
    
    return random.sample(list(range(len(options))), sample_size)