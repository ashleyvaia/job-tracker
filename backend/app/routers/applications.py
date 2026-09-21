from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import Application
from app.schemas import ApplicationCreate, ApplicationUpdate, ApplicationRead

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("/", response_model=ApplicationRead)
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
  application = Application(
    company = data.company,
    role = data.role,
    location = data.location,
    url = data.url,
    date_applied = data.date_applied,
    notes = data.notes,
    )

  db.add(application)
  db.commit()
  db.refresh(application)

  return application

@router.get("/", response_model=list[ApplicationRead])
def list_applications(db: Session = Depends(get_db)):
  statement = select(Application)
  result = db.execute(statement)
  applications = result.scalars().all()

  return applications

@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(application_id: int, db: Session = Depends(get_db)):
  statement = select(Application).where(Application.id == application_id)
  result = db.execute(statement)
  application = result.scalars().first()

  if application is None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
  
  return application

@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(application_id: int, data: ApplicationUpdate, db: Session = Depends(get_db)):
  statement = select(Application).where(Application.id == application_id)
  result = db.execute(statement)
  application = result.scalars().first()

  if application is None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

  update_data = data.model_dump(exclude_unset=True)

  for field, value in update_data.items():
    setattr(application, field, value)

  db.commit()
  db.refresh(application)

  return application

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: int, db: Session = Depends(get_db)):
  statement = select(Application).where(Application.id == application_id)
  result = db.execute(statement)
  application = result.scalars().first()

  if application is None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

  db.delete(application)
  db.commit()

