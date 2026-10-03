FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if any are needed (e.g. for building some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and model/data
COPY api/ ./api/
COPY model/ ./model/
COPY data/ ./data/

EXPOSE 8000

# The API assumes it's run from the root where api/, model/ and data/ are subdirectories.
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
