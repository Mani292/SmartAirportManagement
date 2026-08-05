import pytest
from unittest.mock import patch, AsyncMock
import servicenow

@pytest.mark.asyncio
@patch("servicenow._request", new_callable=AsyncMock)
async def test_get_asset_health_metrics(mock_request):
    mock_request.return_value = {"result": [{"health": "good"}]}

    asset_id = "asset123"
    result = await servicenow.get_asset_health_metrics(asset_id)

    assert result == {"result": [{"health": "good"}]}

    mock_request.assert_called_once_with(
        "GET",
        f"{servicenow.INSTANCE}/api/now/table/u_iot_telemetry",
        params={
            "sysparm_query": f"u_asset={asset_id}^ORDERBYDESCsys_created_on",
            "sysparm_limit": 10
        }
    )

@pytest.mark.asyncio
@patch("servicenow._request", new_callable=AsyncMock)
async def test_get_asset_health_metrics_error(mock_request):
    mock_request.return_value = {"error": "http_error", "detail": "404 Not Found"}

    asset_id = "asset123"
    result = await servicenow.get_asset_health_metrics(asset_id)

    assert result == {"error": "http_error", "detail": "404 Not Found"}
