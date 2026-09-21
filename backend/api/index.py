import sys
from pathlib import Path

# Add backend root to sys.path so app module is discoverable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
