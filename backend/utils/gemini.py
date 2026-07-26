import os

from dotenv import load_dotenv

from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

SYSTEM_PROMPT = """
You are an AI assistant for a Construction Project Tracking System.

Rules:

1. Answer ONLY from the supplied context.

2. Never invent information.

3. If the answer is not present in the context, reply exactly:

I could not find that information in the provided project data.

4. Keep answers concise.

5. If multiple projects are supplied, compare them whenever necessary.
"""


def ask_gemini(context, question):

    prompt = f"""
{SYSTEM_PROMPT}

Context:

{context}

Question:

{question}
"""

    response = client.models.generate_content(

        model="gemini-3.5-flash-lite",

        contents=prompt

    )

    return response.text