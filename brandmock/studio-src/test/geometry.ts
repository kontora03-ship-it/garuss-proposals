import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import {models,defaults,validate,zones,layerDefaults,type ModelMeta} from '../src/types';
import {designCorners,layerContains} from '../src/designTexture';
import {migrateProject} from '../src/projectStorage';
for(const model of models){
 const meta:ModelMeta=JSON.parse(await readFile(new URL('../public/models/'+model.id+'.json',import.meta.url),'utf8'));
 const bytes=await readFile(new URL('../public/models/'+model.id+'.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const found=new Set<string>();let triangles=0;
 gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3;found.add((o.material as T.Material).name.split('.')[0]);if((o.material as T.Material).name.startsWith('Print_')){const uv=g.attributes.uv;assert(uv);for(let i=0;i<uv.count;i++)assert(Number.isFinite(uv.getX(i)+uv.getY(i))&&uv.getX(i)>=-.01&&uv.getX(i)<=1.01&&uv.getY(i)>=-.01&&uv.getY(i)<=1.01)}});
 for(const n of ['Front','Back','LeftSleeve','RightSleeve'])assert(found.has('Print_'+n));assert(triangles>10000);
 for(const zone of zones)for(const aspect of [.25,1,2,5])for(const rotation of [-90,-45,0,45,90,180]){
  const m=meta.zones[zone],p={...layerDefaults(zone),rotation},c=designCorners(meta,p,aspect*100,100,2048,zone).map(([x,y])=>[x*m.width/2048,y*m.height/2048]);
  const edge=(a:number,b:number)=>Math.hypot(c[a][0]-c[b][0],c[a][1]-c[b][1]);assert(Math.abs(edge(0,1)/edge(1,2)-aspect)<1e-9,'Rotation must preserve physical logo aspect');
  const layer={...defaults.layers[0],...p,zone,canvas:{width:aspect*100,height:100},renderKey:'test'} as any;assert(layerContains(meta,layer,p.x,p.y));assert(!layerContains(meta,layer,p.x,p.y+2));
 }
 const sleeve={...defaults.layers[0],...layerDefaults('leftSleeve'),zone:'leftSleeve',x:.99,canvas:{width:100,height:100},renderKey:'test'} as any;assert(layerContains(meta,sleeve,.01,sleeve.y),'Wrapped sleeve hit testing');
 console.log(model.id+': four real UV surfaces, rotated physical proportions and sleeve seam PASS');
}
validate(defaults);assert.throws(()=>validate({...defaults,layers:[defaults.layers[0],defaults.layers[0]]}));assert.throws(()=>validate({...defaults,layers:[{...defaults.layers[0],rotation:NaN}]}));
const original=new File(['original bytes'],'logo.svg',{type:'image/svg+xml'});
const old={...defaults,side:'front',logoColor:'#ff0000',recolor:true,removeBackground:false,placements:{front:layerDefaults('front'),back:{...layerDefaults('back'),rotation:32}}};
const migrated=migrateProject({version:1,settings:old,logo:original});assert.equal(migrated.settings.layers.length,2);assert.equal(migrated.settings.layers[1].rotation,32);assert.equal(await migrated.assets['legacy-logo'].text(),'original bytes');assert.throws(()=>migrateProject({...migrated,assets:{}}));console.log('Project validation and lossless v1 migration PASS');
