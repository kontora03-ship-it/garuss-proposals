"""A separate heavyweight fit based on the user-supplied BrockCreative tee.
Old GLB/JSON stay unchanged. Blender --disable-autoexec, original UV atlas retained.
"""
import bpy,os,json,math
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,'public/models');bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,'tee-regular.glb'))
FIT=(1.14,1.04,.94);meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:
 mesh=o.data
 # glTF is imported to Blender Z-up; the -Y axis faces the camera.
 def smoothstep(a,b,x):
  t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
 for v in mesh.vertices:
  v.co.x*=FIT[0];v.co.y*=FIT[1];v.co.z*=FIT[2]
  # A rounder, narrower crew neck. Apply the same continuous deformation to
  # every material so the collar and printable shoulder remain joined.
  upper=smoothstep(.42,.72,v.co.z);centre=1-smoothstep(.40,.70,abs(v.co.x));w=upper*centre
  v.co.x*=1-.28*w
  v.co.z+=w*(.08+.01*smoothstep(-.03,.16,v.co.y))
 mesh.update()
 # Smooth only printable interior vertices. All materials share one Blender mesh.
 import bmesh
 bm=bmesh.new();bm.from_mesh(mesh)
 # Weld only coincident glTF seam vertices; per-corner UVs stay independent.
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 printable={i for i,m in enumerate(mesh.materials)if m.name.startswith('Print_')}
 inside=[v for v in bm.verts if not v.is_boundary and v.link_faces and all(f.material_index in printable for f in v.link_faces)]
 for _ in range(12):bmesh.ops.smooth_vert(bm,verts=inside,factor=.3,use_axis_x=True,use_axis_y=True,use_axis_z=True)
 bm.to_mesh(mesh);bm.free();mesh.update();mesh.normals_split_custom_set([(0,0,0)]*len(mesh.loops))
 # Native Fabric faces are the four collar islands; never reclassify print faces.
 collar={i for i,m in enumerate(mesh.materials)if m.name.startswith('Fabric')}
 for p in mesh.polygons:
  if p.material_index in collar:
   for li in p.loop_indices:
    v=mesh.vertices[mesh.loops[li].vertex_index].co;u=(math.atan2(v.y,v.x)+math.pi)/(2*math.pi);mesh.uv_layers[0].data[li].uv=(u,(v.z-.65)/.25)
 for m in mesh.materials:
  if not m:continue
  if m.name.startswith('Fabric'):m.name='Ribbing_Collar'
  elif m.name=='Ribbing':m.name='Ribbing_Hem'
  m.diffuse_color=(.035,.07,.05,1)
  if m.use_nodes:
   shader=m.node_tree.nodes.get('Principled BSDF')
   if shader:shader.inputs['Base Color'].default_value=m.diffuse_color
meta=json.load(open(os.path.join(OUT,'tee-regular.json')));meta.update(id='tee-studio',revision=6,surfaceProfile='cotton-studio',fitScale=[FIT[0],FIT[2]],source='BrockCreative source adapted by BrandMock: wider heavyweight fit, mild cloth smoothing, original atlas normal map and studio cotton shading')
meta['panelWidth']*=FIT[0];meta['panelHeight']*=FIT[2];meta['bodyWidth']*=FIT[0];meta['height']=max(v.co.z for o in meshes for v in o.data.vertices)-min(v.co.z for o in meshes for v in o.data.vertices)
for zone,m in meta['zones'].items():
 m['width']*=FIT[0];m['height']*=FIT[2]
 if zone in ['front','back']:m['printWidth']*=FIT[0]
meta['credit']['adaptation']='BrandMock Studio: wider/shorter heavyweight fit, round crew neck, smoothed cloth, collar material and native sewing-atlas detail. Derived from the user-supplied BrockCreative model.'
with open(os.path.join(OUT,'tee-studio.json'),'w')as f:json.dump(meta,f,indent=2,ensure_ascii=False)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'tee-studio.glb'),export_format='GLB',use_selection=True,export_animations=False,export_materials='EXPORT',export_copyright='BrockCreative; wider heavyweight fit and material adaptation by BrandMock.')
# Thumbnail from the new mesh. Browser-rendered evidence is produced by the QA script.
floor=min(v.co.z for o in meshes for v in o.data.vertices)-.06
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,floor));floor_mat=bpy.data.materials.new('Floor');floor_mat.diffuse_color=(.65,.68,.65,1);bpy.context.object.data.materials.append(floor_mat)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.72,.74,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
for loc,power,size in [((-2.5,-3.5,4.2),450,4),((2.7,-1.2,2),230,3),((0,2.8,3),400,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.8,-5.5,.3));cam=bpy.context.object;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.5
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'tee-studio-preview.png');bpy.ops.render.render(write_still=True)
print('STUDIO_TEE_READY',flush=True)
