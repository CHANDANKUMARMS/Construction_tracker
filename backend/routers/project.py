from fastapi import APIRouter, HTTPException, Depends

from database import projects_collection

from models.project import ProjectCreate, InviteEngineer, InviteClient, UpdateTaskStatus, AddTask, DeleteTask, UpdateProjectStatus, JoinProject

import random
import string

router = APIRouter(prefix="/project", tags=["Project"])

from utils.auth import get_current_user


def generate_project_code():

    while True:

        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))

        if not projects_collection.find_one({"project_code": code}):

            return code

@router.get("/all")
def get_all_projects(current_user: dict = Depends(get_current_user)):

    projects = list(
        projects_collection.find(
            {
                "company_email": current_user["email"]
            }
        )
    )

    for project in projects:
        project["_id"] = str(project["_id"])

    return projects


@router.post("/create")
def create_project(project: ProjectCreate,current_user: dict = Depends(get_current_user)):

    project_code = generate_project_code()

    new_project = {

        "project_name": project.project_name,

        "location": project.location,

        "description": project.description,

        "start_date": str(project.start_date),

        "expected_end_date": str(project.expected_end_date),

        "project_code": project_code,

        "company_email": current_user["email"],

        "status": "Active",

        "engineers": [],

        "clients": [],

        "tasks": []

    }

    projects_collection.insert_one(new_project)

    return {

        "message": "Project Created Successfully",

        "project_code": project_code

    }

@router.get("/{project_code}")
def get_project(project_code: str):

    project = projects_collection.find_one(
        {
            "project_code": project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    project["_id"] = str(project["_id"])


    # ================= CALCULATE PROGRESS =================

    total_tasks = len(project["tasks"])

    completed_tasks = sum(

        1

        for task in project["tasks"]

        if task["status"] == "Completed"

    )

    if total_tasks == 0:

        progress = 0

    else:

        progress = int((completed_tasks / total_tasks) * 100)

    project["progress"] = progress


    return project

@router.post("/invite-engineer")
def invite_engineer(data: InviteEngineer):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    for engineer in project["engineers"]:

        if engineer["email"] == data.email:

            raise HTTPException(
                status_code=400,
                detail="Engineer already invited"
            )

    projects_collection.update_one(

        {
            "project_code": data.project_code
        },

        {
            "$push": {
                "engineers": {
                    "email": data.email,
                    "status": "Pending"
                }
            }
        }

    )

    return {

        "message": "Engineer invited successfully"

    }

@router.post("/invite-client")
def invite_client(data: InviteClient):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    for client in project["clients"]:

        if client["email"] == data.email:

            raise HTTPException(
                status_code=400,
                detail="Client already invited"
            )

    projects_collection.update_one(

        {
            "project_code": data.project_code
        },

        {
            "$push": {
                "clients": {
                    "email": data.email,
                    "status": "Pending"
                }
            }
        }

    )

    return {

        "message": "Client invited successfully"

    }

@router.put("/update-task-status")
def update_task_status(data: UpdateTaskStatus):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    updated = False

    for task in project["tasks"]:

        if task["task_name"] == data.task_name:

            task["status"] = data.status

            updated = True

            break

    if not updated:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    projects_collection.update_one(

        {
            "project_code": data.project_code
        },

        {
            "$set": {
                "tasks": project["tasks"]
            }
        }

    )

    return {

        "message": "Task status updated successfully"

    }
@router.post("/add-task")
def add_task(data: AddTask):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Check for duplicate task names
    for task in project["tasks"]:
        if task["task_name"] == data.task_name:
            raise HTTPException(
                status_code=400,
                detail="Task already exists"
            )

    # Optional: Verify engineer belongs to this project
    if data.assigned_to is not None:
        engineer_found = False

        for engineer in project["engineers"]:
            if engineer["email"] == data.assigned_to:
                engineer_found = True
                break

        if not engineer_found:
            raise HTTPException(
                status_code=400,
                detail="Assigned engineer is not part of this project"
            )

    projects_collection.update_one(
        {
            "project_code": data.project_code
        },
        {
            "$push": {
                "tasks": {
                    "task_name": data.task_name,
                    "assigned_to": data.assigned_to,
                    "deadline": str(data.deadline),
                    "status": "Pending"
                }
            }
        }
    )

    return {
        "message": "Task added successfully"
    }


@router.delete("/delete-task")
def delete_task(data: DeleteTask):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    deleted = False

    new_tasks = []

    for task in project["tasks"]:

        if task["task_name"] == data.task_name:

            deleted = True

            continue

        new_tasks.append(task)

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    projects_collection.update_one(

        {
            "project_code": data.project_code
        },

        {
            "$set": {
                "tasks": new_tasks
            }
        }

    )

    return {

        "message": "Task deleted successfully"

    }

@router.put("/update-status")
def update_project_status(data: UpdateProjectStatus):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    projects_collection.update_one(
        {
            "project_code": data.project_code
        },
        {
            "$set": {
                "status": data.status
            }
        }
    )

    return {
        "message": "Project status updated successfully"
    }

@router.put("/join")
def join_project(data: JoinProject):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    found = False

    # Engineer
    for engineer in project["engineers"]:

        if engineer["email"] == data.email:

            if engineer["status"] == "Joined":

                raise HTTPException(
                    status_code=400,
                    detail="Engineer already joined"
                )

            engineer["status"] = "Joined"

            found = True

            break

    # Client
    if not found:

        for client in project["clients"]:

            if client["email"] == data.email:

                if client["status"] == "Joined":

                    raise HTTPException(
                        status_code=400,
                        detail="Client already joined"
                    )

                client["status"] = "Joined"

                found = True

                break

    if not found:

        raise HTTPException(
            status_code=403,
            detail="You are not part of this project"
        )

    projects_collection.update_one(
        {
            "project_code": data.project_code
        },
        {
            "$set": {
                "engineers": project["engineers"],
                "clients": project["clients"]
            }
        }
    )

    return {
        "message": "Project joined successfully"
    }