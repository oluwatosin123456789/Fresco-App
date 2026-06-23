"""Static recipe catalog, tagged by produce_type so /recipes can rank them
against what's actually expiring in the user's Pantry (PRD §6.2, "Use-it-up
recipes"). No real photos are available for these — the frontend renders an
ImageSlot placeholder, mirroring the design project's own image-slot pattern.
"""

RECIPES = [
    {
        "id": 1,
        "title": "Tomato & Pepper Shakshuka",
        "subtitle": "Eggs poached in a spiced tomato & pepper sauce",
        "minutes": 25,
        "tags": ["tomato", "bell_pepper", "spinach"],
        "placeholder": "shakshuka photo",
    },
    {
        "id": 2,
        "title": "Banana Oat Pancakes",
        "subtitle": "Ripe-banana batter, no added sugar",
        "minutes": 15,
        "tags": ["banana"],
        "placeholder": "pancake photo",
    },
    {
        "id": 3,
        "title": "Strawberry Quick Jam",
        "subtitle": "Stovetop jam, ready in one pan",
        "minutes": 20,
        "tags": ["strawberry"],
        "placeholder": "jam photo",
    },
    {
        "id": 4,
        "title": "Garlic Wilted Spinach",
        "subtitle": "A 5-minute side for anything",
        "minutes": 5,
        "tags": ["spinach"],
        "placeholder": "spinach photo",
    },
    {
        "id": 5,
        "title": "Avocado Toast",
        "subtitle": "Lime, chili flake, flaky salt",
        "minutes": 5,
        "tags": ["avocado"],
        "placeholder": "avocado toast photo",
    },
    {
        "id": 6,
        "title": "Roasted Bell Pepper Soup",
        "subtitle": "Smoky, blended, freezer-friendly",
        "minutes": 30,
        "tags": ["bell_pepper", "tomato"],
        "placeholder": "soup photo",
    },
]
