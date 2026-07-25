from fastapi import APIRouter, HTTPException, Depends

from database import individual_collection, projects_collection

from models.individual import IndividualSignup, IndividualLogin, JoinProject

from utils.password import hash_password, verify_password

from utils.jwt import create_access_token

from utils.auth import get_current_user

router = APIRouter(prefix="/individual", tags=["Individual"])


@router.post("/signup")
def signup(user: IndividualSignup):

    if individual_collection.find_one({"email": user.email}):

        raise HTTPException(
            status_code=400,
            detail="User already exists."
        )

    individual_collection.insert_one({

        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "projects": []

    })

    return {

        "message": "Registration successful."

    }


@router.post("/login")
def login(user: IndividualLogin):

    db_user = individual_collection.find_one({

        "email": user.email

    })

    if db_user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        user.password,
        db_user["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token = create_access_token(
        {
            "user_id": str(db_user["_id"]),
            "email": db_user["email"]
        }
    )

    return {

        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer"

    }


@router.put("/join-project")
def join_project(
    data: JoinProject,
    current_user: dict = Depends(get_current_user)
):

    project = projects_collection.find_one(
        {
            "project_code": data.project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found."
        )

    email = current_user["email"]

    # Check if user is an engineer
    for engineer in project["engineers"]:

        if engineer["email"] == email:

            if engineer["status"] == "Joined":

                raise HTTPException(
                    status_code=400,
                    detail="You have already joined this project."
                )

            engineer["status"] = "Joined"

            projects_collection.update_one(
                {
                    "project_code": data.project_code
                },
                {
                    "$set": {
                        "engineers": project["engineers"]
                    }
                }
            )

            individual_collection.update_one(
                {
                    "email": email
                },
                {
                    "$addToSet": {
                        "projects": {
                            "project_code": data.project_code,
                            "role": "engineer"
                        }
                    }
                }
            )

            return {
                "message": "Project joined successfully."
            }

    # Check if user is a client
    for client in project["clients"]:

        if client["email"] == email:

            if client["status"] == "Joined":

                raise HTTPException(
                    status_code=400,
                    detail="You have already joined this project."
                )

            client["status"] = "Joined"

            projects_collection.update_one(
                {
                    "project_code": data.project_code
                },
                {
                    "$set": {
                        "clients": project["clients"]
                    }
                }
            )

            individual_collection.update_one(
                {
                    "email": email
                },
                {
                    "$addToSet": {
                        "projects": {
                            "project_code": data.project_code,
                            "role": "client"
                        }
                    }
                }
            )

            return {
                "message": "Project joined successfully."
            }

    raise HTTPException(
        status_code=403,
        detail="You are not assigned to this project."
    )

@router.get("/projects")
def get_projects(
    current_user: dict = Depends(get_current_user)
):

    individual = individual_collection.find_one(
        {
            "email": current_user["email"]
        }
    )

    if individual is None:

        raise HTTPException(
            status_code=404,
            detail="Individual not found."
        )

    project_list = []

    for project_info in individual["projects"]:

        project = projects_collection.find_one(
            {
                "project_code": project_info["project_code"]
            }
        )

        if project:

            project_list.append({

                "project_name": project["project_name"],

                "project_code": project["project_code"],

                "location": project["location"],

                "status": project["status"],

                "role": project_info["role"]

            })

    return project_list

@router.get("/project/{project_code}")
def get_project(
    project_code: str,
    current_user: dict = Depends(get_current_user)
):

    individual = individual_collection.find_one(
        {
            "email": current_user["email"]
        }
    )

    if individual is None:

        raise HTTPException(
            status_code=404,
            detail="Individual not found."
        )

    role = None

    for project_info in individual["projects"]:

        if project_info["project_code"] == project_code:

            role = project_info["role"]
            break

    if role is None:

        raise HTTPException(
            status_code=403,
            detail="You are not a member of this project."
        )

    project = projects_collection.find_one(
        {
            "project_code": project_code
        }
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found."
        )

    project["_id"] = str(project["_id"])

    return {

        "role": role,

        "can_edit": role == "engineer",

        "project": project

    }