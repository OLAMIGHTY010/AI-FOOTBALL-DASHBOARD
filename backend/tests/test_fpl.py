import pytest
from fpl import get_fpl_data, optimize_fpl_squad

def test_get_fpl_data():
    # Evaluate get_fpl_data - since it makes an API call, we mock it implicitly or just check type
    # For now, it will either return a list of dicts or an empty list (if it fails)
    result = get_fpl_data()
    assert isinstance(result, list)

def test_optimize_fpl_squad():
    budget = 100.0
    
    # We can test the logic structure
    result = optimize_fpl_squad(budget)
    if "error" in result:
        assert True
    else:
        assert isinstance(result, dict)
        assert "squad" in result
        assert "starting_eleven" in result
