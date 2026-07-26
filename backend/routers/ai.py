from fastapi import APIRouter

from models.ai import AskAIRequest
from models.ai import AskAIResponse

from utils.gemini import ask_gemini

router = APIRouter(

    prefix="/ai",

    tags=["AI"]

)


@router.post(

    "/ask",

    response_model=AskAIResponse

)

def ask_ai(data: AskAIRequest):

    answer = ask_gemini(

        data.context,

        data.question

    )

    return AskAIResponse(

        answer=answer

    )