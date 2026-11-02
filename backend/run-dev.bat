python.exe -m pip install -r requirements.txt
docker build -t nexus-backend .
docker run --rm -p 8000:8000 nexus-backend