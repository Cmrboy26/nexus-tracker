FROM python:3.13-slim

WORKDIR /src

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src /src
COPY migrations /migrations

RUN useradd backend
RUN mkdir -p /data && chown backend:backend /data
USER backend

EXPOSE 8000

CMD ["python", "main.py"]