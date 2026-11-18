"""Continuous surface-aware torso UVs. Preserve UV1 and actual cloth geometry."""
import bpy,json,math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def unwrap_surface(body,prefix,meta,anchor_uv):
 mesh=body.data;mesh.calc_loop_triangles();mi=next(i for i,m in enumerate(mesh.materials)if m.name.startswith(prefix))
 tris=[t for t in mesh.loop_triangles if mesh.polygons[t.polygon_index].material_index==mi]
 points=[];faces=[]
 for t in tris:
  start=len(points);points.extend((mesh.uv_layers[0].data[l].uv.x,mesh.uv_layers[0].data[l].uv.y,0)for l in t.loops);faces.append((start,start+1,start+2))
 tree=BVHTree.FromPolygons(points,faces,all_triangles=True);hit,_,ti,_=tree.find_nearest(Vector((anchor_uv[0],1-anchor_uv[1],0)));tri=tris[ti];anchor_loops=tuple(tri.loops);a,b,c=[Vector(points[i])for i in faces[ti]]
 den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);wa=((b.y-c.y)*(hit.x-c.x)+(c.x-b.x)*(hit.y-c.y))/den;wb=((c.y-a.y)*(hit.x-c.x)+(a.x-c.x)*(hit.y-c.y))/den;weights=np.array([wa,wb,1-wa-wb])
 original_uv1=np.array([tuple(l.uv)for l in mesh.uv_layers[1].data])
 bpy.ops.object.mode_set(mode='OBJECT');bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
 mesh.uv_layers.active_index=0
 bpy.context.scene.tool_settings.mesh_select_mode=(False,False,True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
 for p in mesh.polygons:p.select=p.material_index==mi
 bpy.context.scene.tool_settings.use_uv_select_sync=True
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.uv.unwrap(method='ANGLE_BASED',margin=0);bpy.ops.object.mode_set(mode='OBJECT')
 mesh.calc_loop_triangles();tris=[t for t in mesh.loop_triangles if mesh.polygons[t.polygon_index].material_index==mi]
 loops=[l for p in mesh.polygons if p.material_index==mi for l in p.loop_indices]
 uv=np.array([tuple(mesh.uv_layers[0].data[l].uv)for l in loops]);pos=np.array([tuple(mesh.vertices[mesh.loops[l].vertex_index].co)for l in loops]);sign=-1 if prefix=='Print_Back' else 1
 target=pos[:,[0,2]]*np.array([sign,1]);left,_,right=np.linalg.svd((uv-uv.mean(0)).T@(target-target.mean(0)));rotation=left@right
 area3=area2=0
 for t in tris:
  xyz=np.array([tuple(mesh.vertices[v].co)for v in t.vertices]);q=np.array([tuple(mesh.uv_layers[0].data[l].uv)for l in t.loops]);area3+=np.linalg.norm(np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]))*.5;area2+=abs(np.linalg.det(np.stack([q[1]-q[0],q[2]-q[0]])))*.5
 unit=math.sqrt(area3/area2);physical=(uv@rotation)*unit;anchor_q=(np.array([tuple(mesh.uv_layers[0].data[l].uv)for l in anchor_loops])*weights[:,None]).sum(0)@rotation*unit
 low=physical.min(0);high=physical.max(0);au,av=anchor_uv[0],1-anchor_uv[1]
 width=max(meta['width'],(anchor_q[0]-low[0])/au,(high[0]-anchor_q[0])/(1-au))*1.002
 height=max(meta['height'],(anchor_q[1]-low[1])/av,(high[1]-anchor_q[1])/(1-av))*1.002
 mapped=(physical-anchor_q)/np.array([width,height])+np.array([au,av])
 for li,q in zip(loops,mapped):mesh.uv_layers[0].data[li].uv=tuple(q)
 assert np.array_equal(original_uv1,np.array([tuple(l.uv)for l in mesh.uv_layers[1].data]))
 result=dict(meta);result.pop('projection',None);result.update(width=width,height=height,mapping='surface-torso',calibration={'method':'angle-based surface unwrap','anchor':list(anchor_uv),'areaScale':unit,'surfaceArea':area3})
 print('SURFACE_PRINT_UV',prefix,width,height,area3,flush=True)
 return result
