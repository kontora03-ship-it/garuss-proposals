from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend.engine import *
from backend.main import Settings
from backend.storage import ProjectStorage
root=Path(__file__).parent; out=root/'results'; out.mkdir(exist_ok=True)
logo=LogoLoader.load((root/'logo.svg').read_bytes())
for name,corners,ratio in [('bag',[[277,877],[896,850],[922,1476],[273,1484]],(600,620)),('notebook',[[181,752],[667,525],[1010,1180],[408,1464]],(500,800))]:
    pb=(root/'real'/f'{name}.jpg').read_bytes();photo=ImageLoader.load(pb)
    for mode in ['print','silver','gold','blind']:
        s=Settings(corners=corners,surface_width=ratio[0],surface_height=ratio[1],method=mode,color='#c4cbd2' if mode=='silver' else '#d4ad54',intensity=.55,scale=.67).model_dump()
        result=PreviewRenderer.render(photo,logo,s);(out/f'{name}-{mode}.png').write_bytes(ExportService.png(result))
        if name=='bag' and mode=='gold':
            (out/'before-after.png').write_bytes(ExportService.png(np.concatenate([photo,result],axis=1)))
            store=ProjectStorage(root.parent/'projects');id=store.create(pb,(root/'logo.svg').read_bytes(),s);(out/'example-project.zip').write_bytes(store.archive(id))
