"""BrandMock garment revision 4: continuous torso with fitted, separately unwrapped sleeves.
Original meshes only. Blender 4.3; design axes X=right, Y=up, Z=front.
"""
import bpy,math,sys,os,json,bmesh
from math import sin,cos,pi,sqrt,exp
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import delaunay_2d_cdt,closest_point_on_tri
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
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=1;p.inputs['Specular IOR Level'].default_value=.15;p.inputs['Sheen Weight'].default_value=.22;return m

def curve(name,pts,r,material,closed=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=r;c.bevel_resolution=2;sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,v in zip(sp.points,pts):p.co=(*co(*v),1)
 sp.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material);return o

def closed_outward(mesh):
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 bm.to_mesh(mesh);bm.free();mesh.update()

def relax_cloth(obj,neck,top,shoulder,arm_high,w,low,ax,center,endx,endy):
 scene=bpy.context.scene;scene.frame_set(1);scene.gravity=(0,0,-2)
 vg=obj.vertex_groups.new(name='Shoulder support')
 for v in obj.data.vertices:
  x,y,z=design(v.co);boundary=top+(arm_high-top)*max(0,abs(x)-neck)/max(.01,shoulder-neck)
  weight=smooth((y-(boundary-.07))/.055) if abs(x)<shoulder+.02 else 0
  if abs(x)<neck*1.08 and y>top-.095:weight=1
  if weight>0:vg.add([v.index],weight,'REPLACE')
 # Smooth, non-rendering elliptical torso support.
 verts=[];faces=[];N=64;R=28
 for i in range(R+1):
  t=i/R;y=low-.12+(top-low+.13)*t;shoulder_cap=sqrt(max(.01,1-max(0,(y-.40)/.30)**2));rx=w*.82*shoulder_cap;rz=.157*shoulder_cap
  for j in range(N):a=2*pi*j/N;verts.append(co(rx*cos(a),y,rz*sin(a)))
 for i in range(R):
  for j in range(N):k=(j+1)%N;faces.append((i*N+j,i*N+k,(i+1)*N+k,(i+1)*N+j))
 faces += [tuple(reversed(range(N))),tuple(R*N+j for j in range(N))]
 mesh=bpy.data.meshes.new('Offline torso support');mesh.from_pydata(verts,[],faces);mesh.update();closed_outward(mesh);support=bpy.data.objects.new('Offline torso support',mesh);bpy.context.collection.objects.link(support);support.modifiers.new('Collision','COLLISION');support.collision.thickness_outer=.004
 supports=[support]
 for sign in [-1,1]:
  av=[];af=[];AN=40;AR=24;axis=Vector((endx-ax,endy-center));axis.normalize();perp=Vector((-axis.y,axis.x))
  for i in range(AR+1):
   t=i/AR;cx=ax+(endx-ax)*t+.075*sin(pi*t);cy=center+(endy-center)*t;perp=Vector((-(endy-center),endx-ax+.075*pi*cos(pi*t)));perp.normalize();ry=.14*(1-t)+.068*t;rz=.125*(1-t)+.068*t
   for j in range(AN):a=2*pi*j/AN;av.append(co(sign*(cx+perp.x*ry*cos(a)),cy+perp.y*ry*cos(a),rz*sin(a)))
  for i in range(AR):
   for j in range(AN):k=(j+1)%AN;af.append((i*AN+j,i*AN+k,(i+1)*AN+k,(i+1)*AN+j))
  af += [tuple(reversed(range(AN))),tuple(AR*AN+j for j in range(AN))]
  am=bpy.data.meshes.new('Arm support');am.from_pydata(av,[],af);am.update();closed_outward(am);arm=bpy.data.objects.new('Offline arm support',am);bpy.context.collection.objects.link(arm);arm.modifiers.new('Collision','COLLISION');arm.collision.thickness_outer=.003;supports.append(arm)
 bpy.context.view_layer.objects.active=obj;cloth=obj.modifiers.new('Offline cotton relaxation','CLOTH');cs=cloth.settings;cs.quality=12;cs.mass=.22;cs.tension_stiffness=30;cs.compression_stiffness=30;cs.shear_stiffness=10;cs.bending_stiffness=5;cs.vertex_group_mass=vg.name;cs.pin_stiffness=1;cs.air_damping=4
 cloth.collision_settings.use_self_collision=False;cloth.collision_settings.distance_min=.004;cloth.point_cache.frame_start=1;cloth.point_cache.frame_end=8
 for frame in range(1,9):scene.frame_set(frame);bpy.context.view_layer.update();obj.evaluated_get(bpy.context.evaluated_depsgraph_get());print('CLOTH_FRAME',frame,flush=True)
 bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=cloth.name);
 for support in supports:bpy.data.objects.remove(support,do_unlink=True)
 scene.frame_set(1)
 print('CLOTH_BAKED',len(obj.data.vertices),flush=True)

def build(kind):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 hood=kind=='hoodie-boxy';wide=kind!='tee-regular';low=-.62 if hood else -.72 if wide else -.68;w=.53 if hood else .50 if wide else .395;arm_low=.11 if hood else .18 if wide else .20;arm_high=.53 if hood else .575 if wide else .595;shoulder=.575 if hood else .565 if wide else .455;neck=.205 if hood else .19 if wide else .175;neckz=.17 if hood else .15;depth=.227 if hood else .182 if wide else .155;armz=.185 if hood else .160 if wide else .14;top=.665 if hood else .66
 center=(arm_low+arm_high)/2;ry=(arm_high-arm_low)/2;ax=(w+shoulder)/2;dx=(shoulder-w)/2;body_h=top-low;panel_w=2*shoulder;cloth=.0022 if hood else .00125
 mats=[mat('Print_Front',(.035,.055,.08)),mat('Print_Back',(.035,.055,.08)),mat('Print_LeftSleeve',(.035,.055,.08)),mat('Print_RightSleeve',(.035,.055,.08)),mat('Fabric',(.035,.055,.08)),mat('Ribbing',(.030,.047,.071)),mat('Stitching',(.026,.041,.062)),mat('Drawstrings',(.54,.53,.48)),mat('HoodLining',(.023,.035,.05))]
 def width_at(y):
  if y>=arm_low:return w+(shoulder-w)*(y-arm_low)/(arm_high-arm_low)
  t=max(0,min(1,(y-low)/(arm_low-low)));return w*((.90+.10*smooth(t/.20)+.018*sin(pi*t)) if hood else (.985+.015*smooth(t/.15)-.018*sin(pi*t)))
 def neckline(x,back=False):
  front_center=.603 if hood else .593;back_center=.637;v=sqrt(max(0,1-(x/neck)**2));return (back_center if back else front_center)+(top-(back_center if back else front_center))*(1-v),neckz*v
 def body_z(x,y,back=False):
  # The armhole boundary is a true ellipse. No max(body,sleeve) junction ridges.
  width=width_at(y);t=(y-center)/ry;hole=armz*sqrt(max(0,1-t*t)) if arm_low<=y<=arm_high else 0;factor=max(0,1-(hole/depth)**2);u=max(-1,min(1,x/width));z=sqrt(max(0,depth*depth*(1-u*u)+hole*hole*u**6))
  if abs(x)<=neck:boundary,z_top=neckline(x,back)
  else:boundary=top+(arm_high-top)*(abs(x)-neck)/(shoulder-neck);z_top=0
  blend=smooth((y-(boundary-.14))/.14);z=z*(1-blend)+z_top*blend+hole*abs(u)**6*blend
  fade=max(0,1-u*u)*(1-blend);hem=exp(-((y-low-.14)/.25)**2)
  folds=(.008*sin(14*x+2.7*y)+.004*sin(26*x-3*y+.6))*hem
  if hood:
   gathers=exp(-((y-low-.12)/.16)**2);folds+=(.012*sin(31*x+1.8*y)+.004*sin(57*x-4*y))*gathers
   folds+=.007*sin(16*y+9*abs(x))*exp(-((abs(x)-w*.70)/.11)**2-((y+.1)/.4)**2)
   z*=1-.10*(1-smooth((y-low)/.11))
   if y<low+.09:folds+=.00065*cos(240*x)
  folds+=(.008 if hood else .0045)*sin(12*x+1.5*y+(1 if back else 0))*exp(-((y+.12)/.5)**2)
  folds+=.006*sin(18*(y-.2)+8*abs(x))*exp(-((abs(x)-w*.74)/.12)**2-((y-.23)/.2)**2)
  return (z+folds*fade)*(-1 if back else 1)
 def body_y(x,y):return y+.003*sin(6*x+1)*exp(-((y-low)/.08)**2)
 vertices=[];faces=[];face_uv=[];face_mat=[]
 def addv(p):vertices.append(co(*p));return len(vertices)-1
 def face(ids,material,uv):faces.append(ids);face_mat.append(material);face_uv.append(uv)
 # Structured quad panels: stable cloth elements and an exact shared armhole sampling.
 for back in [False,True]:
  grid=[];coords=[];NX=64;lower_rows=40;upper_rows=10
  ys=[low+(arm_low-low)*i/lower_rows for i in range(lower_rows)]
  ys += [arm_low if i==0 else arm_high if i==32 else center+ry*cos(pi-pi*i/32) for i in range(33)]
  for y in ys:
   row=[];xy=[]
   for j in range(NX+1):
    x=(-1+2*j/NX)*width_at(y);row.append(addv((x,body_y(x,y),body_z(x,y,back))));xy.append((x,y))
   grid.append(row);coords.append(xy)
  for i in range(1,upper_rows+1):
   row=[];xy=[];t=i/upper_rows
   for j in range(NX+1):
    x=(-1+2*j/NX)*shoulder
    if abs(x)<=neck:boundary,_=neckline(x,back)
    else:boundary=top+(arm_high-top)*(abs(x)-neck)/(shoulder-neck)
    y=arm_high+(boundary-arm_high)*t;row.append(addv((x,body_y(x,y),body_z(x,y,back))));xy.append((x,y))
   grid.append(row);coords.append(xy)
  for i in range(len(grid)-1):
   for j in range(NX):
    index=[(i,j),(i,j+1),(i+1,j+1),(i+1,j)]
    if back:index.reverse()
    uv=[(.5+(-1 if back else 1)*coords[r][c][0]/panel_w,(coords[r][c][1]-low)/body_h) for r,c in index]
    avg=sum(coords[r][c][1] for r,c in index)/4;mi=5 if hood and avg<low+.09 else 1 if back else 0
    face([grid[r][c] for r,c in index],mi,uv)
 # Each sleeve has its own continuous cylindrical UV island, including the back half.
 sleeve_meta={}
 for side,sign,material in [('leftSleeve',1,2),('rightSleeve',-1,3)]:
  endx=.70 if hood else .94 if wide else .80;endy=-.80 if hood else .10 if wide else .16;length=math.hypot(endx-ax,endy-center);end_ry=.112 if hood else .164 if wide else .146;end_rz=.094 if hood else .12 if wide else .105;rings=64 if hood else 30;segs=64;v_ids=[]
  perp=Vector((-(endy-center),endx-ax));perp.normalize()
  for i in range(rings+1):
   t=i/rings;cx=ax+(endx-ax)*t+(.075*sin(pi*t) if hood else 0);cy=center+(endy-center)*t;
   if hood:perp=Vector((-(endy-center),endx-ax+.075*pi*cos(pi*t)));perp.normalize()
   blend=smooth(t);vx=dx/ry*(1-blend)+perp.x*blend;vy=1*(1-blend)+perp.y*blend;n=math.hypot(vx,vy);vx/=n;vy/=n
   rad_y=ry+(end_ry-ry)*t;rad_z=armz+(end_rz-armz)*t;band=(.12 if hood else .018)/length
   cuff=smooth((t-(1-band))/(band*.25)) if hood else 0
   fullness=(.022*exp(-((t-.64)/.26)**2)+.012*exp(-((t-.82)/.12)**2)) if hood else .004*sin(pi*t);rad_y=(rad_y+fullness)*(1-.14*cuff);rad_z=(rad_z+fullness*.8)*(1-.14*cuff)
   ring=[]
   for j in range(segs):
    a=2*pi*j/segs;xx=cx+vx*rad_y*cos(a);yy=cy+vy*rad_y*cos(a);zz=rad_z*sin(a)
    if i==0:xx=ax+dx*cos(a);yy=center+ry*cos(a);zz=armz*sin(a)
    else:
     envelope=sin(pi*t)**2;crease=(.012 if hood else .0035)*sin(15*t+3*a)*envelope+.003*sin(25*t-2*a)*envelope
     if hood:crease+=.008*sin(43*t+2.5*a)*exp(-((t-.78)/.16)**2)*(1-cuff)+.00065*cos(16*a)*cuff
     xx+=crease*vx*cos(a);yy+=crease*vy*cos(a);zz+=crease*sin(a)
    ring.append(addv((sign*xx,yy,zz)))
   v_ids.append(ring)
  for i in range(rings):
   for j in range(segs):
    k=(j+1)%segs;vs=[v_ids[i][j],v_ids[i][k],v_ids[i+1][k],v_ids[i+1][j]];uv=[(j/segs,1-i/rings),((j+1)/segs,1-i/rings),((j+1)/segs,1-(i+1)/rings),(j/segs,1-(i+1)/rings)]
    if sign<0:vs.reverse();uv.reverse()
    face(vs,5 if i/rings>1-(.115 if hood else .016)/length else material,uv)
  for band_t in ([1-.115/length,.98] if hood else [.95]):
   ring=v_ids[round(band_t*rings)];curve('Cuff topstitch',[design(Vector(vertices[idx])) for idx in ring],.00042,mats[6],True)
  circumference=pi*(3*(ry+armz)-sqrt((3*ry+armz)*(ry+3*armz)))
  sleeve_meta[side]={'width':circumference,'height':length,'printWidth':.27 if hood else .24,'wrap':True,'defaultX':.16,'defaultY':.38}
 mesh=bpy.data.meshes.new(kind);mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(kind,mesh);bpy.context.collection.objects.link(obj)
 for m in mats:mesh.materials.append(m)
 uv_layer=mesh.uv_layers.new(name='UVMap')
 for p,mi,uv in zip(mesh.polygons,face_mat,face_uv):
  p.material_index=mi;p.use_smooth=True
  for loop,v in zip(p.loop_indices,uv):uv_layer.data[loop].uv=v
 # Weld true shared armhole/shoulder boundaries; sleeves remain separate UV/material islands.
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.dissolve_degenerate(bm,dist=.0000001,edges=list(bm.edges))
 # Every sleeve boundary sample must weld to a torso sample; reject T-junction gaps.
 open_armhole=[]
 for edge in bm.edges:
  if len(edge.link_faces)!=1:continue
  x,y,z=design((edge.verts[0].co+edge.verts[1].co)*.5);seam_x=ax+dx*(y-center)/ry
  if arm_low-.01<y<arm_high+.01 and abs(abs(x)-seam_x)<.035:open_armhole.append(edge)
 if open_armhole:
  for e in open_armhole:print('OPEN_ARMHOLE',kind,[tuple(round(v,6) for v in design(p.co)) for p in e.verts],flush=True)
  raise RuntimeError('Unwelded armhole edges: '+str(len(open_armhole)))
 if '--check-joins' in sys.argv:
  print('ARMHOLE_JOIN_PASS',kind,flush=True);bm.free();return
 # Fair the welded armholes over neighbouring rows so shoulder tangents meet smoothly.
 seam_verts=[]
 for v in bm.verts:
  x,y,z=design(v.co);seam_x=ax+dx*(y-center)/ry
  if arm_low-.025<y<arm_high+.025 and abs(abs(x)-seam_x)<.055:seam_verts.append(v)
 for _ in range(10):bmesh.ops.smooth_vert(bm,verts=seam_verts,factor=.32,use_axis_x=True,use_axis_y=True,use_axis_z=True)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 if (hood and '--no-relax' not in sys.argv) or '--relax' in sys.argv:relax_cloth(obj,neck,top,shoulder,arm_high,w,low,ax,center,endx,endy)
 bpy.context.view_layer.objects.active=obj;obj.select_set(True);sub=obj.modifiers.new('Continuous cloth smoothing','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name);outer_faces=len(obj.data.polygons);solid=obj.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=cloth;solid.offset=-1;solid.material_offset=4;solid.material_offset_rim=5;bpy.ops.object.modifier_apply(modifier=solid.name)
 for p in obj.data.polygons:
  if p.index>=outer_faces:p.material_index=4
 surface=BVHTree.FromObject(obj,bpy.context.evaluated_depsgraph_get())
 obj.data.calc_loop_triangles();triangles={}
 for tri in obj.data.loop_triangles:triangles.setdefault(tri.polygon_index,[]).append(tri)
 def project(q):
  loc,normal,index,_=surface.find_nearest(Vector(q));nearest=None;best=1e9
  for tri in triangles[index]:
   positions=[obj.data.vertices[i].co for i in tri.vertices];point=closest_point_on_tri(loc,*positions);distance=(point-loc).length_squared
   if distance<best:nearest=(tri,positions,point);best=distance
  tri,(a,b,c),point=nearest;ab=b-a;ac=c-a;ap=point-a;d00=ab.dot(ab);d01=ab.dot(ac);d11=ac.dot(ac);den=d00*d11-d01*d01
  if abs(den)<1e-18:weights=(1,0,0)
  else:v=(d11*ap.dot(ab)-d01*ap.dot(ac))/den;w=(d00*ap.dot(ac)-d01*ap.dot(ab))/den;weights=(1-v-w,v,w)
  uv=Vector((0,0))
  for loop,weight in zip(tri.loops,weights):uv+=obj.data.uv_layers.active.data[loop].uv*weight
  return loc,normal,uv
 # Invert the original front UV pattern to the deformed cloth, preserving registration.
 uv_vertices=[];uv_faces=[];front_triangles=[]
 for tri in obj.data.loop_triangles:
  if obj.data.polygons[tri.polygon_index].material_index!=0:continue
  start=len(uv_vertices)
  for loop in tri.loops:uv=obj.data.uv_layers.active.data[loop].uv;uv_vertices.append((uv.x,uv.y,0))
  uv_faces.append((start,start+1,start+2));front_triangles.append(tri)
 uv_surface=BVHTree.FromPolygons(uv_vertices,uv_faces,all_triangles=True)
 def pattern_to_cloth(u,v):
  hit,_,index,_=uv_surface.find_nearest(Vector((u,v,0)));tri=front_triangles[index];a,b,c=[Vector(uv_vertices[i]) for i in uv_faces[index]];den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y)
  wa=((b.y-c.y)*(hit.x-c.x)+(c.x-b.x)*(hit.y-c.y))/den;wb=((c.y-a.y)*(hit.x-c.x)+(a.x-c.x)*(hit.y-c.y))/den;weights=(wa,wb,1-wa-wb);loc=Vector((0,0,0));normal=Vector((0,0,0))
  for vertex,weight in zip(tri.vertices,weights):loc+=obj.data.vertices[vertex].co*weight;normal+=obj.data.vertices[vertex].normal*weight
  normal.normalize();return loc,normal,Vector((u,v))
 # Move seams along with baked fabric; no floating rest-pose curves.
 for ob in list(bpy.context.scene.objects):
  if ob.type=='CURVE':
   for spline in ob.data.splines:
    for point in spline.points:
     loc,normal,_=project(point.co.xyz);point.co=(*(loc+normal*.0003),1)

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
  for sign in [-1,1]:
   pts=[]
   for i in range(40):
    t=i/39;x=sign*(neck+(shoulder-neck)*t);y=top+(arm_high-top)*t-.012;q=Vector(co(x,y,body_z(x,y,back)+(-.001 if back else .001)));loc,normal,_,_=surface.find_nearest(q);pts.append(design(loc+normal*.00025))
   curve('Shoulder topstitch',pts,.00045,mats[6])
  for dy in [.014,.020]:
   pts=[]
   for x in [-width_at(low+dy)*.97+i*width_at(low+dy)*1.94/64 for i in range(65)]:
    loc,normal,_=project(co(x,body_y(x,low+dy),body_z(x,low+dy,back)));pts.append(design(loc+normal*.0003))
   curve('Hem stitch',pts,.00038,mats[6])
 if hood:
  # Two sewn side panels. The back centre seam descends into the nape fold,
  # rises over the crown, then rolls forward to the face-opening seam.
  hv=[];hf=[];hood_uvs=[];rows=60;cols=36;panel_edges=[];centre_seam=[]
  back_path=[(0,.637,-.17),(0,.43,-.29),(0,.88,-.35),(0,.93,-.14),(0,.82,.13)]
  face_path=[(.159,.613,.107),(.215,.68,.13),(.200,.785,.13),(.125,.845,.105),(0,.82,.13)]
  def catmull(points,t):
   scaled=t*(len(points)-1);index=min(len(points)-2,int(scaled));v=scaled-index;p0=Vector(points[max(0,index-1)]);p1=Vector(points[index]);p2=Vector(points[index+1]);p3=Vector(points[min(len(points)-1,index+2)]);return .5*((2*p1)+(-p0+p2)*v+(2*p0-5*p1+4*p2-p3)*v*v+(-p0+3*p1-3*p2+p3)*v*v*v)
  for sign in [-1,1]:
   start=len(hv);edge=[]
   for i in range(rows+1):
    t=i/rows;back=catmull(back_path,t);front=catmull(face_path,t)
    for j in range(cols+1):
     u=j/cols;crown=exp(-((t-.73)/.18)**2);x=front.x*u+(.12*(max(0,1-t)**.3)+.065*crown*sin(pi*t))*sin(pi*u);y=back.y+(front.y-back.y)*u+.008*sin(pi*u)*sin(pi*t)+.045*sin(pi*u)*crown;z=back.z+(front.z-back.z)*u+.012*sin(pi*u)*cos(pi*t);angle=-pi/2+(pi/2+.68)*u;nx=neck*cos(angle);ny,_=neckline(nx,sin(angle)<0);nz=neckz*sin(angle);blend=1-smooth(t/.12);x=x*(1-blend)+nx*blend;y=y*(1-blend)+ny*blend;z=z*(1-blend)+nz*blend
     # Soft bias folds follow the sewn panel, fade at the seams.
     envelope=sin(pi*u)*sin(pi*t);z+=.004*sin(8*u+9*t)*envelope;y+=.002*sin(15*u-5*t)*envelope
     point=(sign*x,y,z);hv.append(co(*point));hood_uvs.append((u,t))
     if j==cols:edge.append(point)
     if sign==1 and j==0:centre_seam.append(point)
   panel_edges.append(edge)
   for i in range(rows):
    for j in range(cols):
     a=start+i*(cols+1)+j;face=[a,a+cols+1,a+cols+2,a+1]
     if sign<0:face.reverse()
     hf.append(face)
  hm=bpy.data.meshes.new('Rounded hood');hm.from_pydata(hv,[],hf);hm.update();ho=bpy.data.objects.new('Hood',hm);bpy.context.collection.objects.link(ho);hm.materials.append(mats[4]);hm.materials.append(mats[8]);
  hood_uv=hm.uv_layers.new(name='UVMap')
  for p in hm.polygons:
   p.use_smooth=True
   for l in p.loop_indices:
    v=hm.loops[l].vertex_index;hood_uv.data[l].uv=hood_uvs[v]
  hood_bm=bmesh.new();hood_bm.from_mesh(hm);bmesh.ops.remove_doubles(hood_bm,verts=list(hood_bm.verts),dist=.00002);bmesh.ops.dissolve_degenerate(hood_bm,dist=.00001,edges=list(hood_bm.edges));bmesh.ops.recalc_face_normals(hood_bm,faces=list(hood_bm.faces));
  if hood_bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(hood_bm,faces=list(hood_bm.faces))
  hood_bm.to_mesh(hm);hood_bm.free()
  bpy.context.view_layer.objects.active=ho;ho.select_set(True);hs=ho.modifiers.new('Soft hood','SUBSURF');hs.levels=1;bpy.ops.object.modifier_apply(modifier=hs.name);ht=ho.modifiers.new('Hood lining','SOLIDIFY');ht.thickness=.0025;ht.material_offset=1;bpy.ops.object.modifier_apply(modifier=ht.name)
  for edge in panel_edges:curve('Hood binding',edge,.0032,mats[4])
  curve('Hood centre topstitch',centre_seam,.0005,mats[6])
  for side in [-1,1]:
   fv=[];ff=[];FC=40;FR=8
   for i in range(FR+1):
    v=i/FR
    for j in range(FC+1):
     u=j/FC;a=(.02+u*.70)*pi if side>0 else (.28+u*.70)*pi;x=neck*cos(a);base,z0=neckline(x,False);z=neckz*sin(a);height=(.008+.018*sin(a))*(1-.72*smooth((u-.62)/.38) if side>0 else 1-.72*smooth((.38-u)/.38));y=base+height*v;z+=.009-.075*v*sin(a)+side*.002;fv.append(co(x,y,z))
   for i in range(FR):
    for j in range(FC):a=i*(FC+1)+j;ff.append((a,a+1,a+FC+2,a+FC+1))
   fm=bpy.data.meshes.new('Crossed hood neck fold');fm.from_pydata(fv,[],ff);fm.update();fo=bpy.data.objects.new('Hood crossover',fm);bpy.context.collection.objects.link(fo);fm.materials.append(mats[4]);fu=fm.uv_layers.new(name='UVMap')
   for polygon in fm.polygons:
    polygon.use_smooth=True
    for loop in polygon.loop_indices:idx=fm.loops[loop].vertex_index;fu.data[loop].uv=(idx%(FC+1)/FC,idx//(FC+1)/FR)
   bpy.context.view_layer.objects.active=fo;fold_sub=fo.modifiers.new('Soft folded neckline','SUBSURF');fold_sub.levels=1;bpy.ops.object.modifier_apply(modifier=fold_sub.name);fold_thick=fo.modifiers.new('Double cotton edge','SOLIDIFY');fold_thick.thickness=.003;bpy.ops.object.modifier_apply(modifier=fold_thick.name)
  # Clean boxy pullover, without floating decorative drawcords.
  # A dense conformal patch, with the seam extracted from its actual subdivided boundary.
  pv=[];p_uv=[];pf=[];rows=20;cols=32
  for i in range(rows+1):
   t=i/rows;y=-.49+.33*t;half=.285-.075*smooth((t-.45)/.55)
   for j in range(cols+1):x=-half+2*half*j/cols;q=Vector(co(x,y,body_z(x,y)));loc,normal,uv=pattern_to_cloth(.5+x/panel_w,(y-low)/body_h);pv.append(loc+normal*(.004+.007*sin(pi*t)*sin(pi*j/cols)));p_uv.append(uv)
  for i in range(rows):
   for j in range(cols):a=i*(cols+1)+j;pf.append((a,a+1,a+cols+2,a+cols+1))
  pm=bpy.data.meshes.new('Conformal kangaroo pocket');pm.from_pydata(pv,[],pf);pm.update();po=bpy.data.objects.new('Pocket',pm);bpy.context.collection.objects.link(po);pm.materials.append(mats[0]);pu=pm.uv_layers.new(name='UVMap')
  for p in pm.polygons:
   p.use_smooth=True
   for l in p.loop_indices:pu.data[l].uv=p_uv[pm.loops[l].vertex_index]
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
 meta={'id':kind,'revision':4,'panelWidth':panel_w,'panelHeight':body_h,'bodyWidth':2*w,'height':1.75 if hood else body_h,'defaultLogoWidth':.32,'zones':{'front':{'width':panel_w,'height':body_h,'printWidth':2*w,'wrap':False,'defaultX':.5,'defaultY':.34},'back':{'width':panel_w,'height':body_h,'printWidth':2*w,'wrap':False,'defaultX':.5,'defaultY':.38},**sleeve_meta},'offlineClothRelaxation':(hood and '--no-relax' not in sys.argv) or '--relax' in sys.argv,'source':'Original revision 4 garment with fitted UVs and offline cloth relaxation'}
 obj['brandmock']=json.dumps(meta);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,kind+'.blend'));bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+'.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_apply=True,export_extras=True)
 with open(os.path.join(OUT,kind+'.json'),'w') as f:json.dump(meta,f,indent=2)
 print('MODEL_READY',kind,flush=True)
 floor=min(v.co.z for ob in bpy.context.selected_objects if ob.type=='MESH' for v in ob.data.vertices)-.06
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,floor));bpy.context.object.data.materials.append(mat('Studio floor',(.72,.73,.72)))
 world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.56,.58,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
 for loc,power,size in [((-2.5,-3.5,4.2),450,4),((2.7,-1.2,2),230,3),((0,2.8,3),400,3)]:
  bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,.08))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(1.5,-5.5,1.2));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.12 if hood else 0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.35
 scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,kind+'-preview.png');bpy.ops.render.render(write_still=True)

kinds=[sys.argv[sys.argv.index('--only')+1]] if '--only' in sys.argv else ['tee-regular','tee-oversized','hoodie-boxy']
for kind in kinds:build(kind)
