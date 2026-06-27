import os
import sys
import random

# Tell the environment where to find the 'cg' module
starter_kit_path = "/kaggle/input/competitions/pokemon-tcg-ai-battle/sample_submission/sample_submission"
if starter_kit_path not in sys.path:
    sys.path.append(starter_kit_path)

from cg.api import Observation, to_observation_class

def read_deck_csv() -> list[int]:
    file_path = "deck.csv"
    # Fallback paths for local testing vs actual competition evaluation
    if not os.path.exists(file_path):
        file_path = "/kaggle_simulations/agent/" + file_path
    if not os.path.exists(file_path):
        file_path = os.path.join(starter_kit_path, "deck.csv")
        
    with open(file_path, "r") as file:
        csv = file.read().split("\n")
    deck = []
    for i in range(60):
        if csv[i]:
            deck.append(int(csv[i]))
    return deck

def agent(obs_dict: dict) -> list[int]:
    obs: Observation = to_observation_class(obs_dict)
    
    # Handle initial deck submission phase
    if obs.select == None:
        return read_deck_csv()
    
    options = obs.select.option
    
    # Priority Rule: Attack!
    for index, option in enumerate(options):
        if "attack" in str(option).lower(): 
            return [index]
            
    # Fallback selection matching the environment's maxCount criteria
    return random.sample(list(range(len(options))), obs.select.maxCount)
