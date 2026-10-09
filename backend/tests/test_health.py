import sys
import os
from fastapi.testclient import TestClient

# Ensure project root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    """
    Test GET /health returns HTTP 200, status ok, and correct service name.
    """
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "eagle-eye-backend"
    assert "version" in data
    assert "environment" in data
