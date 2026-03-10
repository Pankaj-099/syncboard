
import pytest
from fastapi.testclient import TestClient


def create_sample_task(client: TestClient, **overrides) -> dict:
    payload = {
        "title": "Test Task",
        "description": "A test task",
        "status": "pending",
        "priority": "medium",
        **overrides,
    }
    resp = client.post("/api/tasks", json=payload)
    assert resp.status_code == 201
    return resp.json()


# CREATE
class TestCreateTask:
    def test_create_basic_task(self, client):
        resp = client.post("/api/tasks", json={"title": "My Task"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "My Task"
        assert data["status"] == "pending"
        assert data["priority"] == "medium"
        assert "id" in data
        assert "created_at" in data

    def test_create_task_with_all_fields(self, client):
        payload = {
            "title": "Full Task",
            "description": "Full description",
            "status": "started",
            "priority": "high",
            "assigned_to": "user_abc",
            "assigned_to_name": "Alice",
            "due_date": "2030-12-31",
        }
        resp = client.post("/api/tasks", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["priority"] == "high"
        assert data["assigned_to"] == "user_abc"
        assert data["due_date"] == "2030-12-31"

    def test_create_task_missing_title_fails(self, client):
        resp = client.post("/api/tasks", json={"description": "no title"})
        assert resp.status_code == 422

    def test_create_task_invalid_status_fails(self, client):
        resp = client.post("/api/tasks", json={"title": "X", "status": "flying"})
        assert resp.status_code == 422

    def test_viewer_cannot_create_task(self, viewer_client):
        resp = viewer_client.post("/api/tasks", json={"title": "X"})
        assert resp.status_code == 403


# READ
class TestListTasks:
    def test_list_empty(self, client):
        resp = client.get("/api/tasks")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_created_tasks(self, client):
        create_sample_task(client, title="Task A")
        create_sample_task(client, title="Task B")
        resp = client.get("/api/tasks")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_filter_by_status(self, client):
        create_sample_task(client, status="pending")
        create_sample_task(client, status="completed")
        resp = client.get("/api/tasks?status=pending")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["status"] == "pending"

    def test_filter_by_priority(self, client):
        create_sample_task(client, priority="high")
        create_sample_task(client, priority="low")
        resp = client.get("/api/tasks?priority=high")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["priority"] == "high"

    def test_pagination(self, client):
        for i in range(5):
            create_sample_task(client, title=f"Task {i}")
        resp = client.get("/api/tasks?page=1&limit=2")
        assert len(resp.json()) == 2

    def test_viewer_can_list(self, viewer_client):
        resp = viewer_client.get("/api/tasks")
        assert resp.status_code == 200


class TestGetTask:
    def test_get_existing_task(self, client):
        task = create_sample_task(client)
        resp = client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == task["id"]

    def test_get_nonexistent_returns_404(self, client):
        resp = client.get("/api/tasks/nonexistent-id")
        assert resp.status_code == 404


# UPDATE
class TestUpdateTask:
    def test_update_title(self, client):
        task = create_sample_task(client, title="Old Title")
        resp = client.put(f"/api/tasks/{task['id']}", json={"title": "New Title"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    def test_update_status(self, client):
        task = create_sample_task(client, status="pending")
        resp = client.put(f"/api/tasks/{task['id']}", json={"status": "completed"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_update_priority(self, client):
        task = create_sample_task(client, priority="low")
        resp = client.put(f"/api/tasks/{task['id']}", json={"priority": "high"})
        assert resp.status_code == 200
        assert resp.json()["priority"] == "high"

    def test_update_nonexistent_returns_404(self, client):
        resp = client.put("/api/tasks/bad-id", json={"title": "X"})
        assert resp.status_code == 404

    def test_viewer_cannot_update(self, viewer_client):
        resp = viewer_client.put("/api/tasks/some-task-id", json={"title": "X"})
        assert resp.status_code == 403


# DELETE
class TestDeleteTask:
    def test_delete_task(self, client):
        task = create_sample_task(client)
        resp = client.delete(f"/api/tasks/{task['id']}")
        assert resp.status_code == 204
        # Confirm gone
        assert client.get(f"/api/tasks/{task['id']}").status_code == 404

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/api/tasks/bad-id")
        assert resp.status_code == 404

    def test_viewer_cannot_delete(self, viewer_client):
        resp = viewer_client.delete("/api/tasks/some-task-id")
        assert resp.status_code == 403
