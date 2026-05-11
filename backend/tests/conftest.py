import os
import pytest
from unittest.mock import patch

@pytest.fixture(autouse=True)
def mock_env_vars():
    with patch.dict(os.environ, {"SERVICENOW_INSTANCE": "http://mock-instance.com", "GROQ_API_KEY": "test"}):
        yield
