from pydantic import BaseModel
from typing import Any


class AskAIRequest(BaseModel):

    context: Any

    question: str


class AskAIResponse(BaseModel):

    answer: str