"""Railway/Docker entrypoint. Ensures /app/core/ (root) is found before /app/apps/api/core/."""
import sys
import os

# Root core MUST be first so core.data resolves to /app/core/data/
sys.path.insert(0, "/app")
sys.path.insert(1, "/app/apps/api")
os.chdir("/app/apps/api")

# Debug: print what Python sees
print(f"[start] sys.path = {sys.path[:5]}")
print(f"[start] /app/core/data exists = {os.path.isdir('/app/core/data')}")

# Import app directly (bypasses uvicorn's importer)
from main import app

import uvicorn

uvicorn.run(
    app,
    host="0.0.0.0",
    port=int(os.environ.get("PORT", "8080")),
)
