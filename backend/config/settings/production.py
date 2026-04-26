from .base import *

DEBUG = os.environ.get('DEBUG', 'False') == 'True'
CELERY_TASK_ALWAYS_EAGER = False
