"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
from .quality_validator import QualityValidator
class GeometryEngine:
    @staticmethod
    def warp(logo,shape,s):
        h,w=shape[:2]; p=QualityValidator.quad(s['corners'],w,h)
        sw=float(s.get('surface_width',400)); sh=float(s.get('surface_height',250))
        if not 1<=sw<=10000 or not 1<=sh<=10000: raise ValueError('Некорректные размеры поверхности')
        lh,lw=logo.shape[:2]; scale=float(s.get('scale',.65))
        if not .01<=scale<=2: raise ValueError('Некорректный масштаб')
        width=min(sw,sh*lw/lh)*scale; height=width*lh/lw
        rect=np.array([[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]],np.float32)
        a=math.radians(s.get('rotation',0)); rot=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
        rect=(rect@rot.T+np.array([sw*float(s.get('x',.5)),sh*float(s.get('y',.5))])).astype(np.float32)
        surface=cv2.getPerspectiveTransform(np.array([[0,0],[sw,0],[sw,sh],[0,sh]],np.float32),p)
        placement=cv2.getPerspectiveTransform(np.array([[0,0],[lw,0],[lw,lh],[0,lh]],np.float32),rect)
        rgba=logo.astype(np.float32)/255; rgba[:,:,:3]*=rgba[:,:,3:4]
        warped=cv2.warpPerspective(rgba,surface@placement,(w,h),flags=cv2.INTER_LINEAR)
        mask=np.zeros((h,w),np.uint8); cv2.fillConvexPoly(mask,np.round(p).astype(np.int32),1)
        warped*=mask[:,:,None]
        return warped
