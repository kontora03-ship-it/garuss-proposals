"""Prepare user-supplied BrockCreative Blender garments; keep artist sewing UV proportions.
Run Blender with --disable-autoexec. Source archives stay outside the published site.
"""
import bpy,sys,os,json,math
import numpy as np
from collections import defaultdict
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));kind=sys.argv[sys.argv.index('--')+1];tee=kind=='tee-regular';out=os.path.join(root,'public/models');bpy.context.preferences.filepaths.save_version=0
bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];worlds={o.name:np.array([tuple(o.matrix_world@v.co)for v in o.data.vertices])for o in meshes};main=max(meshes,key=lambda o:len(o.data.polygons));world=np.array([tuple(main.matrix_world@v.co)for v in main.data.vertices]);lo=world.min(0);hi=world.max(0);center=(lo+hi)/2;scale=1.8/(hi[2]-lo[2]);meta_zones={};front_pattern=None
names={'front':'Print_Front','back':'Print_Back','leftSleeve':'Print_LeftSleeve','rightSleeve':'Print_RightSleeve'}
def mat(name):
 m=bpy.data.materials.new(name);m.diffuse_color=(.09,.15,.19,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*m.diffuse_color[:3],1);p.inputs['Roughness'].default_value=.95;return m
materials={z:mat(n)for z,n in names.items()};fabric=mat('Fabric');rib=mat('Ribbing');cord=mat('Drawstrings')
for o in meshes:
 mesh=o.data;normal_matrix=o.matrix_world.to_3x3().inverted().transposed();saved_normals=[tuple((normal_matrix@n.vector).normalized())for n in mesh.corner_normals];xyz=worlds[o.name];source=np.array([tuple(l.uv)for l in mesh.uv_layers.active.data]);parents=list(range(len(mesh.polygons)));edges={}
 def find(x):
  while parents[x]!=x:parents[x]=parents[parents[x]];x=parents[x]
  return x
 for p in mesh.polygons:
  loops=list(p.loop_indices)
  for a,b in zip(loops,loops[1:]+loops[:1]):
   va,vb=mesh.loops[a].vertex_index,mesh.loops[b].vertex_index;ua,ub=source[a],source[b]
   if va>vb:va,vb=vb,va;ua,ub=ub,ua
   key=(va,vb,*np.round(ua,5),*np.round(ub,5))
   if key in edges:parents[find(p.index)]=find(edges[key])
   else:edges[key]=p.index
 groups=defaultdict(list)
 for p in mesh.polygons:groups[find(p.index)].append(p.index)
 islands=sorted(groups.values(),key=len,reverse=True);zone_ids={}
 if o==main:
  bodies=sorted(islands[:2],key=lambda ids:np.mean([xyz[v,1]for i in ids for v in mesh.polygons[i].vertices]));zone_ids={bodies[0][0]:'front',bodies[1][0]:'back'}
  for ids in islands[2:4]:zone_ids[ids[0]]='leftSleeve' if np.mean([xyz[v,0]for i in ids for v in mesh.polygons[i].vertices])>center[0] else 'rightSleeve'
 mesh.materials.clear()
 for m in [fabric,rib,cord,*materials.values()]:mesh.materials.append(m)
 while len(mesh.uv_layers)>1:mesh.uv_layers.remove(mesh.uv_layers[-1])
 original=mesh.uv_layers.new(name='OriginalPattern');original.data.foreach_set('uv',source.astype(np.float32).ravel());mesh.uv_layers.active_index=0
 for v,p in zip(mesh.vertices,xyz):v.co=((p[0]-center[0])*scale,(p[1]-center[1])*scale,(p[2]-center[2])*scale)
 # Geometry now uses Blender Z-up and faces -Y, which exports as glTF +Z front.
 o.parent=None;o.matrix_world.identity();o.animation_data_clear()
 for mod in list(o.modifiers):o.modifiers.remove(mod)
 for ids in islands:
  zone=zone_ids.get(ids[0]);verts=sorted({v for i in ids for v in mesh.polygons[i].vertices});points=xyz[verts]
  if not zone:
   for i in ids:mesh.polygons[i].material_index=1 if points[:,2].max()<lo[2]+.36 or (abs(points[:,0].mean()-center[0])>(hi[0]-lo[0])*.35) else 0
   continue
  loops=[l for i in ids for l in mesh.polygons[i].loop_indices];raw=source[loops];positions=np.array([xyz[mesh.loops[l].vertex_index]for l in loops]);target=np.stack(((positions[:,0]-center[0])*(-1 if zone=='back' else 1),positions[:,2]),axis=1)
  if 'Sleeve' in zone:
   sign=1 if zone=='leftSleeve' else -1;axis=np.array([sign*.7,0,-.7]);target=np.stack((-positions[:,1]*sign,-positions@axis),axis=1)
  left,_,right=np.linalg.svd((raw-raw.mean(0)).T@(target-target.mean(0)));rotation=left@right
  # Estimate a common metric length from the actual edges; rotate/scale original pattern uniformly.
  ratios=[]
  for i in ids[::7]:
   p=mesh.polygons[i];ls=list(p.loop_indices)
   for a,b in zip(ls,ls[1:]+ls[:1]):
    du=np.linalg.norm(source[a]-source[b]);dist=np.linalg.norm(xyz[mesh.loops[a].vertex_index]-xyz[mesh.loops[b].vertex_index])*scale
    if du>1e-6 and dist>1e-7:ratios.append(dist/du)
  unit=float(np.median(ratios));pattern=(raw-raw.mean(0))@rotation*unit;pmin=pattern.min(0);extent=pattern.max(0)-pmin;normal=(pattern-pmin)/extent
  for l,uv in zip(loops,normal):mesh.uv_layers[0].data[l].uv=uv
  for i in ids:mesh.polygons[i].material_index=3+list(names).index(zone)
  meta_zones[zone]={'width':float(extent[0]),'height':float(extent[1]),'sourceScale':unit,'printWidth':float(min(extent[0],.95) if zone in ['front','back']else .28),'wrap':False,'defaultX':.5,'defaultY':.34 if zone=='front' else .38}
  if zone=='front':front_pattern=(rotation,unit,raw.mean(0),pmin,extent)
  print('ZONE',kind,zone,len(ids),extent.tolist(),unit,flush=True)
 mesh.update()
 for p in mesh.polygons:p.use_smooth=True
 mesh.normals_split_custom_set(saved_normals)
# Pocket follows front-panel projection; strings remain non-printable and occlude the logo naturally.
if not tee:
 main.data.calc_loop_triangles();from mathutils.bvhtree import BVHTree
 # Closest front triangle only, so pocket never samples back/sleeve coordinates.
 front_faces=[p for p in main.data.polygons if p.material_index==3];tree=BVHTree.FromPolygons([v.co for v in main.data.vertices],[list(p.vertices)for p in front_faces],all_triangles=False)
 accessory=next(o for o in meshes if o!=main)
 for p in accessory.data.polygons:
  coords=np.array([tuple(accessory.data.vertices[v].co)for v in p.vertices]);c=coords.mean(0)
  if c[2]>-.33: # cords and hardware retain their own plain material
   p.material_index=2;continue
  p.material_index=3
  for l in p.loop_indices:
   q=accessory.data.vertices[accessory.data.loops[l].vertex_index].co;loc,_,index,_=tree.find_nearest(q);face=front_faces[index];a,b,c=[main.data.vertices[i].co for i in face.vertices[:3]];ab=b-a;ac=c-a;ap=loc-a;den=ab.dot(ab)*ac.dot(ac)-ab.dot(ac)**2
   if abs(den)<1e-15:continue
   v=(ac.dot(ac)*ap.dot(ab)-ab.dot(ac)*ap.dot(ac))/den;w=(ab.dot(ab)*ap.dot(ac)-ab.dot(ac)*ap.dot(ab))/den;uv=Vector((0,0))
   for li,weight in zip(face.loop_indices,(1-v-w,v,w)):uv+=main.data.uv_layers[0].data[li].uv*weight
   accessory.data.uv_layers[0].data[l].uv=uv
 if len(accessory.data.uv_layers)>1:accessory.data.uv_layers.remove(accessory.data.uv_layers[1])
# Calibrate sleeve starting coordinates on a front-visible surface.
for zone in ['leftSleeve','rightSleeve']:
 index=3+list(names).index(zone);sign=1 if zone=='leftSleeve' else -1;view=Vector((sign*1.25,-1.15,.32)).normalized();candidates=[]
 for p in main.data.polygons:
  if p.material_index!=index:continue
  uv=sum((main.data.uv_layers[0].data[l].uv for l in p.loop_indices),Vector((0,0)))/len(p.loop_indices)
  if .3<uv.y<.7 and .15<uv.x<.85:candidates.append((p.normal.dot(view)-abs(uv.y-.62)*.5,p,uv))
 _,p,uv=max(candidates,key=lambda t:t[0])
 ls=list(p.loop_indices)[:3];pts=[main.data.vertices[main.data.loops[l].vertex_index].co for l in ls];uvs=[main.data.uv_layers[0].data[l].uv.copy()for l in ls];a=uvs[1]-uvs[0];b=uvs[2]-uvs[0];det=a.x*b.y-b.x*a.y
 if abs(det)>1e-12:
  du=((pts[1]-pts[0])*b.y-(pts[2]-pts[0])*a.y)/det
  if du.dot(Vector((1.15,sign*1.25,0)))<0:
   for face in main.data.polygons:
    if face.material_index==index:
     for li in face.loop_indices:main.data.uv_layers[0].data[li].uv.x=1-main.data.uv_layers[0].data[li].uv.x
   uv.x=1-uv.x
 meta_zones[zone]['defaultX']=float(uv.x);meta_zones[zone]['defaultY']=1-float(uv.y)
 bpy.context.view_layer.update()
credit={'title':'3D T-shirt Mockup' if tee else '3D Hoodie Mockup','author':'BrockCreative','url':'https://brockcreative.gumroad.com/l/'+('3DTshirtMockup'if tee else '3DHoodieMockup'),'license':'User-supplied free Gumroad asset','adaptation':'BrandMock: static WebGL mesh, metric sewing-pattern UVs, independent print zones. Original geometry retained.'}
meta={'id':kind,'revision':5,'panelWidth':meta_zones['front']['width'],'panelHeight':meta_zones['front']['height'],'bodyWidth':float((hi[0]-lo[0])*scale),'height':1.8,'defaultLogoWidth':.32,'zones':meta_zones,'credit':credit,'source':'User-uploaded BrockCreative Blender archive, static mesh, source UV retained in UV1'}
with open(os.path.join(out,kind+'.json'),'w')as f:json.dump(meta,f,indent=2)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=main
bpy.ops.export_scene.gltf(filepath=os.path.join(out,kind+'.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=False,export_materials='EXPORT',export_copyright='BrockCreative. User-supplied free Gumroad mockup; adapted for BrandMock. See model JSON.')
if '--skip-preview' in sys.argv:sys.exit(0)
# Neutral thumbnail rendered from the same meshes, with no source cameras/textures/scripts.
for o in list(bpy.context.scene.objects):
 if o not in meshes:bpy.data.objects.remove(o,do_unlink=True)
floor=min(v.co.z for o in meshes for v in o.data.vertices)-.05
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,floor));bpy.context.object.data.materials.append(mat('Floor'));bpy.context.object.active_material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.65,.68,.65,1)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.72,.74,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
for loc,power,size in [((-2.5,-3.5,4.2),450,4),((2.7,-1.2,2),230,3),((0,2.8,3),400,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1.5,-5.5,1.2));cam=bpy.context.object;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.8
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(out,kind+'-preview.png');bpy.ops.render.render(write_still=True)
print('BROCK_READY',kind,flush=True)
