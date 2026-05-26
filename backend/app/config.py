from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql://geostack:geostack@localhost:5432/ragi_instant"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    cohere_api_key: str = ""
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = ""
    generation_model: str = "gpt-4o-mini"  # gpt-4o-mini | claude-haiku
    log_level: str = "INFO"


settings = Settings()
