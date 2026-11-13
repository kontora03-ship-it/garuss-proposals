"""Extension boundary for a future optional surface detector; no AI is used in MVP."""
from typing import Protocol
import numpy as np
class SurfaceDetector(Protocol):
    def detect(self, image: np.ndarray) -> list[list[float]]:
        """Return TL, TR, BR, BL pixel coordinates; caller must validate them."""
        ...
