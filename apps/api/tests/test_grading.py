from app.grading import BANDS, SCORE_RANGES, grade_image


def test_same_bytes_yield_same_result():
    content = b"same-photo-bytes"
    a = grade_image(content)
    b = grade_image(content)
    assert a == b


def test_different_bytes_can_yield_different_results():
    results = {grade_image(f"photo-{i}".encode()) for i in range(20)}
    assert len(results) > 1


def test_score_matches_its_band_range():
    for i in range(50):
        result = grade_image(f"photo-{i}".encode())
        assert result.band in BANDS
        lo, hi = SCORE_RANGES[result.band]
        assert lo <= result.score <= hi
        assert 0 <= result.confidence <= 100
        assert result.days_fridge >= result.days_counter
