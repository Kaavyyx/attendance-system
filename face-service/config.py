
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HOST = "127.0.0.1"
    PORT = 5001
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

