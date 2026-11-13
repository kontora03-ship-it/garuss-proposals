import json, uuid, zipfile, io
from pathlib import Path
class ProjectStorage:
    def __init__(self,root): self.root=Path(root); self.root.mkdir(exist_ok=True)
    def path(self,id):
        if not isinstance(id,str) or not __import__('re').fullmatch(r'[a-f0-9]{32}',id): raise ValueError('Некорректный ID проекта')
        p=self.root/id
        if not p.is_dir(): raise ValueError('Проект не найден')
        return p
    def create(self,photo,logo,settings):
        id=uuid.uuid4().hex; p=self.root/id; p.mkdir(); (p/'photo.original').write_bytes(photo); (p/'logo.original').write_bytes(logo); self.save(id,settings); return id
    def save(self,id,settings):
        p=self.path(id); temp=p/'project.tmp'; temp.write_text(json.dumps({'version':1,'settings':settings},ensure_ascii=False,indent=2),encoding='utf-8'); temp.replace(p/'project.json')
    def read(self,id):
        p=self.path(id)
        if not all((p/n).is_file() for n in ('photo.original','logo.original','project.json')): raise ValueError('Отсутствуют исходники или JSON проекта')
        return (p/'photo.original').read_bytes(),(p/'logo.original').read_bytes(),json.loads((p/'project.json').read_text(encoding='utf-8'))['settings']
    def archive(self,id):
        p=self.path(id); b=io.BytesIO()
        with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
            for n in ('photo.original','logo.original','project.json'): z.write(p/n,n)
        return b.getvalue()
    def restore(self,data):
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            names=('photo.original','logo.original','project.json')
            if set(z.namelist())!=set(names) or sum(i.file_size for i in z.infolist())>45_000_000: raise ValueError('Некорректный архив')
            return [z.read(n) for n in names]
