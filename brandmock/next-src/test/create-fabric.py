from PIL import Image, ImageDraw, ImageFilter
import numpy as np, json
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'public/demo'
W,H=900,650
Y,X=np.mgrid[:H,:W]
for name in ['shirt','towel']:
    mask=Image.new('L',(W,H));d=ImageDraw.Draw(mask)
    if name=='shirt':
        d.polygon([(310,105),(375,80),(390,108),(450,125),(510,108),(525,80),(590,105),(730,210),(660,300),(605,262),(615,570),(285,570),(295,262),(240,300),(170,210)],fill=255)
        d.ellipse((390,65,510,125),fill=0)
        frame=[[330,225],[570,225],[570,460],[330,460]]
        base=np.array([60,99,121]);fold=12*np.sin(X/22+Y/210)+7*np.cos(X/47-Y/130)
    else:
        d.polygon([(180,130),(735,160),(705,550),(145,510)],fill=255)
        frame=[[240,205],[660,228],[638,470],[215,442]]
        base=np.array([177,138,103]);fold=13*np.sin(X/34+Y/160)+6*np.cos(X/17+Y/115)
    weave=2*np.sin(X*2.2)+2*np.sin(Y*2.1)
    rgb=np.clip(base[None,None,:]+(fold+weave)[:,:,None],0,255).astype('uint8')
    bg=Image.new('RGB',(W,H),(238,236,230)); shadow=Image.new('RGBA',(W,H));shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(12)).point(lambda x:int(x*.2)))
    bg.paste(shadow,(7,13),shadow);bg.paste(Image.fromarray(rgb),mask=mask)
    dr=ImageDraw.Draw(bg);dr.text((22,620),'SYNTHETIC FABRIC TEST / BRANDMOCK LAB',fill=(115,116,112))
    bg.save(out/(name+'.png'))
    (out/(name+'.json')).write_text(json.dumps({'surface_model':'fabric','fabric_strength':.3,'corners':frame,'scale':.65}))
