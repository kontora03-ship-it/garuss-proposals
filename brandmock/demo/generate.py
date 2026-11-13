from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import numpy as np
root=Path(__file__).parent
for name,color in [('box',(179,151,112)),('notebook',(67,87,78)),('card',(230,223,203))]:
    y,x=np.indices((720,960)); rng=np.random.default_rng(42); grain=rng.normal(0,.8,(720,960)); bg=np.clip(235+9*(x/960-y/720)+grain,0,255).astype('uint8'); im=Image.fromarray(np.stack([bg,bg,np.maximum(bg.astype(int)-5,0).astype('uint8')],2),'RGB'); shadow=Image.new('RGBA',im.size); d=ImageDraw.Draw(shadow); d.polygon([(185,195),(760,220),(740,555),(170,525)],fill=(40,35,20,60));im=Image.alpha_composite(im.convert('RGBA'),shadow.filter(ImageFilter.GaussianBlur(19)))
    d=ImageDraw.Draw(im);d.polygon([(200,155),(766,190),(737,562),(170,525)],fill=tuple(int(c*.78) for c in color));d.polygon([(200,145),(775,180),(747,540),(175,505)],fill=color);d.line([(200,145),(775,180),(747,540)],fill=tuple(min(255,c+20) for c in color),width=2)
    if name=='box': d.line([(185,493),(745,528)],fill=(146,118,83),width=2)
    if name=='notebook':
        for i in range(12): d.ellipse((186-i*.9,167+i*26,201-i*.9,175+i*26),fill=(35,41,35))
    im.save(root/f'{name}.png')
(root/'logo.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="500" height="220" viewBox="0 0 500 220"><g fill="#244d3c"><path d="M250 5l13 31 34-6-19 28 19 28-34-6-13 31-13-31-34 6 19-28-19-28 34 6z"/><text x="250" y="170" text-anchor="middle" font-family="DejaVu Sans" font-size="54" letter-spacing="8">FORME</text><text x="250" y="205" text-anchor="middle" font-family="DejaVu Sans" font-size="13" letter-spacing="6">OBJECTS WITH PURPOSE</text></g></svg>''')
