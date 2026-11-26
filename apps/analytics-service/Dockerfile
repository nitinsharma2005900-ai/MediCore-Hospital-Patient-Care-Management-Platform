FROM python:3.13-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
COPY apps/analytics-service/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home --uid 10001 medicore
COPY --chown=medicore:medicore apps/analytics-service .
USER medicore
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import os,urllib.request; urllib.request.urlopen('http://localhost:'+os.getenv('PORT','8000')+'/health')"
CMD ["sh","-c","exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
