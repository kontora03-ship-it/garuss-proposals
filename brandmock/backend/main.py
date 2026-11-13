import json
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from PIL import UnidentifiedImageError
from defusedxml.common import DefusedXmlException
from xml.etree.ElementTree import ParseError
import zipfile
from .engine import *
from .storage import ProjectStorage
ROOT=Path(__file__).resolve().parent.parent
app=FastAPI(title='BrandMock'); store=ProjectStorage(ROOT/'projects')
class Settings(BaseModel):
    corners:list[list[float]]
    surface_width:float=Field(400,ge=1,le=10000)
    surface_height:float=Field(250,ge=1,le=10000)
    scale:float=Field(.65,ge=.01,le=2)
    x:float=Field(.5,ge=0,le=1)
    y:float=Field(.5,ge=0,le=1)
    rotation:float=Field(0,ge=-180,le=180)
    opacity:float=Field(1,ge=0,le=1)
    intensity:float=Field(.5,ge=0,le=1)
    light:float=Field(135,ge=0,le=360)
    method:str=Field('print',pattern='^(print|silver|gold|blind)$')
    color:str=Field('#d4ad54',pattern='^#[0-9a-fA-F]{6}$')
    product:str='Упаковка'
@app.exception_handler(UnidentifiedImageError)
@app.exception_handler(DefusedXmlException)
@app.exception_handler(ParseError)
@app.exception_handler(zipfile.BadZipFile)
@app.exception_handler(ValueError)
async def bad(request,exc):
    from fastapi.responses import JSONResponse
    return JSONResponse({'detail':str(exc)},status_code=400)
async def limited(f):
    data=await f.read(20_000_001)
    if len(data)>20_000_000: raise ValueError('Файл больше 20 МБ')
    return data
@app.post('/api/projects')
async def create(photo:UploadFile=File(...),logo:UploadFile=File(...)):
    pb,lb=await limited(photo),await limited(logo); im=ImageLoader.load(pb); LogoLoader.load(lb); h,w=im.shape[:2]
    s=Settings(corners=[[w*.2,h*.2],[w*.8,h*.2],[w*.8,h*.8],[w*.2,h*.8]]).model_dump(); id=store.create(pb,lb,s); return info(id)
def info(id):
    pb,lb,s=store.read(id); h,w=ImageLoader.load(pb).shape[:2]; return {'id':id,'width':w,'height':h,'settings':s}
@app.get('/api/projects/{id}')
def get(id:str): return info(id)
@app.put('/api/projects/{id}')
def save(id:str,s:Settings):
    pb,lb,_=store.read(id); PreviewRenderer.render(ImageLoader.load(pb),LogoLoader.load(lb),s.model_dump()); store.save(id,s.model_dump()); return info(id)
@app.get('/api/projects/{id}/original')
def original(id:str): return Response(ExportService.png(ImageLoader.load(store.read(id)[0])),media_type='image/png')
@app.post('/api/projects/{id}/render')
def render(id:str,s:Settings):
    pb,lb,_=store.read(id); return Response(ExportService.png(PreviewRenderer.render(ImageLoader.load(pb),LogoLoader.load(lb),s.model_dump())),media_type='image/png')
@app.get('/api/projects/{id}/export')
def export(id:str,compare:bool=False):
    pb,lb,s=store.read(id); photo=ImageLoader.load(pb); out=PreviewRenderer.render(photo,LogoLoader.load(lb),s)
    if compare: out=np.concatenate([photo,out],axis=1)
    return Response(ExportService.png(out),media_type='image/png',headers={'Content-Disposition':'attachment; filename="brandmock.png"'})
@app.get('/api/projects/{id}/archive')
def archive(id:str): return Response(store.archive(id),media_type='application/zip',headers={'Content-Disposition':'attachment; filename="brandmock-project.zip"'})
@app.post('/api/restore')
async def restore(project:UploadFile=File(...)):
    pb,lb,j=store.restore(await limited(project)); document=json.loads(j)
    if document.get('version')!=1: raise ValueError('Этот проект использует онлайн-редактор маски. Откройте его в онлайн-версии BrandMock.')
    s=Settings(**document['settings']).model_dump(); PreviewRenderer.render(ImageLoader.load(pb),LogoLoader.load(lb),s); return info(store.create(pb,lb,s))
@app.post('/api/demo/{name}')
def demo(name:str):
    if name not in ('box','notebook','card'): raise ValueError('Нет примера')
    pb=(ROOT/'demo'/f'{name}.png').read_bytes(); lb=(ROOT/'demo/logo.svg').read_bytes(); id=store.create(pb,lb,Settings(corners=[[240,210],[720,240],[700,510],[220,480]]).model_dump()); return info(id)
@app.get('/api/download-source')
def source():
    return FileResponse(ROOT/'output/BrandMock-MVP-0.1.zip',filename='BrandMock-MVP-0.1.zip')
if (ROOT/'frontend/dist').exists(): app.mount('/',StaticFiles(directory=ROOT/'frontend/dist',html=True),name='frontend')
