FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ server/
COPY web/ web/
# Docker uses an internal wildcard listener so explicitly loopback-bound host
# port publishing can still reach it. No public port mapping is configured here.
ENV PORT=8080 HOST=0.0.0.0 PYTHONDONTWRITEBYTECODE=1
EXPOSE 8080
CMD ["python", "-m", "server.app"]
