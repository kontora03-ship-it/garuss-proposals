"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
class QualityValidator:
    @staticmethod
    def quad(points,w,h):
        p=np.array(points,dtype=np.float32)
        if p.shape!=(4,2) or not np.isfinite(p).all(): raise ValueError('Нужны четыре конечные координаты')
        if (p[:,0]<0).any() or (p[:,0]>w-1).any() or (p[:,1]<0).any() or (p[:,1]>h-1).any(): raise ValueError('Углы должны быть внутри фотографии')
        cross=np.cross(np.roll(p,-1,axis=0)-p,np.roll(p,-2,axis=0)-np.roll(p,-1,axis=0))
        if not (cross>1).all() or cv2.contourArea(p)<25: raise ValueError('Порядок: левый верхний → правый верхний → правый нижний → левый нижний; область должна быть выпуклой')
        return p
