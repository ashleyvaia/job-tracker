import pytest
from app.main import app
from app.auth import get_current_user
from datetime import date, timedelta


def test_list_applications_requires_auth(client):
    response = client.get("/applications/")
    assert response.status_code == 401


def test_list_applications_rejects_bad_token(client):
    response = client.get(
        "/applications/", headers={"Authorization": "Bearer not_a_real_token"}
    )
    assert response.status_code == 401


def test_per_user_data_isolation(authed_client):
    response = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "https://www.google.com/",
            "date_applied": "2026-09-28",
            "notes": None,
        },
    )

    assert response.status_code == 200

    app_id_1 = response.json()["id"]

    app.dependency_overrides[get_current_user] = lambda: "test_user_2"

    response_2 = authed_client.get(f"/applications/{app_id_1}")

    assert response_2.status_code == 404


def test_streak_two_consecutive_days(authed_client):
    response_1 = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "https://www.google.com/",
            "date_applied": str(date.today()),
            "notes": None,
        },
    )

    assert response_1.status_code == 200

    response_2 = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "https://www.google.com/",
            "date_applied": str(date.today() - timedelta(days=1)),
            "notes": None,
        },
    )

    assert response_2.status_code == 200

    response_3 = authed_client.get("/dashboard/")
    assert response_3.json()["current_streak"] == 2

def test_streak_gap_breaks_streak(authed_client):
    response_1 = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "https://www.google.com/",
            "date_applied": str(date.today()),
            "notes": None,
        },
    )

    assert response_1.status_code == 200

    response_2 = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "https://www.google.com/",
            "date_applied": str(date.today() - timedelta(days=3)),
            "notes": None,
        },
    )

    assert response_2.status_code == 200

    response_3 = authed_client.get("/dashboard/")
    assert response_3.json()["current_streak"] == 1


def test_create_application_rejects_url_without_protocol(authed_client):
    response = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "apple.com",
            "date_applied": str(date.today()),
            "notes": None,
        },
    )
    assert response.status_code == 422


def test_partial_application_update(authed_client):
    response_1 = authed_client.post(
        "/applications/",
        json={
            "company": "FooInc",
            "role": "BarEngineer",
            "location": "Baz, USA",
            "url": "https://www.apple.com",
            "date_applied": str(date.today()),
            "notes": None,
        },
    )

    assert response_1.status_code == 200

    res_1_id = response_1.json()["id"]
    res_1_company = response_1.json()["company"]

    response_2 = authed_client.patch(
        f"/applications/{res_1_id}", json={"status": "interviewing"}
    )

    assert response_2.status_code == 200

    assert (
        response_2.json()["status"] == "interviewing"
        and response_2.json()["company"] == res_1_company
    )

