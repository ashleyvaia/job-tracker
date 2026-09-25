from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from datetime import date, timedelta

from app.auth import get_current_user
from app.database import get_db
from app.schemas import DashboardStats, WeeklyCount
from app.models import Application, ApplicationStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    total = db.execute(
        select(func.count())
        .select_from(Application)
        .where(
            Application.user_id == current_user,
        )
    ).scalar()
    stale = db.execute(
        select(func.count())
        .select_from(Application)
        .where(Application.user_id == current_user, Application.is_stale)
    ).scalar()

    calculated_stale_rate = 0.0 if total == 0.0 else (stale / total * 100)

    ghost = db.execute(
        select(func.count())
        .select_from(Application)
        .where(Application.user_id == current_user, Application.status == "ghosted")
    ).scalar()

    calculated_ghost_rate = 0.0 if total == 0.0 else (ghost / total * 100)

    responses = db.execute(
        select(func.count())
        .select_from(Application)
        .where(
            Application.user_id == current_user,
            Application.status.in_(("interviewing", "offer", "rejected")),
        )
    ).scalar()

    calculate_response_rate = 0.0 if total == 0.0 else (responses / total * 100)

    breakdown = db.execute(
        select(Application.status, func.count())
        .where(Application.user_id == current_user)
        .group_by(Application.status)
    ).all()

    breakdown_dict_zeroes = {status.value: 0 for status in ApplicationStatus}
    breakdown_dict = {status_name: count for status_name, count in breakdown}
    breakdown_dict = {**breakdown_dict_zeroes, **breakdown_dict}

    last_date = db.execute(
        select(func.max(Application.date_applied)).where(
            Application.user_id == current_user
        )
    ).scalar()

    days_since = None
    if last_date is not None:
        days_since = (date.today() - last_date).days

    week = func.date_trunc("week", Application.date_applied)
    applications_by_week = db.execute(
        select(week, func.count())
        .where(Application.user_id == current_user)
        .group_by(week)
    ).all()
    applications_by_week = [
        WeeklyCount(week=curr_week, count=curr_count)
        for curr_week, curr_count in applications_by_week
    ]

    dates_applied = db.execute(
        select(Application.date_applied).distinct().where(Application.user_id == current_user)
    ).scalars().all()

    dates_set = set((dates_applied))

    streak_counter = 0
    curr_date = date.today() if date.today() in dates_set else date.today() - timedelta(days=1)
    while curr_date in dates_set:
        streak_counter += 1
        curr_date -= timedelta(days=1)

    dashboard_stats = DashboardStats(
        stale_rate=calculated_stale_rate,
        ghost_rate=calculated_ghost_rate,
        response_rate=calculate_response_rate,
        status_breakdown=breakdown_dict,
        days_since_last_applied=days_since,
        applications_per_week=applications_by_week,
        current_streak=streak_counter,
    )

    return dashboard_stats
