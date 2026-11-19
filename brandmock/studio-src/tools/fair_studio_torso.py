"""Implicit depth fairing across a complete torso panel and its hem.
No polynomial target or local lower cutoff: the hem participates in the same solve.
"""
import numpy as np

def fair_panel(bm,panel_materials,hem_materials,strength=450.,sign=1):
 bm.verts.ensure_lookup_table();bm.verts.index_update()
 candidates=[]
 for v in bm.verts:
  mats={f.material_index for f in v.link_faces}
  panel_body=bool(mats&panel_materials)and mats<=panel_materials|hem_materials
  panel_hem=bool(mats)and mats<=hem_materials and v.co.z<-.60 and sign*v.co.y>.025
  if (panel_body or panel_hem)and v.co.z<.68:candidates.append(v)
 idx={v:i for i,v in enumerate(candidates)};n=len(candidates);assert n>1000
 rows=[];cols=[];fixed=np.zeros(n);degree=np.zeros(n)
 for v,i in idx.items():
  for e in v.link_edges:
   neighbor=e.other_vert(v);degree[i]+=1
   if neighbor in idx:rows.append(i);cols.append(idx[neighbor])
   else:fixed[i]+=neighbor.co.y
 rows=np.array(rows,dtype=np.int32);cols=np.array(cols,dtype=np.int32)
 old=np.array([v.co.y for v in candidates]);height=np.array([v.co.z for v in candidates])
 t=np.clip((height-.28)/(.68-.28),0,1);fade=1-t*t*(3-2*t);mass=1/np.maximum(fade*fade,1e-5)
 diagonal=mass+strength*degree;rhs=mass*old+strength*fixed
 def multiply(x):return diagonal*x-strength*np.bincount(rows,weights=x[cols],minlength=n)
 result=old.copy();r=rhs-multiply(result);z=r/diagonal;p=z.copy();rz=np.dot(r,z);initial=np.linalg.norm(r)
 for iteration in range(3000):
  ap=multiply(p);alpha=rz/np.dot(p,ap);result+=alpha*p;r-=alpha*ap
  if np.linalg.norm(r)<max(1e-8,initial*1e-9):break
  z=r/diagonal;new_rz=np.dot(r,z);p=z+(new_rz/rz)*p;rz=new_rz
 assert np.all(np.isfinite(result))and np.linalg.norm(r)<max(1e-8,initial*1e-8)
 for v,value in zip(candidates,result):v.co.y=float(value)
 info={'method':'implicit depth fairing over complete torso panel and hem','panel':'back'if sign>0 else'front','strength':strength,'vertices':n,'iterations':iteration+1,'maxDepthChange':float(np.max(np.abs(result-old))),'hemIncluded':True,'upperFade':[.28,.68]}
 print('TORSO_SURFACE_FAIRING',info,flush=True);return info

def level_hem(bm,torso_materials,hem_materials):
 """Lower the raised side cuts to one hem plane with a harmonic cloth extension."""
 bm.verts.ensure_lookup_table();bm.verts.index_update()
 rim={v for e in bm.edges if e.is_boundary and all(v.co.z<-.40 and abs(v.co.x)<.70 for v in e.verts)for v in e.verts}
 assert len(rim)>300,'Expected the complete open lower torso rim'
 target=min(v.co.z for v in rim);known={v:target-v.co.z for v in rim}
 allowed=torso_materials|hem_materials
 unknown=[v for v in bm.verts if v not in rim and v.link_faces and {f.material_index for f in v.link_faces}<=allowed and v.co.z<.35]
 idx={v:i for i,v in enumerate(unknown)};n=len(unknown);rows=[];cols=[];degree=np.zeros(n);rhs=np.zeros(n)
 for v,i in idx.items():
  for e in v.link_edges:
   neighbor=e.other_vert(v);degree[i]+=1
   if neighbor in idx:rows.append(i);cols.append(idx[neighbor])
   else:rhs[i]+=known.get(neighbor,0.)
 rows=np.array(rows,dtype=np.int32);cols=np.array(cols,dtype=np.int32)
 def multiply(x):return degree*x-np.bincount(rows,weights=x[cols],minlength=n)
 result=np.zeros(n);r=rhs.copy();z=r/degree;p=z.copy();rz=np.dot(r,z);initial=np.linalg.norm(r)
 for iteration in range(3000):
  ap=multiply(p);alpha=rz/np.dot(p,ap);result+=alpha*p;r-=alpha*ap
  if np.linalg.norm(r)<max(1e-9,initial*1e-10):break
  z=r/degree;new_rz=np.dot(r,z);p=z+(new_rz/rz)*p;rz=new_rz
 assert np.all(np.isfinite(result))and np.linalg.norm(r)<initial*1e-8
 changes=[]
 for v,value in zip(unknown,result):
  t=float(np.clip((v.co.z-.05)/.30,0,1));fade=1-t*t*(3-2*t);delta=float(value)*fade;v.co.z+=delta;changes.append(abs(delta))
 for v in rim:v.co.z=target
 info={'method':'harmonic height extension to a level lower rim','rimVertices':len(rim),'targetHeight':target,'maxHeightChange':max(max(changes),max(abs(x)for x in known.values())),'upperFade':[.05,.35],'iterations':iteration+1}
 print('LEVEL_LOWER_HEM',info,flush=True);return info
