"""Railway/Docker entrypoint. Ensures /app/core/ (root) is found before /app/apps/api/core/."""
import sys
import os

sys.path.insert(0, "/app")
sys.path.insert(1, "/app/apps/api")

os.chdir("/app/apps/api")

import uvicorn

uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=int(os.environ.get("PORT", "8080")),
)
