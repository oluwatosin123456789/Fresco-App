from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models  # noqa: F401  (registers tables with Base.metadata)
from .db import Base, engine
from .routers import pantry, recipes, scans, stats, trader
from .storage import UPLOADS_DIR

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fresco API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(scans.router)
app.include_router(pantry.router)
app.include_router(recipes.router)
app.include_router(stats.router)
app.include_router(trader.router)


@app.get("/health")
def health():
    return {"status": "ok"}
