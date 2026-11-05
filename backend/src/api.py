from fastapi import FastAPI
import routers.root
import routers.tracking
import routers.user
from fastapi.middleware.cors import CORSMiddleware

import logging

logger = logging.getLogger("uvicorn.error")

def create_api():
    app = FastAPI()

    origins = [
        "http://localhost",
        "http://localhost:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(routers.root.router)
    app.include_router(routers.tracking.router)
    app.include_router(routers.user.router)
    
    logger.info("API created and routers included")
    return app