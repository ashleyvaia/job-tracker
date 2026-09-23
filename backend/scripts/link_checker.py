from dataclasses import dataclass
import httpx
import asyncio
import re
from bs4 import BeautifulSoup
from app.database import SessionLocal
from app.models import Application
from sqlalchemy import select
import datetime

CLOSED_PATTERNS = [
    r"job (is )?(no longer|not) (available|accepting applications?)",
    r"(position|job|opening) (has been |has |is |was )?(filled|expired)",
    r"\bsorry\b",
]


@dataclass
class CheckResult:
    is_stale: bool
    reason: str


async def check_url(url: str) -> CheckResult:
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url)
    except httpx.RequestError:
        return CheckResult(is_stale=True, reason="connection_error")

    if response.status_code >= 400:
        return CheckResult(is_stale=True, reason="not_found")

    if response.url.host != httpx.URL(url).host:
        return CheckResult(is_stale=True, reason="redirected")

    plain_text = BeautifulSoup(response.text, "html.parser").get_text()

    for ptrn in CLOSED_PATTERNS:
        match = re.search(ptrn, plain_text, re.IGNORECASE)
        if match:
            return CheckResult(is_stale=True, reason="application_closed")

    return CheckResult(is_stale=False, reason="ok")


async def check_application(application: Application) -> None:
    check_result = await check_url(application.url)
    application.is_stale = check_result.is_stale
    application.last_checked = datetime.datetime.now()


async def check_all_applications() -> None:
    db = SessionLocal()
    statement = select(Application)
    result = db.execute(statement)
    applications = result.scalars().all()

    tasks = [check_application(application) for application in applications]
    await asyncio.gather(*tasks)

    db.commit()
    db.close()


if __name__ == "__main__":
    asyncio.run(check_all_applications())
