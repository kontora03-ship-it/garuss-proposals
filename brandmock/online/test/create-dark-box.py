"""Synthetic weak-contrast box inspired by the reported view; not the user's photo."""
from pathlib import Path
import math,json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
root=Path(__file__).resolve().parents[1];w,h=1200,857
# back-left, back-right, front-right, front-left in the lid's own orientation
lid=[(573,77),(1044,219),(603,587),(109,361)]
front=[(109,361),(603,587),(603,789),(130,518)]
side=[(603,587),(1044,219),(1083,381),(603,789)]
y,x=np.indices((h,w));rng=np.random.default_rng(7);noise=rng.normal(0,1.5,(h,w));photo=np.full((h,w,3),250,dtype=np.uint8)
for poly,base in [(front,22),(side,31),(lid,38)]:
 mask=Image.new('L',(w,h));ImageDraw.Draw(mask).polygon(poly,fill=255)
 gray=np.clip(base+noise+3*x/w-3*y/h,0,255).astype('uint8');rgb=np.repeat(gray[:,:,None],3,axis=2);photo[np.array(mask)>0]=rgb[np.array(mask)>0]
im=Image.fromarray(photo);d=ImageDraw.Draw(im)
# The visible seam is weak; the overall silhouette alone has six vertices.
d.line([lid[3],lid[2]],fill=(16,16,16),width=3);d.line([lid[2],lid[1]],fill=(45,45,45),width=2)
d.line([front[0],front[3],front[2]],fill=(10,10,10),width=3)
im.save(root/'test/fixtures/dark-box.jpg',quality=91)
im.save(root/'public/demo/darkbox.png')
(root/'test/fixtures/dark-box.json').write_text(json.dumps({'width':w,'height':h,'lid':lid},indent=2))

printed=im.copy();ImageDraw.Draw(printed).polygon([(440,250),(650,300),(560,390),(350,335)],fill=(245,245,245));printed.save(root/'test/fixtures/dark-box-printed.jpg',quality=91)
