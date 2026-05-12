import logging
import os
from datetime import datetime

# Configure logging
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "audit.log")),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("audit")

def log_audit(user: str, action: str, details: str = ""):
    """Log an audit event with user, action, and details."""
    timestamp = datetime.now().isoformat()
    msg = f"[AUDIT] User: {user} | Action: {action} | Details: {details}"
    logger.info(msg)
