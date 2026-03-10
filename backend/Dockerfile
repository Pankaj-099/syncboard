FROM python:3.12-slim

WORKDIR /app

# Install uv for fast installs
RUN pip install uv --no-cache-dir

COPY pyproject.toml .
COPY uv.lock* .

# Install dependencies
RUN uv pip install --system -r pyproject.toml 2>/dev/null || pip install -e . --no-cache-dir

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
