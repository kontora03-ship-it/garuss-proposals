"""Deterministic, premultiplied-alpha planar compositor. Coordinates are source pixels."""
import io, re, math
import numpy as np
import cv2
from PIL import Image, ImageOps
import cairosvg
from defusedxml import ElementTree

MAX_PIXELS=20_000_000
from .image_loader import ImageLoader
class LogoLoader:
    @staticmethod
    def load(data):
        if data.lstrip().startswith(b'<'):
            root=ElementTree.fromstring(data)
            allowed={'svg','g','path','rect','circle','ellipse','polygon','polyline','line','defs','linearGradient','radialGradient','stop','clipPath','mask','title','desc','text','tspan'}
            for el in root.iter():
                if el.tag.split('}')[-1] not in allowed: raise ValueError('Недопустимый элемент SVG')
                for key,val in el.attrib.items():
                    k=key.split('}')[-1].lower()
                    if k in ('style','base') or k.startswith('on') or (k=='href' and not val.startswith('#')) or re.search(r'url\(\s*[\"\']?(?!#)',val,re.I) or '@' in val: raise ValueError('Внешние ресурсы SVG запрещены')
            vb=root.attrib.get('viewBox','').replace(',',' ').split()
            if len(vb)==4:
                width,height=float(vb[2]),float(vb[3])
            else:
                width=float(re.sub(r'px$','',root.attrib.get('width','300')))
                height=float(re.sub(r'px$','',root.attrib.get('height','150')))
            if not math.isfinite(width+height) or width<=0 or height<=0 or not .02<=width/height<=50: raise ValueError('Некорректные размеры SVG')
            factor=1600/max(width,height)
            data=cairosvg.svg2png(bytestring=data,output_width=max(1,round(width*factor)),output_height=max(1,round(height*factor)),unsafe=False)
        return ImageLoader.load(data)
