"""Adapt a CC BY sewn-panel hoodie to BrandMock, retaining the artist's pattern UVs.
Source: Hoodie by ShoyoX; prepared mesh distribution: omikhan4901/teestudio.
No third-party code is used. No mannequin, rig or protected reference-store asset.
"""
import bpy,sys,os,json,math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE=os.path.join(ROOT,'sources/vendor/hoodie-shoyox-ccby.glb');OUT=os.path.join(ROOT,'public/models')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)
expected={'front','back','leftSleeve','rightSleeve','trims'}
objects={o.name:o for o in bpy.context.scene.objects if o.type=='MESH'}
assert set(objects)==expected,(set(objects),expected)
assert not any(o.type=='ARMATURE' for o in bpy.context.scene.objects)
# The source uses centimetres. World units here match our existing prepared garments.
SCALE=.02;CY=132.5;zone_materials={};zone_meta={};source_uv={};arrays={}
def material(name):
 m=bpy.data.materials.new(name);m.diffuse_color=(.034,.048,.065,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.034,.048,.065,1);p.inputs['Roughness'].default_value=1;p.inputs['Specular IOR Level'].default_value=.12;return m
for name in expected:zone_materials[name]=material({'front':'Print_Front','back':'Print_Back','leftSleeve':'Print_LeftSleeve','rightSleeve':'Print_RightSleeve','trims':'Fabric'}[name])
for name,obj in objects.items():
 mesh=obj.data;original=np.array([tuple(loop.uv) for loop in mesh.uv_layers.active.data]);source_uv[name]=original.copy()
 # Work in source design coordinates (x, height, front). Blender imports glTF Y-up as Z-up.
 positions=np.array([(v.co.x,v.co.z,-v.co.y) for v in mesh.vertices]);arrays[name]=positions.copy()
 for v,(x,y,z) in zip(mesh.vertices,positions):
  # Relaxed hanging sleeves: preserve every shoulder boundary, gently turn distal cloth down.
  sign=1 if x>=0 else -1;out=abs(x);t=max(0,min(1,(out-28)/16));t=t*t*(3-2*t);a=-math.radians(24)*t;dx=out-26;dy=y-145;px=26+dx*math.cos(a)-dy*math.sin(a);py=145+dx*math.sin(a)+dy*math.cos(a)
  if out>28:x=sign*px;y=py
  v.co=(x*SCALE,-z*SCALE,(y-CY)*SCALE)
 mesh.update();mesh.materials.clear();mesh.materials.append(zone_materials[name]);obj.name='Hoodie_'+name
 if name=='trims':continue
 uv_vertex=np.zeros((len(mesh.vertices),2));counts=np.zeros(len(mesh.vertices))
 for loop,uv in zip(mesh.loops,original):uv_vertex[loop.vertex_index]+=uv;counts[loop.vertex_index]+=1
 uv_vertex/=np.maximum(1,counts[:,None]);xyz=positions
 if name=='front':target=xyz[:,:2]
 elif name=='back':target=np.stack((-xyz[:,0],xyz[:,1]),axis=1)
 else:
  sign=1 if name=='leftSleeve' else -1;axis=np.array([sign*.61,-.79,0]);target=np.stack((xyz[:,2]*2,-xyz@axis),axis=1)
 u=uv_vertex-uv_vertex.mean(axis=0);x=target-target.mean(axis=0);left,_,right=np.linalg.svd(u.T@x);rotation=left@right
 # Uniform scale and orthogonal orientation retain the exact flat-pattern aspect ratio.
 pattern=(original-uv_vertex.mean(axis=0))@rotation*2
 lo=pattern.min(axis=0);hi=pattern.max(axis=0);extent=hi-lo;assert min(extent)>.1 and max(extent)<3.5
 normalized=(pattern-lo)/extent
 mesh.uv_layers.active.data.foreach_set('uv',normalized.astype(np.float32).ravel())
 zone_meta[name]={'width':float(extent[0]),'height':float(extent[1]),'printWidth':float(min(extent[0],1.06) if name in ['front','back'] else .27),'wrap':False,'defaultX':.5,'defaultY':.34 if name=='front' else .38}
 # Keep the untouched source pattern as a second UV set for inspection and future PBR maps.
 original_layer=mesh.uv_layers.new(name='OriginalPattern');original_layer.data.foreach_set('uv',original.astype(np.float32).ravel());mesh.uv_layers.active_index=0
 mesh.uv_layers[0].active_render=True
 # Numeric check: normalisation must not introduce any anisotropic distortion into the pattern.
 restored=normalized*extent+lo;assert np.max(np.abs(restored-pattern))<1e-10
 print('PATTERN_PRESERVED',name,extent.tolist(),flush=True)
# Calibrate sleeve defaults on a visible front/outside patch, without changing their UV.
for name in ['leftSleeve','rightSleeve']:
 mesh=objects[name].data;mesh.update();sign=1 if name=='leftSleeve' else -1;view=Vector((sign*1.25,-1.15,.32)).normalized();candidates=[]
 for poly in mesh.polygons:
  uv=sum((mesh.uv_layers[0].data[i].uv for i in poly.loop_indices),Vector((0,0)))/len(poly.loop_indices)
  if abs(uv.y-.62)<.06 and .12<uv.x<.88:candidates.append((poly.normal.dot(view),poly,uv))
 score,poly,uv=max(candidates,key=lambda x:x[0]);assert score>.35
 # Make positive U read to the viewer's right at the recommended patch.
 loops=poly.loop_indices[:3];pts=[mesh.vertices[mesh.loops[i].vertex_index].co for i in loops];uvs=[mesh.uv_layers[0].data[i].uv.copy() for i in loops];d1=uvs[1]-uvs[0];d2=uvs[2]-uvs[0];det=d1.x*d2.y-d2.x*d1.y
 du=((pts[1]-pts[0])*d2.y-(pts[2]-pts[0])*d1.y)/det;screen_right=Vector((1.15,sign*1.25,0))
 if du.dot(screen_right)<0:
  for loop in mesh.uv_layers[0].data:loop.uv.x=1-loop.uv.x
  uv.x=1-uv.x
 zone_meta[name]['defaultX']=round(float(uv.x),5);zone_meta[name]['defaultY']=round(1-float(uv.y),5)
 print('SLEEVE_DEFAULT',name,zone_meta[name],flush=True)
# Non-printable hood, hems and pocket retain the full authored geometry.
# Their original physical pattern is used for the fine fabric maps.
trim=objects['trims'];trim.data.uv_layers.active.data.foreach_set('uv',(source_uv['trims']*2).astype(np.float32).ravel())
for obj in objects.values():
 for p in obj.data.polygons:p.use_smooth=True
# The pocket is a separate authored panel: project the front print UV onto it,
# retaining every vertex of the vendor mesh and keeping the logo visible on the pocket.
front_mesh=objects['front'].data;front_mesh.calc_loop_triangles();bpy.context.view_layer.update();tree=BVHTree.FromObject(objects['front'],bpy.context.evaluated_depsgraph_get());trim_mesh=trim.data
adj=[set() for _ in trim_mesh.vertices]
for edge in trim_mesh.edges:a,b=edge.vertices;adj[a].add(b);adj[b].add(a)
seen=set();pocket_vertices=set();rib_components=[]
for vertex in trim_mesh.vertices:
 if vertex.index in seen:continue
 stack=[vertex.index];seen.add(vertex.index);ids=[]
 while stack:
  index=stack.pop();ids.append(index)
  for other in adj[index]:
   if other not in seen:seen.add(other);stack.append(other)
 if len(ids)<80:continue
 xyz=arrays['trims'][ids];lo=xyz.min(axis=0);hi=xyz.max(axis=0)
 if hi[0]-lo[0]>18 and hi[1]-lo[1]>12 and lo[1]>98 and hi[1]<143 and xyz[:,2].mean()>6:pocket_vertices.update(ids)
 if (abs(xyz[:,0].mean())>42 and hi[1]<134) or (hi[0]-lo[0]>30 and hi[1]-lo[1]<10 and hi[1]<110):rib_components.append((ids,abs(xyz[:,0].mean())>42))
trim_mesh.materials.append(zone_materials['front'])
for poly in trim_mesh.polygons:
 if not all(i in pocket_vertices for i in poly.vertices):continue
 poly.material_index=1
 for loop_index in poly.loop_indices:
  point=trim_mesh.vertices[trim_mesh.loops[loop_index].vertex_index].co;loc,_,index,_=tree.find_nearest(point);face=front_mesh.polygons[index];a,b,c=[front_mesh.vertices[i].co for i in face.vertices[:3]];ab=b-a;ac=c-a;ap=loc-a;d00=ab.dot(ab);d01=ab.dot(ac);d11=ac.dot(ac);den=d00*d11-d01*d01;assert abs(den)>1e-18;v=(d11*ap.dot(ab)-d01*ap.dot(ac))/den;w=(d00*ap.dot(ac)-d01*ap.dot(ab))/den;uv=Vector((0,0))
  for index,weight in zip(face.loop_indices,(1-v-w,v,w)):uv+=front_mesh.uv_layers[0].data[index].uv*weight
  trim_mesh.uv_layers[0].data[loop_index].uv=uv
# Retain the authored cuff/hem shapes, adding a correctly aligned rib-knit material.
rib=material('Ribbing');trim_mesh.materials.append(rib);rib_ids=set();rib_uv={}
for ids,is_cuff in rib_components:
 points=np.array([tuple(trim_mesh.vertices[i].co) for i in ids]);center=Vector(points.mean(axis=0))
 if is_cuff:
  sleeve=objects['leftSleeve' if center.x>0 else 'rightSleeve'].data;pp=np.array([tuple(v.co) for v in sleeve.vertices]);_,vectors=np.linalg.eigh(np.cov(pp.T));axis=Vector(vectors[:,-1]);axis*=1 if axis.z<0 else -1
 else:axis=Vector((0,0,1))
 uaxis=axis.cross(Vector((0,1,0))).normalized();vaxis=axis.cross(uaxis);along=[(Vector(p)-center).dot(axis) for p in points];lo=min(along);height=max(along)-lo
 if height<1e-5:continue
 for i,p,t in zip(ids,points,along):
  q=Vector(p)-center;u=(math.atan2(q.dot(vaxis),q.dot(uaxis))/(2*math.pi))%1;rib_uv[i]=(u if is_cuff else u*6,(t-lo)/height);rib_ids.add(i)
for face in trim_mesh.polygons:
 if not all(i in rib_ids for i in face.vertices):continue
 face.material_index=2;values=[rib_uv[i][0] for i in face.vertices];period=1 if max(values)-min(values)<1.1 else 6
 # Unwrap the seam per triangle so the knit does not stretch across the angular cut.
 if max(values)-min(values)>period*.5:values=[v+period if v<period*.5 else v for v in values]
 for loop,u in zip(face.loop_indices,values):trim_mesh.uv_layers[0].data[loop].uv=(u,rib_uv[trim_mesh.loops[loop].vertex_index][1])
print('RIB_KNIT_VERTICES',len(rib_ids),flush=True)
print('POCKET_PRINT_VERTICES',len(pocket_vertices),flush=True)
assert len(pocket_vertices)>100,'Expected a distinct authored front pocket'
# Source mesh is already pattern-separated and has no skin or avatar context.
credit={'title':'Hoodie','author':'ShoyoX','url':'https://sketchfab.com/3d-models/hoodie-2c674228f1e946b5b8f508f8f818e130','license':'CC BY 4.0','adaptation':'Prepared mesh distributed by omikhan4901/teestudio; BrandMock: sleeve pose, uniform UV orientation, print materials and metric metadata.'}
meta={'id':'hoodie-boxy','revision':4,'panelWidth':zone_meta['front']['width'],'panelHeight':zone_meta['front']['height'],'bodyWidth':1.06,'height':1.8,'defaultLogoWidth':.32,'zones':zone_meta,'credit':credit,'source':'Licensed authored garment; original sewing-pattern UVs retained without anisotropic rescaling.'}
os.makedirs(OUT,exist_ok=True);bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=objects['front'];bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'sources/hoodie-boxy.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'hoodie-boxy.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_texcoords=True,export_normals=True,export_copyright='Hoodie by ShoyoX, CC BY 4.0. Prepared by teestudio; adapted by BrandMock. See model JSON and PROVENANCE.md.')
with open(os.path.join(OUT,'hoodie-boxy.json'),'w') as f:json.dump(meta,f,indent=2)
print('LICENSED_HOODIE_READY',flush=True)
