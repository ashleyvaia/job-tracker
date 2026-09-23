from enum import Enum
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base
from typing import Optional
from datetime import date, datetime

class ApplicationStatus(str, Enum):
  applied = "applied"
  interviewing = "interviewing"
  offer = "offer"
  rejected = "rejected"
  ghosted = "ghosted"
  withdrawn = "withdrawn"

class Application(Base):
  __tablename__ = "applications"

  user_id: Mapped[str] = mapped_column()
  id: Mapped[int] = mapped_column(primary_key=True)
  company: Mapped[str] = mapped_column()
  role: Mapped[str] = mapped_column()
  location: Mapped[str] = mapped_column()
  status: Mapped[ApplicationStatus] = mapped_column(
      String, default=ApplicationStatus.applied, server_default=ApplicationStatus.applied.value
  )
  interview_round: Mapped[Optional[int]] = mapped_column(default=None)
  url: Mapped[str] = mapped_column()
  date_applied: Mapped[date] = mapped_column()
  notes: Mapped[Optional[str]] = mapped_column(Text)
  last_checked: Mapped[Optional[datetime]] = mapped_column()
  is_stale: Mapped[bool] = mapped_column(default=False)
  created_at: Mapped[datetime] = mapped_column(server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
