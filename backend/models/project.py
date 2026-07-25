from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date
from fastapi import Depends
from utils.auth import get_current_user


class ProjectCreate(BaseModel):

    project_name: str
    location: str
    description: str
    start_date: date
    expected_end_date: date

class InviteEngineer(BaseModel):

    project_code: str
    email: EmailStr

class InviteClient(BaseModel):

    project_code: str
    email: EmailStr

class UpdateTaskStatus(BaseModel):

    project_code: str
    task_name: str
    status: str

class AddTask(BaseModel):

    project_code: str
    task_name: str
    assigned_to: Optional[EmailStr] = None
    deadline: date

class DeleteTask(BaseModel):

    project_code: str
    task_name: str

class UpdateProjectStatus(BaseModel):
    project_code: str
    status: str

class JoinProject(BaseModel):

    project_code: str
    email: EmailStr