"""Mock freshness-grading engine.

This stands in for the real PRD §7 vision pipeline (detect & isolate ->
classify -> grade freshness -> estimate shelf life -> explain, via CV models
+ a Gemini vision-language explanation layer). `grade_image` is the single
seam to swap: replace its body with a real model/API call and keep the
`GradeResult` shape so every route built on top of it keeps working.

To make demos feel alive without a real model, the result is derived from a
hash of the uploaded image bytes (stable for the same photo, varied across
different ones) rather than pure randomness.
"""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass

BANDS = ("fresh", "eat_soon", "use_now")
SCORE_RANGES = {
    "fresh": (67, 100),
    "eat_soon": (34, 66),
    "use_now": (0, 33),
}
# Skew toward the happier outcomes so a demo run doesn't read "everything is rotten".
BAND_WEIGHTS = {"fresh": 0.45, "eat_soon": 0.35, "use_now": 0.20}


@dataclass(frozen=True)
class ProduceProfile:
    type_slug: str
    display_name: str
    # (counter_days, fridge_days) per band
    days: dict[str, tuple[int, int]]
    issue_templates: dict[str, str | None]
    verdict_templates: dict[str, str]


PRODUCE_PROFILES: dict[str, ProduceProfile] = {
    "tomato": ProduceProfile(
        type_slug="tomato",
        display_name="Roma Tomato",
        days={"fresh": (4, 7), "eat_soon": (2, 4), "use_now": (0, 1)},
        issue_templates={
            "fresh": None,
            "eat_soon": "browning {pct}% surface near the stem",
            "use_now": "soft spotting {pct}% surface, skin splitting",
        },
        verdict_templates={
            "fresh": "Firm and glossy. Good for another week on the counter.",
            "eat_soon": "Ripe and good. The soft spot near the stem is fine to cut around — just use it within a few days.",
            "use_now": "Past its best — use today in something cooked, like a sauce, rather than raw.",
        },
    ),
    "banana": ProduceProfile(
        type_slug="banana",
        display_name="Banana",
        days={"fresh": (3, 6), "eat_soon": (1, 3), "use_now": (0, 1)},
        issue_templates={
            "fresh": None,
            "eat_soon": "sugar-spotting {pct}% of peel",
            "use_now": "peel bruising {pct}%, flesh softening",
        },
        verdict_templates={
            "fresh": "Still firm and a little green at the tips — peak ripeness is a couple of days out.",
            "eat_soon": "Peak ripeness — sweetest right now, perfect for eating or baking.",
            "use_now": "Very ripe. Best used today in banana bread or a smoothie rather than eaten plain.",
        },
    ),
    "strawberry": ProduceProfile(
        type_slug="strawberry",
        display_name="Strawberries",
        days={"fresh": (3, 5), "eat_soon": (1, 2), "use_now": (0, 1)},
        issue_templates={
            "fresh": None,
            "eat_soon": "softening {pct}% of berries",
            "use_now": "mold risk on {pct}% of berries — sort before storing",
        },
        verdict_templates={
            "fresh": "Bright, firm, and fragrant. Good for several days in the fridge.",
            "eat_soon": "Starting to soften. Eat within a day or two, or turn into jam.",
            "use_now": "Turning fast — use today. Quick jam or a smoothie is the best save.",
        },
    ),
    "spinach": ProduceProfile(
        type_slug="spinach",
        display_name="Spinach",
        days={"fresh": (5, 8), "eat_soon": (2, 4), "use_now": (0, 1)},
        issue_templates={
            "fresh": None,
            "eat_soon": "wilting {pct}% of leaves",
            "use_now": "yellowing and sliming on {pct}% of leaves",
        },
        verdict_templates={
            "fresh": "Crisp, deep green leaves. Plenty of time left in the crisper drawer.",
            "eat_soon": "A few leaves are wilting. Still great wilted into a pan, less great raw.",
            "use_now": "Going slimy at the edges — sort out the bad leaves and cook the rest today.",
        },
    ),
    "bell_pepper": ProduceProfile(
        type_slug="bell_pepper",
        display_name="Bell Peppers",
        days={"fresh": (7, 10), "eat_soon": (3, 5), "use_now": (0, 2)},
        issue_templates={
            "fresh": None,
            "eat_soon": "skin wrinkling {pct}% surface",
            "use_now": "soft patches {pct}% surface near the stem",
        },
        verdict_templates={
            "fresh": "Glossy and firm. One of your longest-lasting items right now.",
            "eat_soon": "Still good but starting to wrinkle. Use within the week.",
            "use_now": "Soft patches forming — fine for cooking today, not for raw snacking.",
        },
    ),
    "avocado": ProduceProfile(
        type_slug="avocado",
        display_name="Avocado",
        days={"fresh": (3, 5), "eat_soon": (1, 2), "use_now": (0, 1)},
        issue_templates={
            "fresh": None,
            "eat_soon": "softening {pct}% near the stem",
            "use_now": "browning {pct}% of flesh expected at the stem end",
        },
        verdict_templates={
            "fresh": "Still firm — a few days from ripe. Leave on the counter.",
            "eat_soon": "Perfectly ripe right now. Eat today or tomorrow.",
            "use_now": "Past peak ripeness — best mashed into guacamole rather than sliced.",
        },
    ),
}

PRODUCE_KEYS = list(PRODUCE_PROFILES.keys())


@dataclass(frozen=True)
class GradeResult:
    produce_name: str
    produce_type: str
    score: int
    band: str
    confidence: int
    flagged: str | None
    verdict: str
    days_counter: int
    days_fridge: int


def grade_image(image_bytes: bytes, produce_hint: str | None = None) -> GradeResult:
    seed = int(hashlib.sha256(image_bytes).hexdigest(), 16)
    rng = random.Random(seed)

    if produce_hint and produce_hint in PRODUCE_PROFILES:
        profile = PRODUCE_PROFILES[produce_hint]
    else:
        profile = PRODUCE_PROFILES[rng.choice(PRODUCE_KEYS)]

    band = rng.choices(BANDS, weights=[BAND_WEIGHTS[b] for b in BANDS], k=1)[0]
    lo, hi = SCORE_RANGES[band]
    score = rng.randint(lo, hi)
    confidence = rng.randint(86, 97)

    counter_lo, counter_hi = profile.days["fresh" if band == "fresh" else band]
    days_counter = rng.randint(counter_lo, counter_hi)
    days_fridge = days_counter + rng.randint(2, 4)

    issue_template = profile.issue_templates[band]
    flagged = (
        issue_template.format(pct=rng.randint(8, 35)) if issue_template else None
    )
    verdict = profile.verdict_templates[band]

    return GradeResult(
        produce_name=profile.display_name,
        produce_type=profile.type_slug,
        score=score,
        band=band,
        confidence=confidence,
        flagged=flagged,
        verdict=verdict,
        days_counter=days_counter,
        days_fridge=days_fridge,
    )
