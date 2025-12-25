FROM python:3.11-slim

# Setup Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy App Code
COPY . .

# Cloud Run defaults to port 8080
ENV PORT=8080

# Start Uvicorn
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
