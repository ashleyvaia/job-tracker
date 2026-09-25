from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.routers import applications, dashboard

app = FastAPI()

app.include_router(applications.router)
app.include_router(dashboard.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
