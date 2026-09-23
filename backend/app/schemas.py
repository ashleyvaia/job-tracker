from pydantic import BaseModel, HttpUrl
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
