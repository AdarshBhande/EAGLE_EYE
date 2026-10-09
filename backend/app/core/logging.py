import logging
import sys

def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Configures centralized structured logging for EAGLE EYE.
    """
    level = getattr(logging, log_level.upper(), logging.INFO)

    log_format = (
        "[%(asctime)s] [%(levelname)s] [%(name)s:%(filename)s:%(lineno)d]: %(message)s"
    )

    logging.basicConfig(
        level=level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Silence verbose third-party loggers
    logging.getLogger("uvicorn.access").setLevel(level)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("eagle_eye")
    logger.setLevel(level)
    logger.info("Logging initialized at level: %s", log_level)
    return logger
