"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
class ExportService:
    @staticmethod
    def png(im):
        b=io.BytesIO(); Image.fromarray(im).save(b,format='PNG'); return b.getvalue()
