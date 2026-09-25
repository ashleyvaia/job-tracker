from pydantic import BaseModel, HttpUrl, computed_field
from datetime import date, datetime
from typing import Optional
from app.models import ApplicationStatus


class ApplicationCreate(BaseModel):
    company: str
    role: str
    location: str
    url: HttpUrl
    date_applied: date
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    interview_round: Optional[int] = None
    url: Optional[HttpUrl] = None
    date_applied: Optional[date] = None
    notes: Optional[str] = None


class ApplicationRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    company: str
    role: str
    location: str
    status: ApplicationStatus
    interview_round: Optional[int]
    url: HttpUrl
    date_applied: date
    notes: Optional[str]
    last_checked: Optional[datetime]
    is_stale: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def days_since_applied(self) -> int:
        return (date.today() - self.date_applied).days

    @computed_field
    @property
    def likely_stale(self) -> bool:
        return self.days_since_applied > 14 and self.status == "applied"


class WeeklyCount(BaseModel):
    week: date
    count: int


class DashboardStats(BaseModel):
    stale_rate: float
    ghost_rate: float
    response_rate: float
    status_breakdown: dict[str, int]
    days_since_last_applied: Optional[int]
    applications_per_week: list[WeeklyCount]
    current_streak: int
