"""
Pytest configuration file for test discovery and fixtures.
"""

import sys
from pathlib import Path
from unittest.mock import Mock, patch
import pytest

# Add the parent directory to the Python path so tests can import from src
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))


# Mock tiktoken to avoid network calls during tests
@pytest.fixture(scope="session", autouse=True)
def mock_tiktoken():
    """Mock tiktoken globally to avoid network calls."""
    with patch('tiktoken.encoding_for_model') as mock_encoding_for_model, \
         patch('tiktoken.get_encoding') as mock_get_encoding:

        # Create a mock encoding
        mock_enc = Mock()
        # More accurate mock: empty string = 0 tokens, otherwise roughly 1 token per 4 chars
        mock_enc.encode = lambda text: [] if not text else [0] * max(1, len(text) // 4)

        mock_encoding_for_model.return_value = mock_enc
        mock_get_encoding.return_value = mock_enc

        yield
