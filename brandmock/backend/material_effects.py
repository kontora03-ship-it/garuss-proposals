"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
class MaterialEffects:
    @staticmethod
    def apply(base,warped,s):
        alpha=warped[:,:,3:4]; rgb=np.divide(warped[:,:,:3],alpha,out=np.zeros_like(warped[:,:,:3]),where=alpha>0)
        intensity=float(s.get('intensity',.5)); mode=s.get('method','print')
        lum=cv2.cvtColor(base[:,:,:3].astype(np.float32)/255,cv2.COLOR_RGB2GRAY)[:,:,None]
        if mode=='print': rgb*=1+intensity*.25*(lum-.5)
        elif mode in ('silver','gold'):
            color=np.array([int(s.get('color','#d4ad54')[i:i+2],16)/255 for i in (1,3,5)])
            yy,xx=np.indices(alpha.shape[:2]); angle=math.radians(s.get('light',135))
            wave=np.sin((xx*math.cos(angle)+yy*math.sin(angle))/28)[:,:,None]
            edge=cv2.Sobel(alpha[:,:,0],cv2.CV_32F,1,0)[:,:,None]
            rgb=color*(.8+intensity*(.35*wave+.25*lum))+edge*.12*intensity
        elif mode=='blind':
            gx=cv2.Sobel(alpha[:,:,0],cv2.CV_32F,1,0); gy=cv2.Sobel(alpha[:,:,0],cv2.CV_32F,0,1)
            a=math.radians(s.get('light',135)); relief=(gx*math.cos(a)+gy*math.sin(a))[:,:,None]
            rgb=base[:,:,:3]/255+relief*intensity*.22-intensity*.035
        else: raise ValueError('Неизвестный способ нанесения')
        return np.clip(rgb,0,1),alpha*float(s.get('opacity',1))
