"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
class ImageLoader:
    @staticmethod
    def load(data):
        im=Image.open(io.BytesIO(data))
        if im.format not in ('JPEG','PNG','WEBP') or im.width*im.height>MAX_PIXELS: raise ValueError('Допустимы JPG, PNG, WebP до 20 Мп')
        return np.array(ImageOps.exif_transpose(im).convert('RGBA'))
