# Dockerfile for MediCore Python FastAPI Analytics Microservice
FROM python:3.13-slim

WORKDIR /app

# Non-root user
RUN addgroup --system medicore && adduser --system --group medicore

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

COPY apps/analytics-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/analytics-service /app

RUN chown -R medicore:medicore /app
USER medicore

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
