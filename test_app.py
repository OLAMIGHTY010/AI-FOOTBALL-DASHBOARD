import sys
from unittest.mock import MagicMock

# Mock Streamlit to avoid running the app when importing functions
mock_st = MagicMock()
mock_st.sidebar.selectbox.return_value = "Arsenal"
sys.modules['streamlit'] = mock_st
sys.modules['streamlit.components.v1'] = MagicMock()

import pandas as pd
import pytest
from app import optimize_fpl_squad, split_fpl_squad

@pytest.fixture
def sample_fpl_data():
    players = []
    players.append({'id': 1, 'name': 'Alisson', 'team_id': 1, 'pos_id': 1, 'price': 5.5, 'ep_next': 5.0, 'team': 'LIV', 'position': 'Goalkeeper'})
    players.append({'id': 2, 'name': 'Turner', 'team_id': 2, 'pos_id': 1, 'price': 4.0, 'ep_next': 1.0, 'team': 'NFO', 'position': 'Goalkeeper'})
    for i in range(3, 9):
        players.append({'id': i, 'name': f'Def_{i}', 'team_id': i%20, 'pos_id': 2, 'price': 4.5, 'ep_next': 4.0, 'team': 'UNK', 'position': 'Defender'})
    for i in range(9, 15):
        players.append({'id': i, 'name': f'Mid_{i}', 'team_id': i%20, 'pos_id': 3, 'price': 6.0, 'ep_next': 6.0, 'team': 'UNK', 'position': 'Midfielder'})
    for i in range(15, 19):
        players.append({'id': i, 'name': f'Fwd_{i}', 'team_id': i%20, 'pos_id': 4, 'price': 7.0, 'ep_next': 5.0, 'team': 'UNK', 'position': 'Attacker'})
    return pd.DataFrame(players)

def test_optimize_fpl_squad(sample_fpl_data):
    squad = optimize_fpl_squad(sample_fpl_data, budget=100.0)
    assert not squad.empty, "Squad should not be empty"
    assert len(squad) == 15, f"Expected 15 players, got {len(squad)}"

def test_split_fpl_squad(sample_fpl_data):
    squad = optimize_fpl_squad(sample_fpl_data, budget=100.0)
    starters, bench = split_fpl_squad(squad, formation="3-4-3")
    assert len(starters) == 11, "Expected 11 starters"
    assert len(bench) == 4, "Expected 4 bench players"
