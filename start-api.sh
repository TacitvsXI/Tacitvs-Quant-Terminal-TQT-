#!/bin/bash

echo "🚀 Starting TEZERAKT API Server..."

# Переходим в корень проекта
cd "$(dirname "$0")"

# Активируем виртуальное окружение
source .venv/bin/activate

# Переходим в директорию API
cd apps/api

# Запускаем uvicorn
echo "✅ Starting FastAPI on http://localhost:8080"
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload















