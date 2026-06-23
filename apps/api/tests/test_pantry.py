def _create_scan(client, headers, tiny_jpeg_bytes):
    res = client.post(
        "/scans", headers=headers, files={"image": ("photo.jpg", tiny_jpeg_bytes, "image/jpeg")}
    )
    assert res.status_code == 200
    return res.json()


def test_add_list_and_resolve_pantry_item(client, auth_headers, tiny_jpeg_bytes):
    scan = _create_scan(client, auth_headers, tiny_jpeg_bytes)

    res = client.post(
        "/pantry",
        headers=auth_headers,
        json={"scan_id": scan["id"], "storage": "fridge"},
    )
    assert res.status_code == 200
    item = res.json()
    assert item["status"] == "active"
    assert item["days_remaining"] >= 0

    res2 = client.get("/pantry", headers=auth_headers)
    assert res2.status_code == 200
    ids = [i["id"] for i in res2.json()]
    assert item["id"] in ids

    res3 = client.patch(f"/pantry/{item['id']}", headers=auth_headers, json={"status": "used"})
    assert res3.status_code == 200
    assert res3.json()["status"] == "used"

    # Resolved items drop out of the active pantry list.
    res4 = client.get("/pantry", headers=auth_headers)
    ids_after = [i["id"] for i in res4.json()]
    assert item["id"] not in ids_after


def test_pantry_urgency_sorted_by_days_remaining(client, auth_headers, tiny_jpeg_bytes):
    scan_a = _create_scan(client, auth_headers, tiny_jpeg_bytes)
    scan_b = _create_scan(client, auth_headers, b"a different photo entirely")

    client.post("/pantry", headers=auth_headers, json={"scan_id": scan_a["id"], "storage": "counter"})
    client.post("/pantry", headers=auth_headers, json={"scan_id": scan_b["id"], "storage": "counter"})

    res = client.get("/pantry", headers=auth_headers)
    items = res.json()
    remaining = [i["days_remaining"] for i in items]
    assert remaining == sorted(remaining)


def test_waste_stats_falls_back_to_demo_baseline_for_fresh_user(client):
    headers = {"X-Device-Id": "brand-new-device"}
    res = client.get("/stats/waste-saved", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["kg_saved"] > 0
    assert len(body["week"]) == 7
