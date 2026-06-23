def test_create_scan_requires_device_id(client, tiny_jpeg_bytes):
    res = client.post("/scans", files={"image": ("photo.jpg", tiny_jpeg_bytes, "image/jpeg")})
    assert res.status_code == 422


def test_create_and_fetch_scan(client, auth_headers, tiny_jpeg_bytes):
    res = client.post(
        "/scans",
        headers=auth_headers,
        files={"image": ("photo.jpg", tiny_jpeg_bytes, "image/jpeg")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["band"] in ("fresh", "eat_soon", "use_now")
    assert 0 <= body["score"] <= 100
    assert body["image_url"].startswith("/uploads/")

    res2 = client.get(f"/scans/{body['id']}", headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["id"] == body["id"]


def test_scan_scoped_to_device(client, tiny_jpeg_bytes):
    owner = {"X-Device-Id": "owner-device"}
    other = {"X-Device-Id": "other-device"}

    res = client.post(
        "/scans", headers=owner, files={"image": ("photo.jpg", tiny_jpeg_bytes, "image/jpeg")}
    )
    scan_id = res.json()["id"]

    res2 = client.get(f"/scans/{scan_id}", headers=other)
    assert res2.status_code == 404
