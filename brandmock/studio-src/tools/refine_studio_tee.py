"""Local collar and back-fold refinement of the approved Studio 0.6 tee.
The frozen v0.6 mesh is the source: body fit, sleeves, hems and print UVs stay intact.
Blender 4.3, --disable-autoexec. Blender axes X horizontal, Z up, -Y front.
"""
import bpy,bmesh,os,json,math
from mathutils import Vector
from mathutils.kdtree import KDTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,'public/models');BASE=os.path.join(ROOT,'sources/vendor/tee-studio-v06.glb')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=BASE)
body=next(o for o in bpy.context.scene.objects if o.type=='MESH');mesh=body.data
bm=bmesh.new();bm.from_mesh(mesh)
# Drop only the old four collar islands; printable faces and other trim are retained.
old_collar={i for i,m in enumerate(mesh.materials)if m.name.startswith('Ribbing_Collar')}
back_mat={i for i,m in enumerate(mesh.materials)if m.name.startswith('Print_Back')}
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index in old_collar],context='FACES')
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
# Smooth only back DEPTH and blend back 25%. Hold every material/seam boundary.
back=[v for v in bm.verts if not v.is_boundary and v.link_faces and all(f.material_index in back_mat for f in v.link_faces)]
saved={v:v.co.y for v in back}
for _ in range(180):bmesh.ops.smooth_vert(bm,verts=back,factor=.28,use_axis_x=False,use_axis_y=True,use_axis_z=False)
back_delta=[]
for v,old in saved.items():
 delta=max(-.015,min(.015,(v.co.y-old)*.25));v.co.y=old+delta;back_delta.append(abs(delta))
print('BACK_DEPTH_REFINEMENT',len(back),max(back_delta),sum(back_delta)/len(back_delta),flush=True)
# The author's body has one exact 144-edge neck boundary after its collar is removed.
edges=[e for e in bm.edges if e.is_boundary and all(v.co.z>.6 and abs(v.co.x)<.42 for v in e.verts)]
adj={}
for e in edges:
 for a,b in [(e.verts[0],e.verts[1]),(e.verts[1],e.verts[0])]:adj.setdefault(a,[]).append(b)
assert len(edges)==144 and all(len(n)==2 for n in adj.values()),'Expected one intact source neck loop'
start=min(adj,key=lambda v:v.co.x);ordered=[start];previous=None;current=start
while True:
 candidates=[v for v in adj[current]if v is not previous];nxt=candidates[0]
 if nxt is start:break
 ordered.append(nxt);previous,current=current,nxt
assert len(ordered)==len(edges),'Neck boundary must be one loop'
rest=[v.co.copy()for v in ordered]
cx=(min(v.x for v in rest)+max(v.x for v in rest))/2;cy=(min(v.y for v in rest)+max(v.y for v in rest))/2
rx=(max(v.x for v in rest)-min(v.x for v in rest))/2;ry=(max(v.y for v in rest)-min(v.y for v in rest))/2
raw_angles=[math.atan2((v.y-cy)/ry,(v.x-cx)/rx)for v in rest]
turn=sum((raw_angles[(i+1)%len(rest)]-raw_angles[i]+math.pi)%(2*math.pi)-math.pi for i in range(len(rest)))
orientation=1 if turn>0 else -1
arc=[0.]
for i in range(1,len(rest)):arc.append(arc[-1]+(rest[i]-rest[i-1]).length)
perimeter=arc[-1]+(rest[0]-rest[-1]).length
front=min(range(len(rest)),key=lambda i:rest[i].y)
anchor=-math.pi/2-orientation*2*math.pi*arc[front]/perimeter
angles=[anchor+orientation*2*math.pi*d/perimeter for d in arc]
# A shallow U-shaped crew neck replaces the pointy source opening.
RX=.240;RY=.187;SIDE=.895;FRONT_DROP=.115;BACK_RISE=.027
outer=[Vector((cx+RX*math.cos(a),cy+RY*math.sin(a),SIDE-FRONT_DROP*max(0,-math.sin(a))+BACK_RISE*max(0,math.sin(a))))for a in angles]
kdt=KDTree(len(rest))
for i,p in enumerate(rest):kdt.insert(p,i)
kdt.balance();moved=0;radius=.145
for v in bm.verts:
 p=v.co.copy()
 if p.z<.58 or abs(p.x)>.46:continue
 _,idx,_=kdt.find(p);best=None
 for a,b in [((idx-1)%len(rest),idx),(idx,(idx+1)%len(rest))]:
  segment=rest[b]-rest[a];t=max(0,min(1,(p-rest[a]).dot(segment)/segment.length_squared));q=rest[a]+segment*t;d=(q-p).length
  delta=(outer[a]-rest[a])*(1-t)+(outer[b]-rest[b])*t
  if best is None or d<best[0]:best=(d,delta)
 distance,delta=best
 if distance<radius:
  t=1-distance/radius;weight=t*t*(3-2*t);v.co+=delta*weight;moved+=1
# Boundary vertices use exact targets, to avoid interpolation accumulation.
for v,target in zip(ordered,outer):v.co=target
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.update();mesh.normals_split_custom_set([(0,0,0)]*len(mesh.loops))
print('LOCAL_NECK_VERTICES',moved,flush=True)
# A new narrow rib band shares the exact outer boundary and turns inward/upward.
N=len(outer);ROWS=5;verts=[];faces=[];uvs=[]
dist=[0.]
for i in range(1,N):dist.append(dist[-1]+(outer[i]-outer[i-1]).length)
length=dist[-1]+(outer[0]-outer[-1]).length
for r in range(ROWS+1):
 t=r/ROWS
 for i,p in enumerate(outer):
  a=angles[i];inner=Vector((cx+(RX-.027)*math.cos(a),cy+(RY-.024)*math.sin(a),p.z+.014+.008*abs(math.sin(a))))
  point=p.lerp(inner,t);point.z+=.0008;verts.append(point);uvs.append((dist[i]/length,t))
for r in range(ROWS):
 for j in range(N):k=(j+1)%N;faces.append((r*N+j,r*N+k,(r+1)*N+k,(r+1)*N+j))
cm=bpy.data.meshes.new('Studio round crew neck');cm.from_pydata(verts,[],faces);cm.update()
collar=bpy.data.objects.new('Refined Studio ribbed collar',cm);bpy.context.collection.objects.link(collar);material=bpy.data.materials.new('Ribbing_Collar');material.diffuse_color=(.09,.15,.19,1);cm.materials.append(material)
uv=cm.uv_layers.new(name='Knit')
for p in cm.polygons:
 p.use_smooth=True
 for li in p.loop_indices:
  idx=cm.loops[li].vertex_index;j=idx%N;r=idx//N;u=uvs[idx][0]
  if j==0 and any(cm.loops[k].vertex_index%N==N-1 for k in p.loop_indices):u=1
  uv.data[li].uv=(u,r/ROWS)
bm=bmesh.new();bm.from_mesh(cm);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
# The top of the band must face out of the garment, including at the shoulders.
if sum(f.normal.z for f in bm.faces)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
bm.to_mesh(cm);bm.free();bpy.context.view_layer.objects.active=collar;collar.select_set(True)
solid=collar.modifiers.new('Rib band actual thickness','SOLIDIFY');solid.thickness=.0035;solid.offset=-.5;solid.use_even_offset=False;bpy.ops.object.modifier_apply(modifier=solid.name)
# UV1 on the source body remains byte-for-byte the original sewing atlas.
bpy.ops.object.select_all(action='DESELECT')
for o in [body,collar]:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'sources/tee-studio-refined.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'tee-studio.glb'),export_format='GLB',use_selection=True,export_animations=False,export_materials='EXPORT',export_copyright='BrockCreative; approved Studio fit with local round collar and restrained back folds by BrandMock.')
# Reuse the approved v0.6 print dimensions; no refit or UV recalibration.
meta=json.load(open(os.path.join(ROOT,'sources/vendor/tee-studio-v06.json')))
meta['revision']=8;meta['source']='Approved Studio 0.6 fit retained; local round crew-neck replacement and 25% blended back-depth smoothing only.'
meta['refinement']={'base':'Studio 0.6','backDepthBlend':.25,'backMaxDepthChange':max(back_delta),'neckBlendRadius':radius,'frontAndSleevesOutsideNeck':'unchanged','printUVs':'retained'}
meta['credit']['adaptation']='BrandMock Studio: approved wider fit, local round ribbed crew neck and gentler back folds. Original sewing-pattern UVs retained.'
with open(os.path.join(OUT,'tee-studio.json'),'w')as f:json.dump(meta,f,indent=2,ensure_ascii=False)
print('REFINED_STUDIO_READY',flush=True)
