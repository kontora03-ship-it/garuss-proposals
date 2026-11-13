import io,json,zipfile
from pathlib import Path
import numpy as np, cv2, pytest
from PIL import Image,ImageDraw
from fastapi.testclient import TestClient
from backend.engine import *
from backend.main import app,Settings
ROOT=Path(__file__).resolve().parents[1]
@pytest.fixture
def assets():
    photo=np.full((300,400,4),[170,150,120,255],np.uint8)
    logo=np.zeros((40,80,4),np.uint8);logo[5:35,5:75]=[240,35,65,255];logo[12:28,25:55]=0
    s=Settings(corners=[[50,50],[350,50],[350,250],[50,250]],surface_width=300,surface_height=200,scale=.8,intensity=0).model_dump()
    return photo,logo,s

def test_proportions(assets):
    p,l,s=assets; a=GeometryEngine.warp(l,p.shape,s)[:,:,3];y,x=np.where(a>.99)
    assert abs((x.max()-x.min()+1)/(y.max()-y.min()+1)-70/30)<.04
@pytest.mark.parametrize('mode',['print','silver','gold','blind'])
def test_unchanged_outside_and_determinism(assets,mode):
    p,l,s=assets;s['method']=mode;a=GeometryEngine.warp(l,p.shape,s)[:,:,3];out=PreviewRenderer.render(p,l,s)
    assert np.array_equal(out[a==0],p[a==0]);assert np.array_equal(out,PreviewRenderer.render(p,l,s))
def test_transparency_and_holes(assets):
    p,l,s=assets;s['opacity']=.5;out=PreviewRenderer.render(p,l,s)
    assert np.array_equal(out[150,200],p[150,200])
    assert np.max(out[:,:,:3])<240
    p[:,:,3]=0;out=PreviewRenderer.render(p,l,s);assert out[:,:,3].max() in (127,128)
def test_perspective(assets):
    p,l,s=assets;s.update(corners=[[60,50],[330,75],[360,230],[40,260]],scale=1)
    solid=np.ones((200,300,4),np.uint8)*255;a=GeometryEngine.warp(solid,p.shape,s)[:,:,3]
    assert a[150,200]>.9;assert a[30,30]==0;assert a[240,50]>0
@pytest.mark.parametrize('corners',[[[0,0]]*4,[[10,10],[300,250],[300,10],[10,250]],[[-1,0],[10,0],[10,10],[0,10]],[[0,0],[1,0],[1,1],[0,1]]])
def test_invalid_quads(assets,corners):
    p,l,s=assets;s['corners']=corners
    with pytest.raises(ValueError): GeometryEngine.warp(l,p.shape,s)
def test_thin_lines(assets):
    p,l,s=assets;l=np.zeros((100,100,4),np.uint8);l[:,50]=255
    out=GeometryEngine.warp(l,p.shape,s);assert (out[:,:,3]>0).sum()>100

def test_small_text():
    l=LogoLoader.load((ROOT/'demo/logo.svg').read_bytes());assert (l[int(l.shape[0]*.85):,:,3]>0).sum()>200
@pytest.mark.parametrize('payload',[b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',b'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.test/a"/></svg>',b'<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://evil.test/a)"/></svg>'])
def test_svg_safety(payload):
    with pytest.raises(ValueError):LogoLoader.load(payload)

def test_export_upload_restore(tmp_path,monkeypatch):
    import backend.main as main
    from backend.storage import ProjectStorage
    monkeypatch.setattr(main,'store',ProjectStorage(tmp_path));c=TestClient(app)
    pb=(ROOT/'demo/box.png').read_bytes();lb=(ROOT/'demo/logo.svg').read_bytes()
    r=c.post('/api/projects',files={'photo':('test.png',pb),'logo':('logo.svg',lb)});assert r.status_code==200;r=r.json();id=r['id']
    s=r['settings'];s['method']='gold';assert c.put('/api/projects/'+id,json=s).status_code==200
    png=c.get(f'/api/projects/{id}/export').content;im=Image.open(io.BytesIO(png));assert im.size==(960,720) and im.mode=='RGBA'
    archive=c.get(f'/api/projects/{id}/archive').content
    with zipfile.ZipFile(io.BytesIO(archive)) as z: assert z.read('photo.original')==pb and z.read('logo.original')==lb
    restored=c.post('/api/restore',files={'project':('project.zip',archive)});assert restored.status_code==200
    assert c.get('/api/projects/'+restored.json()['id']+'/export').content==png
    compare=Image.open(io.BytesIO(c.get(f'/api/projects/{id}/export?compare=true').content));assert compare.size==(1920,720)

def test_premultiplied_no_dark_fringe(assets):
    p,l,s=assets;l=np.zeros((30,60,4),np.uint8);l[3:27,3:57]=[255,255,255,255];s['rotation']=17
    a=GeometryEngine.warp(l,p.shape,s);edge=(a[:,:,3]>.05)&(a[:,:,3]<.95)
    assert edge.any();assert np.allclose(a[edge,:3]/a[edge,3:4],1,atol=1e-5)

def test_zero_opacity_is_exact(assets):
    p,l,s=assets;s['opacity']=0;assert np.array_equal(p,PreviewRenderer.render(p,l,s))

def test_bad_upload_returns_client_error():
    c=TestClient(app);r=c.post('/api/projects',files={'photo':('bad.png',b'not an image'),'logo':('logo.svg',(ROOT/'demo/logo.svg').read_bytes())});assert r.status_code==400

def test_missing_original_is_reported(tmp_path):
    from backend.storage import ProjectStorage
    store=ProjectStorage(tmp_path);id=store.create(b'photo',b'logo',{})
    (store.path(id)/'photo.original').unlink()
    with pytest.raises(ValueError,match='Отсутствуют'):store.read(id)


def test_online_mask_project_not_silently_imported():
    c=TestClient(app);b=io.BytesIO()
    with zipfile.ZipFile(b,'w') as z:
        z.writestr('photo.original',(ROOT/'demo/box.png').read_bytes())
        z.writestr('logo.original',(ROOT/'demo/logo.svg').read_bytes())
        z.writestr('project.json',json.dumps({'version':2,'settings':{}}))
    r=c.post('/api/restore',files={'project':('online.zip',b.getvalue())})
    assert r.status_code==400 and 'онлайн' in r.json()['detail']
