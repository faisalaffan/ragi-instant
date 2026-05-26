from openai import OpenAI

from app.config import settings


def get_openai_client() -> OpenAI:
    provider = settings.llm_provider

    if provider == "deepseek":
        return OpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
    else:
        return OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )


def get_generation_model() -> str:
    return settings.generation_model
