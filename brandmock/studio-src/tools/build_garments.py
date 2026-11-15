"""Original parametric cut-and-sewn garment meshes. No third-party model assets.
Blender 4.3: blender -b --python tools/build_garments.py -- /absolute/output
Axes in design functions: X horizontal, Y height, Z depth; converted to Blender Z-up.
"""
import bpy, math, json, sys, os
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt
from math import sin,cos,pi,sqrt,exp
OUT=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else os.path.abspath('public/models')
os.makedirs(OUT,exist_ok=True)
SOURCE_OUT=os.path.abspath(os.path.join(OUT,'../../sources'))
os.makedirs(SOURCE_OUT,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0

def co(x,y,z):return (x,-z,y)
def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.87;p.inputs['Sheen Weight'].default_value=.26
 return m

def tube(name,points,radius,mat,closed=False):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=3;curve.bevel_depth=radius;curve.bevel_resolution=2;spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for p,v in zip(spline.bezier_points,points):p.co=co(*v);p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 spline.use_cyclic_u=closed;ob=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat);return ob

def outline(kind):
 if kind=='hoodie-boxy':
  anchors=[(-.50,-.69),(.50,-.69),(.515,.12),(.615,-.57),(.84,-.53),(.75,.31),(.55,.60),(.20,.70),(.16,.64),(.10,.60),(0,.58),(-.10,.60),(-.16,.64),(-.20,.70),(-.55,.60),(-.75,.31),(-.84,-.53),(-.615,-.57),(-.515,.12)]
 elif kind=='tee-oversized':
  anchors=[(-.48,-.72),(.48,-.72),(.49,.10),(.87,.025),(.98,.36),(.57,.66),(.20,.68),(.16,.64),(.10,.62),(0,.61),(-.10,.62),(-.16,.64),(-.20,.68),(-.57,.66),(-.98,.36),(-.87,.025),(-.49,.10)]
 else:
  anchors=[(-.38,-.68),(.38,-.68),(.415,.19),(.72,.08),(.86,.37),(.45,.65),(.18,.66),(.145,.625),(.09,.606),(0,.595),(-.09,.606),(-.145,.625),(-.18,.66),(-.45,.65),(-.86,.37),(-.72,.08),(-.415,.19)]
 return anchors

def inside(x,y,p):
 result=False
 for a,b in zip(p,p[1:]+p[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
 return result

def build(kind):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 mats=[material('Print_Front',(.065,.095,.14)),material('Print_Back',(.065,.095,.14)),material('Fabric',(.065,.095,.14)),material('Ribbing',(.052,.078,.12)),material('Stitching',(.043,.066,.102)),material('Drawstrings',(.72,.70,.65))]
 anchors=outline(kind);hood=kind=='hoodie-boxy';wide=kind!='tee-regular';bw=.50 if hood else .48 if wide else .40;depth=.195 if hood else .18 if wide else .165;bound=max(abs(x) for x,y in anchors);low=min(y for x,y in anchors);high=max(y for x,y in anchors)
 def z_at(x,y,back=False):
  width=bw*(1+.025*sin((y-low)/(high-low)*pi));body=depth*sqrt(max(0,1-(x/width)**2))
  if hood:
   ax,ay=.56,.48;bx,by=.73,-.55;rad=.128;thick=.112
  else:
   ax,ay=(.53,.48) if wide else (.45,.49);bx,by=(.91,.19) if wide else (.78,.23);rad=.19 if wide else .165;thick=.118 if wide else .107
  vx,vy=bx-ax,by-ay;length=sqrt(vx*vx+vy*vy);t=((abs(x)-ax)*vx+(y-ay)*vy)/(length*length);dist=((abs(x)-ax)*(-vy)+(y-ay)*vx)/length
  sleeve=thick*sqrt(max(0,1-(dist/rad)**2)) if -.25<t<1.12 else 0
  base=max(body,sleeve);fade=min(1,max(0,base/.07));hem=exp(-((y-low-.14)/.26)**2)
  folds=(.013*sin(22*x+3.5*y)+.007*sin(38*x-7*y+.4))*hem
  folds+=.004*sin(20*y+13*abs(x))*exp(-((abs(x)-bw*.82)/.13)**2)
  folds+=.010*sin(15*x+2*y+.4*sin(4*y))*exp(-((y+.03)/.6)**2);
  armpit=sqrt((abs(x)-bw*.9)**2+(y-.18)**2);folds+=.012*sin(33*armpit)*exp(-(armpit/.19)**2)
  if back:folds+=.004*sin(20*x-6*y)
  return max(.002,base+folds*fade)*(-1 if back else 1)
 verts=[];faces=[];uvs=[];material_indices=[];boundaries=[]
 for back in [False,True]:
  polygon=[];tags=[]
  adjusted=[(x,y+(.045*(1-abs(x)/.21) if back and abs(x)<.21 and y>.54 else 0)) for x,y in anchors]
  for i,(a,b) in enumerate(zip(adjusted,adjusted[1:]+adjusted[:1])):
   count=max(2,math.ceil(math.dist(anchors[i],anchors[(i+1)%len(anchors)])/.023))
   for k in range(count):polygon.append((a[0]+(b[0]-a[0])*k/count,a[1]+(b[1]-a[1])*k/count));tags.append(i)
  points=[Vector(v) for v in polygon];edges=[(i,(i+1)%len(polygon)) for i in range(len(polygon))];step=.026
  for yy in range(math.ceil((high-low)/step)+1):
   y=low+step*.7+yy*step
   for xx in range(math.ceil(2*bound/step)+1):
    x=-bound+step*.55+xx*step
    if inside(x,y,adjusted) and min((Vector((x,y))-Vector(v)).length for v in polygon)>.012:points.append(Vector((x,y)))
  result=delaunay_2d_cdt(points,edges,[list(range(len(polygon)))],1,1e-7);coords,_,tris,orig,_,_=result;offset=len(verts)
  for x,y in coords:
   verts.append(co(x,y,z_at(x,y,back)));uvs.append(((.5-x/(2*bound)) if back else (.5+x/(2*bound)),(y-low)/(high-low)))
  for f in tris:
   if len(f)!=3:continue
   a,b,c=[coords[i] for i in f];area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);f=list(f)
   if (area>0)==back:f.reverse()
   faces.append([offset+i for i in f]);cx=sum(coords[i].x for i in f)/3;cy=sum(coords[i].y for i in f)/3;rib=cy<low+.04 or hood and abs(cx)>.59 and cy<-.48;material_indices.append(3 if rib else 1 if back else 0)
  mapping={j:i+offset for i,source in enumerate(orig) for j in source if j<len(polygon)};boundaries.append((polygon,tags,mapping))
 # Sew matching boundary edges, leaving the hem, neckline and sleeve ends open.
 front,tags,fmap=boundaries[0];backpoly,_,bmap=boundaries[1]
 for i,(a,b) in enumerate(zip(front,front[1:]+front[:1])):
  j=(i+1)%len(front);tag=tags[i];aa=anchors[tag];bb=anchors[(tag+1)%len(anchors)]
  neck=abs(aa[0])<=.21 and abs(bb[0])<=.21 and min(aa[1],bb[1])>.54
  hem=max(aa[1],bb[1])<low+.02
  cuff=(abs(aa[0])>bound*.70 and abs(bb[0])>bound*.70 and math.dist(aa,bb)<.40) if not hood else (max(aa[1],bb[1])<-.45 and min(abs(aa[0]),abs(bb[0]))>.55)
  if not neck and not hem and not cuff:faces.append([fmap[i],bmap[i],bmap[j],fmap[j]]);material_indices.append(2)
 mesh=bpy.data.meshes.new(kind);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(kind,mesh);bpy.context.collection.objects.link(obj)
 for mat in mats:mesh.materials.append(mat)
 uv=mesh.uv_layers.new(name='UVMap')
 for poly,mi in zip(mesh.polygons,material_indices):
  poly.material_index=mi;poly.use_smooth=True
  for loop_id in poly.loop_indices:uv.data[loop_id].uv=uvs[mesh.loops[loop_id].vertex_index]
 bpy.context.view_layer.objects.active=obj;obj.select_set(True);sub=obj.modifiers.new('Soft sewn cloth','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name);solid=obj.modifiers.new('Cotton thickness','SOLIDIFY');solid.thickness=.0035;solid.offset=-1;solid.use_even_offset=True;solid.material_offset=2;solid.material_offset_rim=3;bpy.ops.object.modifier_apply(modifier=solid.name)
 # Closed, raised ribbed collar at the true neckline boundary.
 neck_ids=[i for i,(x,y) in enumerate(front) if abs(x)<.211 and y>.545]
 neckloop=[(front[i][0],front[i][1]+.008,z_at(*front[i])) for i in neck_ids]+[(backpoly[i][0],backpoly[i][1]+.008,z_at(*backpoly[i],True)) for i in reversed(neck_ids)]
 tube('Ribbed neckline',neckloop,.0065 if hood else .009,mats[3],True)
 # Hem twin needle stitch lines follow the same draped surface as the body.
 for is_back in [False,True]:
  for dy in [.021,.029]:tube('Twin hem stitch',[(x,low+dy,z_at(x,low+dy,is_back)+(-.0018 if is_back else .0018)) for x in [-bw+.02+i*(2*bw-.04)/35 for i in range(36)]],.00065,mats[4])
 if hood:
  hv=[];hf=[];rings=28;steps=64
  for i in range(rings+1):
   t=i/rings;y=.66+.49*t;cap=sqrt(max(.00015,1-((y-.84)/.31)**2));rx=.26*cap;rz=.22*cap;gap=.42+.38*sin(t*pi);cz=-.025-.025*t
   for j in range(steps+1):
    angle=gap+(2*pi-2*gap)*j/steps;x=rx*sin(angle);z=cz+rz*cos(angle);wrinkle=.004*sin(5*angle+7*t)*sin(t*pi);hv.append(co(x,y,z+wrinkle))
  for i in range(rings):
   for j in range(steps):a=i*(steps+1)+j;hf.append((a,a+1,a+steps+2,a+steps+1))
  hm=bpy.data.meshes.new('Hood cloth');hm.from_pydata(hv,[],hf);hm.update();ho=bpy.data.objects.new('Hood',hm);bpy.context.collection.objects.link(ho);ho.data.materials.append(mats[2]);ho.data.materials.append(mats[3]);
  for f in hm.polygons:f.use_smooth=True
  bpy.context.view_layer.objects.active=ho;ho.select_set(True);th=ho.modifiers.new('Hood lining','SOLIDIFY');th.thickness=.004;th.material_offset=1;bpy.ops.object.modifier_apply(modifier=th.name)
  for side in [0,steps]:tube('Hood edge binding',[(hv[i*(steps+1)+side][0],hv[i*(steps+1)+side][2],-hv[i*(steps+1)+side][1]) for i in range(rings+1)],.007,mats[3])
  tube('Hood back seam',[(hv[i*(steps+1)+steps//2][0],hv[i*(steps+1)+steps//2][2],-hv[i*(steps+1)+steps//2][1]) for i in range(rings)],.0012,mats[4])
  for sign in [-1,1]:tube('Cotton drawcord',[(sign*.115,.67,.19),(sign*.12,.57,.22),(sign*.105,.44,.225),(sign*.11,.34,.205)],.0032,mats[5])
  # Kangaroo pocket: matching UVs allow a large design to continue across the pocket.
  outline_p=[(-.26,-.50),(.26,-.50),(.28,-.31),(.19,-.19),(-.19,-.19),(-.28,-.31)];pp=[Vector(p) for p in outline_p];pe=[(i,(i+1)%6) for i in range(6)]
  for iy in range(14):
   yy=-.49+iy*.023
   for ix in range(25):
    xx=-.27+ix*.023
    if inside(xx,yy,outline_p):pp.append(Vector((xx,yy)))
  pc,_,pf,_,_,_=delaunay_2d_cdt(pp,pe,[list(range(6))],1,1e-7);pv=[co(x,y,z_at(x,y)+.012) for x,y in pc];pm=bpy.data.meshes.new('Pocket cloth');pm.from_pydata(pv,[],pf);pm.update();po=bpy.data.objects.new('Kangaroo pocket',pm);bpy.context.collection.objects.link(po);po.data.materials.append(mats[0]);puv=pm.uv_layers.new(name='UVMap')
  for loop in pm.loops:x,y=pc[loop.vertex_index];puv.data[loop.index].uv=(.5+x/(2*bound),(y-low)/(high-low))
  bpy.context.view_layer.objects.active=po;po.select_set(True);ps=po.modifiers.new('Soft pocket','SUBSURF');ps.levels=1;bpy.ops.object.modifier_apply(modifier=ps.name)

  tube('Pocket seam',[(x,y,z_at(x,y)+.014) for x,y in outline_p],.0013,mats[4],True)
 # Curves become actual reusable mesh assets; no procedural Blender dependencies at runtime.
 bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
 for ob in bpy.context.selected_objects:
  if ob.type=='MESH':
   for f in ob.data.polygons:f.use_smooth=True
 metadata={'id':kind,'panelWidth':2*bound,'panelHeight':high-low,'bodyWidth':2*bw,'height':1.84 if hood else high-low,'defaultLogoWidth':.32 if hood else .30,'source':'Original procedural sewing pattern','frontMaterial':'Print_Front','backMaterial':'Print_Back'}
 obj['brandmock']=json.dumps(metadata)
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE_OUT,kind+'.blend'))
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+'.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_extras=True,export_cameras=False,export_lights=False,export_apply=True,export_yup=True)
 with open(os.path.join(OUT,kind+'.json'),'w') as f:json.dump(metadata,f,indent=2)
 print('MODEL_READY',kind,'vertices',sum(len(o.data.vertices) for o in bpy.context.selected_objects if o.type=='MESH'),flush=True)
 # Independent studio preview for geometry review.
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,low-.10));floor=bpy.context.object;floor.data.materials.append(material('Studio floor',(.72,.73,.72)))
 world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.56,.58,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
 for loc,power,size in [((-2.5,-3.5,4.2),450,4),((2.7,-1.2,2),230,3),((0,2.8,3),400,3)]:
  bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,.1))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(2.0,-5.2,1.5));camera=bpy.context.object;target=Vector((0,0,.17 if hood else 0));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.45;bpy.context.scene.camera=camera
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,kind+'-preview.png');bpy.ops.render.render(write_still=True)

kinds=[sys.argv[sys.argv.index('--only')+1]] if '--only' in sys.argv else ['tee-regular','tee-oversized','hoodie-boxy']
for kind in kinds:build(kind)
