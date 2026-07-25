from pydantic import BaseModel, EmailStr


class IndividualSignup(BaseModel):

    name: str
    email: EmailStr
    password: str


class IndividualLogin(BaseModel):

    email: EmailStr
    password: str

class JoinProject(BaseModel):
    project_code: str