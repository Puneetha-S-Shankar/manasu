from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    nvidia_nim_api_key: str
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
