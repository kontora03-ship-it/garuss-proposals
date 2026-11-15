"""BrandMock garment revision 2: continuous torso with fitted, separately unwrapped sleeves.
Original meshes only. Blender 4.3; design axes X=right, Y=up, Z=front.
"""
import bpy,math,sys,os,json,bmesh
from math import sin,cos,pi,sqrt,exp
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt
OUT=os.path.abspath(sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'public/models');SOURCE=os.path.abspath(os.path.join(OUT,'../../sources'))
os.makedirs(OUT,exist_ok=True);os.makedirs(SOURCE,exist_ok=True);bpy.context.preferences.filepaths.save_version=0

def co(x,y,z):return (x,-z,y)
def design(v):return (v.x,v.z,-v.y)
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def inside(x,y,p):
 hit=False
 for a,b in zip(p,p[1:]+p[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:hit=not hit
 return hit

def mat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.88;p.inputs['Sheen Weight'].default_value=.14;return m

def curve(name,pts,r,material,closed=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=r;c.bevel_resolution=2;sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,v in zip(sp.points,pts):p.co=(*co(*v),1)
 sp.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material);return o

def build(kind):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 hood=kind=='hoodie-boxy';wide=kind!='tee-regular';low=-.69 if hood else -.72 if wide else -.68;w=.53 if hood else .50 if wide else .395;arm_low=.20 if hood else .22;arm_high=.63 if hood else .62;shoulder=.59 if hood else .565 if wide else .455;neck=.205 if hood else .19 if wide else .175;neckz=.17 if hood else .15;depth=.195 if hood else .172 if wide else .155;armz=.175 if hood else .155 if wide else .14;top=.665 if hood else .66
 center=(arm_low+arm_high)/2;ry=(arm_high-arm_low)/2;ax=(w+shoulder)/2;dx=(shoulder-w)/2;body_h=top-low;panel_w=2*shoulder;cloth=.0022 if hood else .00125
 mats=[mat('Print_Front',(.035,.055,.08)),mat('Print_Back',(.035,.055,.08)),mat('Print_LeftSleeve',(.035,.055,.08)),mat('Print_RightSleeve',(.035,.055,.08)),mat('Fabric',(.035,.055,.08)),mat('Ribbing',(.030,.047,.071)),mat('Stitching',(.026,.041,.062)),mat('Drawstrings',(.54,.53,.48)),mat('HoodLining',(.023,.035,.05))]
 def width_at(y):
  if y>=arm_low:return w+(shoulder-w)*(y-arm_low)/(arm_high-arm_low)
  t=(y-low)/(arm_low-low);return w*(.985-.025*sin(pi*max(0,min(1,t))))
 def neckline(x,back=False):
  front_center=.603 if hood else .593;back_center=.637;v=sqrt(max(0,1-(x/neck)**2));return (back_center if back else front_center)+(top-(back_center if back else front_center))*(1-v),neckz*v
 def body_z(x,y,back=False):
  # The armhole boundary is a true ellipse. No max(body,sleeve) junction ridges.
  width=width_at(y);t=(y-center)/ry;hole=armz*sqrt(max(0,1-t*t)) if arm_low<=y<=arm_high else 0;factor=max(0,1-(hole/depth)**2);u=max(-1,min(1,x/width));z=depth*sqrt(max(0,1-factor*u*u))
  if abs(x)<=neck:boundary,z_top=neckline(x,back)
  else:boundary=top+(arm_high-top)*(abs(x)-neck)/(shoulder-neck);z_top=0
  blend=smooth((y-(boundary-.14))/.14);z=z*(1-blend)+z_top*blend+hole*abs(u)**6*blend
  fade=max(0,1-u*u)**2*(1-blend);hem=exp(-((y-low-.14)/.25)**2)
  folds=(.009*sin(14*x+2.7*y)+.004*sin(26*x-3*y+.6))*hem
  folds+=.0035*sin(12*x+1.5*y+(1 if back else 0))*exp(-((y+.12)/.5)**2)
  folds+=.006*sin(18*(y-.2)+8*abs(x))*exp(-((abs(x)-w*.74)/.12)**2-((y-.23)/.2)**2)
  return (z+folds*fade)*(-1 if back else 1)
 def body_y(x,y):return y+.003*sin(6*x+1)*exp(-((y-low)/.08)**2)
 vertices=[];faces=[];face_uv=[];face_mat=[]
 def addv(p):vertices.append(co(*p));return len(vertices)-1
 def face(ids,material,uv):faces.append(ids);face_mat.append(material);face_uv.append(uv)
 for back in [False,True]:
  poly=[]
  def line(a,b,n=20):
   for k in range(n):poly.append((a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n))
  line((-width_at(low),low),(width_at(low),low),38)
  for k in range(36):
   y=low+(arm_low-low)*k/36;poly.append((width_at(y),y))
  for k in range(32):
   a=pi-pi*k/32;poly.append((ax+dx*cos(a),center+ry*cos(a)))
  line((shoulder,arm_high),(neck,top),20)
  for k in range(32):
   a=pi*k/32;x=neck*cos(a);y,_=neckline(x,back);poly.append((x,y))
  line((-neck,top),(-shoulder,arm_high),20)
  for k in range(32):
   a=pi*k/32;poly.append((-ax-dx*cos(a),center+ry*cos(a)))
  for k in range(36):
   y=arm_low+(low-arm_low)*k/36;poly.append((-width_at(y),y))
  points=[Vector(p) for p in poly];step=.022
  for iy in range(math.ceil(body_h/step)):
   y=low+.012+iy*step
   for ix in range(math.ceil(panel_w/step)):
    x=-shoulder+.013+ix*step
    if inside(x,y,poly) and min((Vector((x,y))-Vector(p)).length for p in poly)>.008:points.append(Vector((x,y)))
  coords,_,tris,_,_,_=delaunay_2d_cdt(points,[(i,(i+1)%len(poly)) for i in range(len(poly))],[list(range(len(poly)))],1,1e-7);ids=[]
  for x,y in coords:ids.append(addv((x,body_y(x,y),body_z(x,y,back))))
  for tri in tris:
   if len(tri)!=3:continue
   tri=list(tri);a,b,c=[coords[i] for i in tri];area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
   if (area>0)==back:tri.reverse()
   uv=[(.5+(-1 if back else 1)*coords[i].x/panel_w,(coords[i].y-low)/body_h) for i in tri]
   mi=5 if hood and sum(coords[i].y for i in tri)/3<low+.055 else 1 if back else 0
   face([ids[i] for i in tri],mi,uv)
 # Each sleeve has its own continuous cylindrical UV island, including the back half.
 sleeve_meta={}
 for side,sign,material in [('leftSleeve',1,2),('rightSleeve',-1,3)]:
  endx=.75 if hood else .94 if wide else .80;endy=-.63 if hood else .10 if wide else .16;length=math.hypot(endx-ax,endy-center);end_ry=.111 if hood else .164 if wide else .146;end_rz=.091 if hood else .12 if wide else .105;rings=46 if hood else 24;segs=64;v_ids=[]
  perp=Vector((-(endy-center),endx-ax));perp.normalize()
  for i in range(rings+1):
   t=i/rings;cx=ax+(endx-ax)*t;cy=center+(endy-center)*t;blend=smooth(t);vx=dx/ry*(1-blend)+perp.x*blend;vy=1*(1-blend)+perp.y*blend;n=math.hypot(vx,vy);vx/=n;vy/=n
   rad_y=ry+(end_ry-ry)*t;rad_z=armz+(end_rz-armz)*t;band=(.07 if hood else .018)/length
   cuff=smooth((t-(1-band))/(band*.25)) if hood else 0
   rad_y*=1-.055*cuff;rad_z*=1-.055*cuff
   ring=[]
   for j in range(segs):
    a=2*pi*j/segs;xx=cx+vx*rad_y*cos(a);yy=cy+vy*rad_y*cos(a);zz=rad_z*sin(a)
    if i==0:xx=ax+dx*cos(a);yy=center+ry*cos(a);zz=armz*sin(a)
    else:
     envelope=sin(pi*t)**2;crease=(.0045 if hood else .0035)*sin(15*t+3*a)*envelope+.002*sin(25*t-2*a)*envelope;xx+=crease*vx*cos(a);yy+=crease*vy*cos(a);zz+=crease*sin(a)
    ring.append(addv((sign*xx,yy,zz)))
   v_ids.append(ring)
  for i in range(rings):
   for j in range(segs):
    k=(j+1)%segs;vs=[v_ids[i][j],v_ids[i][k],v_ids[i+1][k],v_ids[i+1][j]];uv=[(j/segs,1-i/rings),((j+1)/segs,1-i/rings),((j+1)/segs,1-(i+1)/rings),(j/segs,1-(i+1)/rings)]
    if sign<0:vs.reverse();uv.reverse()
    face(vs,5 if i/rings>1-(.065 if hood else .016)/length else material,uv)
  circumference=pi*(3*(ry+armz)-sqrt((3*ry+armz)*(ry+3*armz)))
  sleeve_meta[side]={'width':circumference,'height':length,'printWidth':.27 if hood else .24,'wrap':True,'defaultX':.16,'defaultY':.38}
 mesh=bpy.data.meshes.new(kind);mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(kind,mesh);bpy.context.collection.objects.link(obj)
 for m in mats:mesh.materials.append(m)
 uv_layer=mesh.uv_layers.new(name='UVMap')
 for p,mi,uv in zip(mesh.polygons,face_mat,face_uv):
  p.material_index=mi;p.use_smooth=True
  for loop,v in zip(p.loop_indices,uv):uv_layer.data[loop].uv=v
 # Weld true shared armhole/shoulder boundaries; sleeves remain separate UV/material islands.
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 bpy.context.view_layer.objects.active=obj;obj.select_set(True);sub=obj.modifiers.new('Continuous cloth smoothing','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name);outer_faces=len(obj.data.polygons);solid=obj.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=cloth;solid.offset=-1;solid.material_offset=4;solid.material_offset_rim=5;bpy.ops.object.modifier_apply(modifier=solid.name)
 for p in obj.data.polygons:
  if p.index>=outer_faces:p.material_index=4
 # Flat knitted collar follows the real elliptical neckline instead of a floating tube.
 cv=[];cf=[];N=96;R=5;cw=.022 if hood else .018
 for r in range(R+1):
  t=r/R
  for j in range(N):
   a=2*pi*j/N;x=neck*cos(a);back=sin(a)<0;y,z=neckline(x,back);z*=(-1 if back else 1);outer_x=(neck+cw)*cos(a);outer_y=y-.016;outer_z=body_z(outer_x,outer_y,back);cv.append(co(x*(1-t)+outer_x*t,y*(1-t)+outer_y*t+.0018,z*(1-t)+outer_z*t))
 for r in range(R):
  for j in range(N):k=(j+1)%N;cf.append((r*N+j,r*N+k,(r+1)*N+k,(r+1)*N+j))
 cm=bpy.data.meshes.new('Knitted collar');cm.from_pydata(cv,[],cf);cm.update();collar=bpy.data.objects.new('Collar',cm);bpy.context.collection.objects.link(collar);cm.materials.append(mats[5]);cu=cm.uv_layers.new(name='UVMap')
 for p in cm.polygons:
  p.use_smooth=True
  for l in p.loop_indices:v=cm.loops[l].vertex_index;cu.data[l].uv=(v%N/N,v//N/R)
 bpy.context.view_layer.objects.active=collar;collar.select_set(True);cs=collar.modifiers.new('Collar thickness','SOLIDIFY');cs.thickness=.0018;bpy.ops.object.modifier_apply(modifier=cs.name)
 for back in [False,True]:
  for dy in [.014,.020]:curve('Hem stitch',[(x,body_y(x,low+dy),body_z(x,low+dy,back)+(-.0008 if back else .0008)) for x in [-w*.93+i*w*1.86/64 for i in range(65)]],.00038,mats[6])
 if hood:
  hv=[];hf=[];rows=34;cols=72
  for i in range(rows+1):
   t=i/rows;cap=sqrt(max(.00004,1-t**4));rx=neck*(1+.22*sin(pi*t))*cap;rz=neckz*(1+.28*sin(pi*t))*cap;gap=.30+.48*sin(pi*t)
   for j in range(cols+1):
    a=pi/2+gap+(2*pi-2*gap)*j/cols;x=rx*cos(a);z=rz*sin(a)-.045*t;ny,_=neckline(neck*cos(a),sin(a)<0);y=(.65+.39*t)+(ny-.65)*(1-t);wrinkle=.0025*sin(5*a+6*t)*sin(pi*t);hv.append(co(x,y,z+wrinkle))
  for i in range(rows):
   for j in range(cols):a=i*(cols+1)+j;hf.append((a,a+cols+1,a+cols+2,a+1))
  hm=bpy.data.meshes.new('Rounded hood');hm.from_pydata(hv,[],hf);hm.update();ho=bpy.data.objects.new('Hood',hm);bpy.context.collection.objects.link(ho);hm.materials.append(mats[4]);hm.materials.append(mats[8]);
  for p in hm.polygons:p.use_smooth=True
  bpy.context.view_layer.objects.active=ho;ho.select_set(True);hs=ho.modifiers.new('Soft hood','SUBSURF');hs.levels=1;bpy.ops.object.modifier_apply(modifier=hs.name);ht=ho.modifiers.new('Hood lining','SOLIDIFY');ht.thickness=.0025;ht.material_offset=1;bpy.ops.object.modifier_apply(modifier=ht.name)
  for j in [0,cols]:curve('Hood binding',[design(Vector(hv[i*(cols+1)+j])) for i in range(rows+1)],.0028,mats[5])
  curve('Hood seam',[design(Vector(hv[i*(cols+1)+cols//2])) for i in range(rows)],.0005,mats[6])
  for sign in [-1,1]:curve('Drawcord',[(sign*.085,.615,.162),(sign*.09,.54,.205),(sign*.10,.41,.219),(sign*.09,.325,.216)],.0023,mats[7])
  # A dense conformal patch, with the seam extracted from its actual subdivided boundary.
  pv=[];pf=[];rows=20;cols=32
  for i in range(rows+1):
   t=i/rows;y=-.51+.32*t;half=.275-.075*smooth((t-.52)/.48)
   for j in range(cols+1):x=-half+2*half*j/cols;pv.append(co(x,y,body_z(x,y)+.0045))
  for i in range(rows):
   for j in range(cols):a=i*(cols+1)+j;pf.append((a,a+1,a+cols+2,a+cols+1))
  pm=bpy.data.meshes.new('Conformal kangaroo pocket');pm.from_pydata(pv,[],pf);pm.update();po=bpy.data.objects.new('Pocket',pm);bpy.context.collection.objects.link(po);pm.materials.append(mats[0]);pu=pm.uv_layers.new(name='UVMap')
  for p in pm.polygons:
   p.use_smooth=True
   for l in p.loop_indices:x,y,z=design(pm.vertices[pm.loops[l].vertex_index].co);pu.data[l].uv=(.5+x/panel_w,(y-low)/body_h)
  bpy.context.view_layer.objects.active=po;po.select_set(True);ps=po.modifiers.new('Soft pocket edges','SUBSURF');ps.levels=1;bpy.ops.object.modifier_apply(modifier=ps.name)
  bm=bmesh.new();bm.from_mesh(po.data);edges=[e for e in bm.edges if len(e.link_faces)==1];adj={}
  for e in edges:
   a,b=e.verts;adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
  start=next(iter(adj));previous=None;current=start;seam=[]
  while True:
   p=design(current.co);seam.append((p[0],p[1],p[2]+.0008));options=[v for v in adj[current] if v!=previous];nxt=options[0];previous,current=current,nxt
   if current==start:break
  bm.free();curve('Pocket topstitch',seam,.0004,mats[6],True)
 bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
 for ob in bpy.context.selected_objects:
  if ob.type=='MESH':
   for p in ob.data.polygons:p.use_smooth=True
 meta={'id':kind,'revision':2,'panelWidth':panel_w,'panelHeight':body_h,'bodyWidth':2*w,'height':1.75 if hood else body_h,'defaultLogoWidth':.32,'zones':{'front':{'width':panel_w,'height':body_h,'printWidth':2*w,'wrap':False,'defaultX':.5,'defaultY':.34},'back':{'width':panel_w,'height':body_h,'printWidth':2*w,'wrap':False,'defaultX':.5,'defaultY':.38},**sleeve_meta},'source':'Original continuous garment with fitted sleeve UVs'}
 obj['brandmock']=json.dumps(meta);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,kind+'.blend'));bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+'.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_apply=True,export_extras=True)
 with open(os.path.join(OUT,kind+'.json'),'w') as f:json.dump(meta,f,indent=2)
 print('MODEL_READY',kind,flush=True)
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,low-.08));bpy.context.object.data.materials.append(mat('Studio floor',(.72,.73,.72)))
 world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.56,.58,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
 for loc,power,size in [((-2.5,-3.5,4.2),450,4),((2.7,-1.2,2),230,3),((0,2.8,3),400,3)]:
  bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,.08))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(1.5,-5.5,1.2));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.12 if hood else 0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.35
 scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,kind+'-preview.png');bpy.ops.render.render(write_still=True)

kinds=[sys.argv[sys.argv.index('--only')+1]] if '--only' in sys.argv else ['tee-regular','tee-oversized','hoodie-boxy']
for kind in kinds:build(kind)
