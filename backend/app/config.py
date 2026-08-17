import os

PROXY_API_BASE = "https://api.proxyapi.ru/openai/v1"
LLM_MODEL = "gpt-4o-mini"

MAX_FILE_SIZE = 1 * 1024 * 1024
TOP_K = 5

PROXY_API_KEY = os.getenv("PROXY_API_KEY")