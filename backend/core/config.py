from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    DATABASE_NAME: str = "campusconnect"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    ADMIN_NAME: str

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = ""

    class Config:
        env_file = (".env", "backend/.env")

settings = Settings()
