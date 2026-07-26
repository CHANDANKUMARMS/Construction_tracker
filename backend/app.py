from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from routers.company import router as company_router

from routers import ai

from routers.individual import router as individual_router

from routers.project import router as project_router

app = FastAPI()

app.include_router(project_router)

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)

app.include_router(company_router)

app.include_router(individual_router)

app.include_router(ai.router)


@app.get("/")
def home():

    return {

        "message": "Construction Tracker Backend Running"

    }