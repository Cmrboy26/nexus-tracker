if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    import logging.config
    import uvicorn
    from uvicorn.config import LOGGING_CONFIG

    logging.config.dictConfig(LOGGING_CONFIG)
    import app

    uvicorn.run(app.api, host="0.0.0.0", port=8000)

