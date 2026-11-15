"""Author-created calibration scene, not a photograph. Optional dependency: Pillow."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math,json
w,h=1200,900
points=[]
for x,y in [(-1.3,-.8),(1.3,-.8),(1.3,.8),(-1.3,.8)]:
    X=x*math.cos(.6);Z=-x*math.sin(.6);Y=y*math.cos(.4)-Z*math.sin(.4);ZZ=y*math.sin(.4)+Z*math.cos(.4)
    points.append((w/2+1100*(X*math.cos(.08)-Y*math.sin(.08))/(3.6+ZZ),h/2+1100*(X*math.sin(.08)+Y*math.cos(.08))/(3.6+ZZ)))
root=Path(__file__).resolve().parents[1]
im=Image.new('RGBA',(w,h),(238,240,234,255));shadow=Image.new('RGBA',(w,h));ImageDraw.Draw(shadow).polygon([(x+15,y+22) for x,y in points],fill=(40,45,40,65));im=Image.alpha_composite(im,shadow.filter(ImageFilter.GaussianBlur(18)))
d=ImageDraw.Draw(im);d.polygon(points,fill=(163,143,110,255));d.line(points+[points[0]],fill=(130,111,82),width=3)
im.save(root/'public/demo/plane.png')
(root/'test/fixtures/plane-corners.json').write_text(json.dumps({'width':w,'height':h,'corners':points,'aspect':2.6/1.6},indent=2))
blank=Image.new('RGB',(400,300),(240,240,234));blank.save(root/'test/fixtures/empty.png')
two=blank.copy();d=ImageDraw.Draw(two);front=[(50,50),(220,80),(220,250),(50,220)];side=[(220,80),(350,35),(350,205),(220,250)]
d.polygon(front,fill=(160,140,105));d.polygon(side,fill=(100,95,70));d.line(front+[front[0]],fill=(40,40,30),width=3);d.line(side+[side[0]],fill=(40,40,30),width=3);two.save(root/'test/fixtures/two-faces.png')
