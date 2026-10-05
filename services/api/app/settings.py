from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='GOUXUAN_')

    index_path: Path = Path('data/index.db')


settings = Settings()
