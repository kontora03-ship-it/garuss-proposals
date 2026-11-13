"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
from .geometry_engine import GeometryEngine
from .material_effects import MaterialEffects
class PreviewRenderer:
    @staticmethod
    def render(photo,logo,s):
        warped=GeometryEngine.warp(logo,photo.shape,s); rgb,a=MaterialEffects.apply(photo,warped,s)
        # Source-over in premultiplied representation; retain exact bytes outside coverage.
        ba=photo[:,:,3:4]/255; oa=a+ba*(1-a)
        out=np.zeros_like(photo); out[:,:,:3]=np.round(np.divide(rgb*a+photo[:,:,:3]/255*ba*(1-a),oa,out=np.zeros_like(rgb),where=oa>0)*255).astype(np.uint8)
        out[:,:,3]=np.round(oa[:,:,0]*255).astype(np.uint8); out[a[:,:,0]==0]=photo[a[:,:,0]==0]
        return out
