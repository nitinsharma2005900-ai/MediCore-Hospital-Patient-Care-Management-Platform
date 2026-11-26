import pytest
import httpx

@pytest.fixture(autouse=True)
def authorized_backend(monkeypatch, request):
    """The existing endpoint success tests now authenticate and use an explicit service fixture.
    Security/failure tests exercise the real dependency instead of this transport fixture.
    """
    if request.module.__name__.split('.')[-1] != 'test_analytics_endpoints':
        yield
        return
    import test_analytics_endpoints as suite
    snapshot = {
        'appointments': [{'status': 'COMPLETED', 'department_name': 'Cardiology'}],
        'encounters': [{'checkedInAt': '2026-11-26T09:00:00Z', 'startTime': '2026-11-26T09:12:00Z'}],
        'labOrders': [{'status': 'COMPLETED', 'priority': 'ROUTINE', 'orderDate': '2026-11-26T09:00:00Z', 'updatedAt': '2026-11-26T11:00:00Z'}],
        'patients': [{'dateOfBirth': '1990-01-01', 'gender': 'FEMALE', 'bloodGroup': 'O+'}],
        'departments': [{'name': 'Cardiology', 'activeDoctors': 1}]
    }
    class BackendClient:
        def __init__(self, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def get(self, url, headers):
            assert headers['Authorization'] == 'Bearer authorized-synthetic-admin'
            return httpx.Response(200, json={'success': True, 'data': snapshot}, request=httpx.Request('GET', url))
    monkeypatch.setattr('routers.analytics.httpx.AsyncClient', BackendClient)
    suite.client.headers['Authorization'] = 'Bearer authorized-synthetic-admin'
    yield
    suite.client.headers.pop('Authorization', None)
