"""BrandMock Heavy tee, authored from the user's rotating video reference.
No reference-store mesh/texture or BrockCreative geometry is imported.
Blender 4.3, X horizontal / Z up / -Y forward. Run with --disable-autoexec.
"""
import bpy,bmesh,math,json,os
from math import sin,cos,pi,sqrt,exp
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public/models');SOURCE=os.path.join(ROOT,'sources')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
LOW=-.86;TOP=.92;W=.525;SHOULDER=.60;NECK=.18;NECK_Z=.135
ARM_LOW=.15;ARM_HIGH=.69;ARM_Z=.185;AX=(W+SHOULDER)/2;AY=(ARM_LOW+ARM_HIGH)/2;RY=(ARM_HIGH-ARM_LOW)/2;DX=(SHOULDER-W)/2
END_X=.805;END_Y=.035;END_RY=.175;END_RZ=.130
PANEL_W=2*SHOULDER;PANEL_H=TOP-LOW;THICKNESS=.0048

def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def co(x,y,z):return Vector((x,-z,y))
def design(v):return (v.x,v.z,-v.y)
def mat(name,color=(.035,.055,.078)):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.95;p.inputs['Specular IOR Level'].default_value=.2
 return m
mats=[mat(n)for n in ['Print_Front','Print_Back','Print_LeftSleeve','Print_RightSleeve','Fabric_Inside','Ribbing_Collar','Stitching']]
verts=[];faces=[];face_uv=[];face_mat=[]
def vertex(p):verts.append(co(*p));return len(verts)-1
def face(v,mi,uv):faces.append(v);face_mat.append(mi);face_uv.append(uv)
def width(y):
 if y>=ARM_LOW:return W+(SHOULDER-W)*(y-ARM_LOW)/(ARM_HIGH-ARM_LOW)
 t=max(0,min(1,(y-LOW)/(ARM_LOW-LOW)));return W*(1-.018*sin(pi*t)+.010*exp(-((t-.04)/.10)**2))
def neck(x,back=False):
 k=sqrt(max(0,1-(x/NECK)**2));return TOP-((-.016 if back else .126)*k),NECK_Z*k

def shoulder_y(x):
 t=max(0,min(1,(abs(x)-NECK)/(SHOULDER-NECK)));return TOP+(ARM_HIGH-TOP)*(2*t*t-t*t*t)

def panel(x,y,back=False):
 w=width(y);u=max(-1,min(1,x/w));t=(y-AY)/RY
 hole=ARM_Z*sqrt(max(0,1-t*t)) if ARM_LOW<=y<=ARM_HIGH else 0
 depth=.177+.013*exp(-((y-.10)/.72)**2)
 z=sqrt(max(0,depth*depth*(1-u*u)+hole*hole*u**6))
 if abs(x)<=NECK:boundary,ztop=neck(x,back)
 else:boundary=shoulder_y(x);ztop=0
 q=max(0,min(1,(y-(boundary-.22))/.22));roundness=sqrt(max(0,1-q*q));blend=1-roundness
 z=sqrt(max(0,depth*depth*(1-u*u)*roundness*roundness+hole*hole*abs(u)**12))+ztop*blend
 # Three broad, quiet gravity folds. No high-frequency geometry noise.
 envelope=(1-u*u)*(1-blend)
 wave=.019*sin(12*x+1.3*y+(1.2 if back else .2))+.006*sin(21*x-1.2*y)
 wave*=.45+.55*exp(-((y+.35)/.75)**2)
 wave+=.010*sin(9*y+6*abs(x))*exp(-((abs(x)-.42)/.12)**2-((y-.10)/.30)**2)
 z+=wave*envelope
 # A folded, stable hem, with the material return supplied by Solidify.
 z+=.0027*(1-smooth((y-LOW-.021)/.016))*(1-u*u)
 yy=y+.003*sin(5*x+.4)*exp(-((y-LOW)/.06)**2)
 return (x,yy,(-1 if back else 1)*z)

# Panels share exact side, shoulder and armhole boundary samples.
NX=80;HALF_ARC=32
ys=[LOW,LOW+.008,LOW+.020,LOW+.035,LOW+.050]
ys += [LOW+.065+(ARM_LOW-LOW-.065)*i/38 for i in range(39)]
ys += [AY+RY*cos(pi-pi*i/HALF_ARC)for i in range(1,HALF_ARC+1)]
for back in [False,True]:
 grid=[];coords=[]
 for y in ys:
  row=[];xy=[]
  for j in range(NX+1):
   x=(-1+2*j/NX)*width(y);row.append(vertex(panel(x,y,back)));xy.append((x,y))
  grid.append(row);coords.append(xy)
 for i in range(1,13):
  row=[];xy=[];t=i/12
  for j in range(NX+1):
   x=(-1+2*j/NX)*SHOULDER
   boundary=neck(x,back)[0]if abs(x)<=NECK else shoulder_y(x)
   y=ARM_HIGH+(boundary-ARM_HIGH)*t;row.append(vertex(panel(x,y,back)));xy.append((x,y))
  grid.append(row);coords.append(xy)
 for i in range(len(grid)-1):
  for j in range(NX):
   indices=[(i,j),(i,j+1),(i+1,j+1),(i+1,j)]
   if back:indices.reverse()
   uv=[(.5+(-1 if back else 1)*coords[r][c][0]/PANEL_W,(coords[r][c][1]-LOW)/PANEL_H)for r,c in indices]
   face([grid[r][c]for r,c in indices],1 if back else 0,uv)

# Each sleeve is a shaped volume attached to the same sampled armhole.
sleeve_meta={};sleeve_length=math.hypot(END_X-AX,END_Y-AY)
perp=Vector((-(END_Y-AY),END_X-AX));perp.normalize()
ts=[i*.90/34 for i in range(35)]+[.92,.94,.96,.975,.99,1.0];SEG=2*HALF_ARC

def sleeve(t,a,sign):
 h00=2*t**3-3*t*t+1;h10=t**3-2*t*t+t;h01=-2*t**3+3*t*t;h11=t**3-t*t
 cx=h00*AX+h10*.30+h01*END_X+h11*.15;cy=h00*AY-h10*.165+h01*END_Y-h11*.32
 dx=(6*t*t-6*t)*AX+(3*t*t-4*t+1)*.30+(-6*t*t+6*t)*END_X+(3*t*t-2*t)*.15
 dy=(6*t*t-6*t)*AY-(3*t*t-4*t+1)*.165+(-6*t*t+6*t)*END_Y-(3*t*t-2*t)*.32
 local=Vector((-dy,dx));local.normalize();b=smooth(t);vx=(DX/RY)*(1-b)+local.x*b;vy=(1-b)+local.y*b
 ry=RY+(END_RY-RY)*b;rz=ARM_Z+(END_RZ-ARM_Z)*b
 fold=.003*sin(2*a+4*t)*sin(pi*t)**2
 lip=.0022*smooth((t-.91)/.035)
 x=cx+vx*(ry+fold+lip)*cos(a);y=cy+vy*(ry+fold+lip)*cos(a);z=(rz+fold+lip)*sin(a)
 if t==0:x=AX+DX*cos(a);y=AY+RY*cos(a);z=ARM_Z*sin(a)
 return (sign*x,y,z)
for zone,sign,mi in [('leftSleeve',1,2),('rightSleeve',-1,3)]:
 rings=[[vertex(sleeve(t,2*pi*j/SEG,sign))for j in range(SEG)]for t in ts]
 for i in range(len(ts)-1):
  for j in range(SEG):
   k=(j+1)%SEG;idx=[rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]]
   ua=j/SEG;ub=(j+1)/SEG
   if sign>0:ua=1-ua;ub=1-ub
   uv=[(ua,1-ts[i]),(ub,1-ts[i]),(ub,1-ts[i+1]),(ua,1-ts[i+1])]
   if sign<0:idx.reverse();uv.reverse()
   face(idx,mi,uv)
 # Representative sewing dimensions at the central printing patch.
 r1=(RY+END_RY)/2;r2=(ARM_Z+END_RZ)/2
 circ=pi*(3*(r1+r2)-sqrt((3*r1+r2)*(r1+3*r2)))
 sleeve_meta[zone]={'width':circ,'height':sleeve_length,'printWidth':.27,'wrap':True,'defaultX':.73 if sign>0 else .27,'defaultY':.55}
mesh=bpy.data.meshes.new('Heavy cotton joined shell');mesh.from_pydata(verts,[],faces);mesh.update()
body=bpy.data.objects.new('Heavy tee — sewn body and sleeves',mesh);bpy.context.collection.objects.link(body)
for m in mats:mesh.materials.append(m)
uv=mesh.uv_layers.new(name='PrintPattern')
for p,mi,coords in zip(mesh.polygons,face_mat,face_uv):
 p.material_index=mi;p.use_smooth=True
 for li,pair in zip(p.loop_indices,coords):uv.data[li].uv=pair
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.dissolve_degenerate(bm,dist=.0000001,edges=list(bm.edges))
# Only the collar, bottom and cuff openings may remain before thickness is added.
open_arm=[]
for e in bm.edges:
 if not e.is_boundary:continue
 x,y,z=design((e.verts[0].co+e.verts[1].co)*.5);sx=AX+DX*(y-AY)/RY
 if ARM_LOW+.002<y<ARM_HIGH-.002 and abs(abs(x)-sx)<.025:open_arm.append(e)
assert not open_arm,('Open sleeve join',len(open_arm))
seam=[]
for v in bm.verts:
 x,y,z=design(v.co);sx=AX+DX*(y-AY)/RY
 if ARM_LOW-.012<y<ARM_HIGH+.012 and abs(abs(x)-sx)<.040:seam.append(v)
for _ in range(8):bmesh.ops.smooth_vert(bm,verts=seam,factor=.22,use_axis_x=True,use_axis_y=True,use_axis_z=True)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
def relax_heavy(obj):
 scene=bpy.context.scene;scene.frame_set(1);scene.gravity=(0,0,-1.6)
 group=obj.vertex_groups.new(name='Supported shoulders and neck')
 for v in obj.data.vertices:
  x,y,z=design(v.co);boundary=shoulder_y(x)
  weight=smooth((y-(boundary-.11))/.065)if abs(x)<SHOULDER+.015 else 0
  if abs(x)<NECK+.045 and y>TOP-.20:weight=1
  if weight>0:group.add([v.index],weight,'REPLACE')
 supports=[]
 def collider(name,vs,fs):
  m=bpy.data.meshes.new(name);m.from_pydata(vs,[],fs);m.update();bm=bmesh.new();bm.from_mesh(m);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
  if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
  bm.to_mesh(m);bm.free();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);o.modifiers.new('Collision','COLLISION');o.collision.thickness_outer=.005;supports.append(o)
 def tube_faces(n,r):
  fs=[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j)for i in range(r)for j in range(n)]
  return fs+[tuple(reversed(range(n))),tuple(r*n+j for j in range(n))]
 vs=[];N=48;R=28
 for i in range(R+1):
  y=LOW-.16+(TOP-LOW+.18)*i/R;cap=sqrt(max(.04,1-max(0,(y-.50)/.44)**2));rx=.455*cap;rz=.151*cap
  for j in range(N):a=2*pi*j/N;vs.append(co(rx*cos(a),y,rz*sin(a)))
 collider('Offline torso support',vs,tube_faces(N,R))
 for sign in [-1,1]:
  vs=[];N=40;R=24
  for i in range(R+1):
   t=i/R;cx=AX+(END_X-AX)*t;cy=AY+(END_Y-AY)*t;perp=Vector((-(END_Y-AY),END_X-AX));perp.normalize();ry=.205+(.125-.205)*t;rz=.145+(.090-.145)*t
   for j in range(N):a=2*pi*j/N;vs.append(co(sign*(cx+perp.x*ry*cos(a)),cy+perp.y*ry*cos(a),rz*sin(a)))
  collider('Offline sleeve support',vs,tube_faces(N,R))
 bpy.context.view_layer.objects.active=obj
 cloth=obj.modifiers.new('Heavy cotton gravity drape — baked','CLOTH');cs=cloth.settings;cs.quality=12;cs.mass=.32;cs.tension_stiffness=60;cs.compression_stiffness=35;cs.shear_stiffness=18;cs.bending_stiffness=3;cs.air_damping=8;cs.vertex_group_mass=group.name;cs.pin_stiffness=1
 cloth.collision_settings.use_self_collision=False;cloth.collision_settings.distance_min=.004;cloth.point_cache.frame_start=1;cloth.point_cache.frame_end=8
 for frame in range(1,9):scene.frame_set(frame);bpy.context.view_layer.update();obj.evaluated_get(bpy.context.evaluated_depsgraph_get());print('HEAVY_DRAPE_FRAME',frame,flush=True)
 bpy.ops.object.modifier_apply(modifier=cloth.name)
 for o in supports:bpy.data.objects.remove(o,do_unlink=True)
 scene.frame_set(1)
# Retain rest-to-posed registration for the actual seam paths.
body.data.calc_loop_triangles();rest_vertices=[v.co.copy()for v in body.data.vertices];rest_triangles=[tuple(t.vertices)for t in body.data.loop_triangles]
rest_surface=BVHTree.FromPolygons(rest_vertices,rest_triangles,all_triangles=True)
relax_heavy(body);posed_vertices=[v.co.copy()for v in body.data.vertices]
def from_rest(query):
 hit,_,idx,_=rest_surface.find_nearest(query);a,b,c=[rest_vertices[i]for i in rest_triangles[idx]];ab=b-a;ac=c-a;ap=hit-a;den=ab.dot(ab)*ac.dot(ac)-ab.dot(ac)**2
 if abs(den)<1e-18:return posed_vertices[rest_triangles[idx][0]].copy()
 v=(ac.dot(ac)*ap.dot(ab)-ab.dot(ac)*ap.dot(ac))/den;w=(ab.dot(ab)*ap.dot(ac)-ab.dot(ac)*ap.dot(ab))/den
 return sum((posed_vertices[j]*weight for j,weight in zip(rest_triangles[idx],(1-v-w,v,w))),Vector())
bpy.context.view_layer.objects.active=body;body.select_set(True)
sub=body.modifiers.new('Tailored cloth surface','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
outer_faces=len(body.data.polygons)
solid=body.modifiers.new('Heavy cotton actual thickness','SOLIDIFY');solid.thickness=THICKNESS;solid.offset=-1;solid.use_even_offset=True;solid.use_quality_normals=True
bpy.ops.object.modifier_apply(modifier=solid.name)
for p in body.data.polygons:
 if p.index>=outer_faces:p.material_index=4
# Check the real thick shell, not a silhouette or a normal-map illusion.
bm=bmesh.new();bm.from_mesh(body.data);assert all(e.is_manifold for e in bm.edges),'The cotton shell must be closed and manifold';shell_vertices=len(bm.verts);bm.free()
surface=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())

def seam_curve(name,points,r=.00042,closed=False,project=True):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=r;c.bevel_resolution=1;c.use_fill_caps=True
 sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for p,q in zip(sp.points,points):
  loc=co(*q)
  if project:
   loc=from_rest(loc);hit,n,_,_=surface.find_nearest(loc);loc=hit+n*.00065
  p.co=(*loc,1)
 sp.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mats[6]);return o
# Real twin-needle seams on the turned body and sleeve hems.
for dy in [.030,.039]:
 pts=[]
 for back in [False,True]:
  seq=range(97)if not back else reversed(range(97))
  for j in seq:pts.append(panel((-1+2*j/96)*width(LOW+dy),LOW+dy,back))
 seam_curve('Twin needle — bottom hem',pts,closed=True)
for sign in [-1,1]:
 for t in [.929,.949]:seam_curve('Twin needle — sleeve hem',[sleeve(t,2*pi*j/128,sign)for j in range(128)],closed=True)
 seam_curve('Dropped shoulder seam',[sleeve(0,2*pi*j/128,sign)for j in range(128)],r=.00035,closed=True)
 seam_curve('Shoulder join',[(sign*(NECK+(SHOULDER-NECK)*j/64),shoulder_y(NECK+(SHOULDER-NECK)*j/64),0)for j in range(65)],r=.00033)

# A flat rib-knit band follows the actual round neckline and returns inward.
N=128;R=6;CW=.031;cv=[];cf=[];cu=[]
for r in range(R+1):
 t=r/R
 for j in range(N):
  a=2*pi*j/N;x=NECK*cos(a);back=sin(a)<0;y,z=neck(x,back);z*=(-1 if back else 1)
  xo=(NECK+CW)*cos(a);outer_boundary=neck(xo,back)[0]if abs(xo)<=NECK else shoulder_y(xo);yo=outer_boundary-.025*abs(sin(a));zo=panel(xo,yo,back)[2]
  cv.append(co(x*(1-t)+xo*t,y*(1-t)+yo*t+.0022,z*(1-t)+zo*t));cu.append((j/N,t))
for r in range(R):
 for j in range(N):k=(j+1)%N;cf.append((r*N+j,r*N+k,(r+1)*N+k,(r+1)*N+j))
cm=bpy.data.meshes.new('Round crew collar');cm.from_pydata(cv,[],cf);cm.update();collar=bpy.data.objects.new('Heavy ribbed crew neck',cm);bpy.context.collection.objects.link(collar);cm.materials.append(mats[5]);uv=cm.uv_layers.new(name='Rib knit')
for p in cm.polygons:
 p.use_smooth=True
 for li in p.loop_indices:
  idx=cm.loops[li].vertex_index;j=idx%N;r=idx//N;u=j/N
  if j==0 and any(cm.loops[k].vertex_index%N==N-1 for k in p.loop_indices):u=1
  uv.data[li].uv=(u,r/R)
bpy.context.view_layer.objects.active=collar;collar.select_set(True)
# Reverse the band if the authored winding points into the opening.
bm=bmesh.new();bm.from_mesh(cm);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));front=max(bm.faces,key=lambda f:-f.calc_center_median().y)
if front.normal.y>0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
bm.to_mesh(cm);bm.free()
solid=collar.modifiers.new('Knitted band thickness','SOLIDIFY');solid.thickness=.0045;solid.offset=-.4;solid.use_even_offset=True;bpy.ops.object.modifier_apply(modifier=solid.name)
for r in [R-1]:seam_curve('Neckband topstitch',[design(cv[r*N+j])for j in range(N)],r=.00032,closed=True,project=False)

bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=body;bpy.ops.object.convert(target='MESH')
objects=[o for o in bpy.context.selected_objects if o.type=='MESH']
for o in objects:
 for p in o.data.polygons:p.use_smooth=True
zones={z:{'width':PANEL_W,'height':PANEL_H,'printWidth':2*W,'wrap':False,'defaultX':.5,'defaultY':.31 if z=='front'else .27}for z in ['front','back']};zones.update(sleeve_meta)
meta={'id':'tee-heavy','revision':7,'surfaceProfile':'cotton-heavy','panelWidth':PANEL_W,'panelHeight':PANEL_H,'bodyWidth':2*W,'height':max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices),'defaultLogoWidth':.32,'zones':zones,'source':'Original BrandMock Heavy tee authored from the user-provided rotating video reference. No reference-store or BrockCreative geometry or textures are included.','construction':{'authorship':'BrandMock','shellThickness':THICKNESS,'closedManifoldShell':True,'shellVertices':shell_vertices,'joinedArmholes':True,'offlineClothDrape':{'frames':8,'bendingStiffness':3,'browserSimulation':False},'neckOpening':'round crew','seams':'real twin-needle geometry','uvConvention':'Blender bottom-origin V; exported canvas-oriented glTF UVs with readable U direction'}}
with open(os.path.join(OUT,'tee-heavy.json'),'w')as f:json.dump(meta,f,indent=2,ensure_ascii=False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'tee-heavy.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'tee-heavy.glb'),export_format='GLB',use_selection=True,export_animations=False,export_materials='EXPORT',export_copyright='Original BrandMock Heavy tee; authored from visual reference.')
print('HEAVY_GEOMETRY_READY',len(body.data.polygons),flush=True)
# Draft thumbnail with consistent studio framing. Browser renders are checked separately.
bpy.ops.object.select_all(action='DESELECT');floor=min(v.co.z for o in objects for v in o.data.vertices)-.07
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,floor));bpy.context.object.data.materials.append(mat('Studio floor',(.72,.74,.75)))
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.72,.75,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
for loc,power,size in [((-3,-4,5),400,4),((3,-2,2),180,3),((1,3,3),300,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.05))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.85,-5.5,.55));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.03))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.28
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'tee-heavy-preview.png');bpy.ops.render.render(write_still=True)
print('HEAVY_READY',flush=True)
