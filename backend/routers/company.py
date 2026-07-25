from fastapi import APIRouter, HTTPException
from utils.jwt import create_access_token

from database import company_collection

from models.company import CompanySignup, CompanyLogin

from utils.password import hash_password, verify_password

router = APIRouter(prefix="/company", tags=["Company"])


@router.post("/signup")
def signup(company: CompanySignup):

    if company_collection.find_one({"email": company.email}):

        raise HTTPException(
            status_code=400,
            detail="Company already registered."
        )

    company_collection.insert_one({

        "company_name": company.company_name,
        "owner_name": company.owner_name,
        "email": company.email,
        "password": hash_password(company.password)

    })

    return {
        "message": "Company registered successfully."
    }


@router.post("/login")
def login(company: CompanyLogin):

    db_company = company_collection.find_one({

        "email": company.email

    })

    if db_company is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        company.password,
        db_company["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token = create_access_token(
    {
        "company_id": str(db_company["_id"]),
        "email": db_company["email"],
        "role": "company"
    }
    )

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer"
    }