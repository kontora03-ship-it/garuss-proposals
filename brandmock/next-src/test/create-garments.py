from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'public/demo';W,H=900,650;Y,X=np.mgrid[:H,:W]
for name in ['shirt','hoodie','polo']:
 mask=Image.new('L',(W,H));d=ImageDraw.Draw(mask)
 if name=='hoodie':
  d.polygon([(355,140),(335,100),(345,50),(390,20),(470,20),(525,55),(535,110),(515,140),(605,170),(710,510),(640,540),(585,340),(595,580),(285,580),(295,340),(240,540),(175,510),(275,170)],fill=255)
  d.ellipse((370,65,500,155),fill=0);base=[72,79,86];frame=[[325,245],[555,245],[555,420],[325,420]];angle=10
 else:
  d.polygon([(310,105),(375,80),(390,108),(450,125),(510,108),(525,80),(590,105),(730,210),(660,300),(605,262),(615,570),(285,570),(295,262),(240,300),(170,210)],fill=255)
  d.ellipse((390,65,510,125),fill=0);base=[60,99,121] if name=='shirt' else [185,178,157];frame=[[330,225],[570,225],[570,460],[330,460]];angle=0 if name=='shirt' else -12
 fold=12*np.sin(X/22+Y/210)+7*np.cos(X/47-Y/130);weave=1.5*np.sin(X*2.2)+1.5*np.sin(Y*2.1);rgb=np.clip(np.array(base)[None,None,:]+(fold+weave)[:,:,None],0,255).astype('uint8');fabric=Image.fromarray(rgb)
 if name=='polo':
  d=ImageDraw.Draw(fabric);d.polygon([(385,113),(425,147),(442,126),(450,158),(467,145),(510,113),(500,170),(450,180),(400,170)],fill=(120,115,101));d.line((450,162,450,210),fill=(100,96,86),width=3)
  for y in [173,190,205]:d.ellipse((447,y,452,y+5),fill=(222,217,204))
 if name=='hoodie':
  d=ImageDraw.Draw(fabric);d.line([(345,450),(370,420),(520,420),(545,450),(540,530),(350,530),(345,450)],fill=(48,53,60),width=3)
 mask=mask.rotate(angle,resample=Image.Resampling.BICUBIC);fabric=fabric.rotate(angle,resample=Image.Resampling.BICUBIC)
 bg=Image.new('RGB',(W,H),(238,236,230));shadow=Image.new('RGBA',(W,H));shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(8)).point(lambda x:int(x*.16)));bg.paste(shadow,(5,9),shadow);bg.paste(fabric,mask=mask);ImageDraw.Draw(bg).text((20,625),'SYNTHETIC GARMENT / BRANDMOCK LAB',fill=(115,116,112));bg.save(out/(name+'.png'))
 a=-angle*np.pi/180;rot=lambda p:[450+(p[0]-450)*np.cos(a)-(p[1]-325)*np.sin(a),325+(p[0]-450)*np.sin(a)+(p[1]-325)*np.cos(a)]
 (out/(name+'.json')).write_text(json.dumps({'surface_model':'fabric','fabric_strength':.3,'corners':[rot(p) for p in frame],'scale':.65}))
