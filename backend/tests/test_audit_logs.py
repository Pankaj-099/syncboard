"""Tests for /api/audit-logs endpoint."""


def create_task(client, title="Test Task"):
    r = client.post("/api/tasks", json={"title": title})
    assert r.status_code == 201
    return r.json()


class TestAuditLogs:
    def test_empty_audit_log(self, client):
        resp = client.get("/api/audit-logs")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_create_generates_audit_log(self, client):
        create_task(client, title="Audited Task")
        resp = client.get("/api/audit-logs")
        items = resp.json()["items"]
        assert len(items) == 1
        assert items[0]["action"] == "task.created"
        assert items[0]["entity_title"] == "Audited Task"

    def test_update_generates_audit_log(self, client):
        task = create_task(client)
        client.put(f"/api/tasks/{task['id']}", json={"title": "Updated"})
        resp = client.get("/api/audit-logs")
        actions = [i["action"] for i in resp.json()["items"]]
        assert "task.updated" in actions

    def test_delete_generates_audit_log(self, client):
        task = create_task(client)
        client.delete(f"/api/tasks/{task['id']}")
        resp = client.get("/api/audit-logs")
        actions = [i["action"] for i in resp.json()["items"]]
        assert "task.deleted" in actions

    def test_audit_log_pagination(self, client):
        for i in range(5):
            create_task(client, title=f"Task {i}")
        resp = client.get("/api/audit-logs?page=1&limit=3")
        data = resp.json()
        assert len(data["items"]) == 3
        assert data["total"] == 5

    def test_viewer_can_read_audit_logs(self, viewer_client):
        resp = viewer_client.get("/api/audit-logs")
        assert resp.status_code == 200
