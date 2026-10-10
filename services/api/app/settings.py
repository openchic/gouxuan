from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='GOUXUAN_')

    database_url: str = 'postgresql+psycopg://gouxuan:gouxuan@127.0.0.1:55432/gouxuan'
    access_token_seconds: int = Field(default=15 * 60, gt=0)
    session_idle_seconds: int = Field(default=30 * 24 * 60 * 60, gt=0)
    session_absolute_seconds: int = Field(default=180 * 24 * 60 * 60, gt=0)


settings = Settings()
