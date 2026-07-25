from pydantic import BaseModel, EmailStr


class CompanySignup(BaseModel):

    company_name: str
    owner_name: str
    email: EmailStr
    password: str


class CompanyLogin(BaseModel):

    email: EmailStr
    password: str