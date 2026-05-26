from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://geostack:geostack@localhost:5432/ragi_instant"

    # LLM Provider: openai | anthropic | deepseek
    llm_provider: str = "openai"

    # OpenAI
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"

    # Anthropic
    anthropic_api_key: str = ""

    # DeepSeek (OpenAI-compatible)
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"

    # Embedding (selalu OpenAI untuk sekarang)
    embedding_model: str = "text-embedding-3-small"

    # Generation model (tergantung provider)
    # openai: gpt-4o-mini, gpt-4o
    # anthropic: claude-3-5-haiku-latest
    # deepseek: deepseek-chat, deepseek-reasoner
    generation_model: str = "gpt-4o-mini"

    # Cohere
    cohere_api_key: str = ""

    # LangFuse
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = ""

    log_level: str = "INFO"


settings = Settings()
