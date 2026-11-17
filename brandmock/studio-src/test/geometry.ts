import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import {models,defaults,validate,zones,layerDefaults,type ModelMeta} from '../src/types';
import {designCorners,layerContains} from '../src/designTexture';
import {migrateProject} from '../src/projectStorage';
const printTriangles:Record<string,Record<string,number>>={};
for(const model of models){
 printTriangles[model.id]={};
 const meta:ModelMeta=JSON.parse(await readFile(new URL('../public/models/'+model.id+'.json',import.meta.url),'utf8'));
 const bytes=await readFile(new URL('../public/models/'+model.id+'.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const found=new Set<string>();let triangles=0;
 gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3;found.add((o.material as T.Material).name.split('.')[0]);if((o.material as T.Material).name.startsWith('Print_')){printTriangles[model.id][(o.material as T.Material).name]=(g.index?.count||g.attributes.position.count)/3;if(meta.surfaceProfile==='cotton-studio')assert(g.getAttribute('uv1'),'Native sewing atlas requires the original UV set');const uv=g.attributes.uv;assert(uv);for(let i=0;i<uv.count;i++)assert(Number.isFinite(uv.getX(i)+uv.getY(i))&&uv.getX(i)>=-.01&&uv.getX(i)<=1.01&&uv.getY(i)>=-.01&&uv.getY(i)<=1.01)}});
 if(meta.credit){let checked=0;gltf.scene.traverse(o=>{assert(!(o as any).isSkinnedMesh,'Published garment must contain no avatar rig');if(!(o instanceof T.Mesh))return;const mat=o.material as T.Material,zone=zones.find(z=>mat.name.startsWith(({front:'Print_Front',back:'Print_Back',leftSleeve:'Print_LeftSleeve',rightSleeve:'Print_RightSleeve'})[z]));const original=o.geometry.getAttribute('uv1');if(!zone||!original)return;const uv=o.geometry.getAttribute('uv'),m=meta.zones[zone];for(let i=1;i<uv.count;i+=17){const physical=Math.hypot((uv.getX(i)-uv.getX(i-1))*m.width/(meta.fitScale?.[0]||1),(uv.getY(i)-uv.getY(i-1))*m.height/(meta.fitScale?.[1]||1)),source=Math.hypot(original.getX(i)-original.getX(i-1),original.getY(i)-original.getY(i-1))*((m as any).sourceScale||2);assert(Math.abs(physical-source)<Math.max(1e-6,source*1e-4),'The artist UV pattern must retain its proportions');checked++}});assert(checked>100);console.log('Artist sewing-pattern UV distances preserved PASS')}
 for(const n of ['Front','Back','LeftSleeve','RightSleeve'])assert(found.has('Print_'+n));assert(triangles>10000);
 for(const zone of zones)for(const aspect of [.25,1,2,5])for(const rotation of [-90,-45,0,45,90,180]){
  const m=meta.zones[zone],p={...layerDefaults(zone),rotation},c=designCorners(meta,p,aspect*100,100,2048,zone).map(([x,y])=>[x*m.width/2048,y*m.height/2048]);
  const edge=(a:number,b:number)=>Math.hypot(c[a][0]-c[b][0],c[a][1]-c[b][1]);assert(Math.abs(edge(0,1)/edge(1,2)-aspect)<1e-9,'Rotation must preserve physical logo aspect');
  const layer={...defaults.layers[0],...p,zone,canvas:{width:aspect*100,height:100},renderKey:'test'} as any;assert(layerContains(meta,layer,p.x,p.y));assert(!layerContains(meta,layer,p.x,p.y+2));
 }
 const sleeve={...defaults.layers[0],...layerDefaults('leftSleeve'),zone:'leftSleeve',x:.99,canvas:{width:100,height:100},renderKey:'test'} as any;assert.equal(layerContains(meta,sleeve,.01,sleeve.y),meta.zones.leftSleeve.wrap,'Sleeve seam respects the authored cut pattern');
 console.log(model.id+': four real UV surfaces, rotated physical proportions and sleeve seam PASS');
}
assert.deepEqual(printTriangles['tee-studio'],printTriangles['tee-regular'],'The new fit must retain every original printable face, including the neckline');
validate(defaults);assert.throws(()=>validate({...defaults,layers:[defaults.layers[0],defaults.layers[0]]}));assert.throws(()=>validate({...defaults,layers:[{...defaults.layers[0],rotation:NaN}]}));
const original=new File(['original bytes'],'logo.svg',{type:'image/svg+xml'});
const old={...defaults,side:'front',logoColor:'#ff0000',recolor:true,removeBackground:false,placements:{front:layerDefaults('front'),back:{...layerDefaults('back'),rotation:32}}};
const migrated=migrateProject({version:1,settings:old,logo:original});assert.equal(migrated.settings.layers.length,2);assert.equal(migrated.settings.layers[1].rotation,32);assert.equal(await migrated.assets['legacy-logo'].text(),'original bytes');assert.throws(()=>migrateProject({...migrated,assets:{}}));console.log('Project validation and lossless v1 migration PASS');

const legacyTee=migrateProject({version:2,settings:{...defaults,model:"tee-oversized"},assets:{demo:original}});assert.equal(legacyTee.settings.model,"tee-regular");console.log("Legacy oversized project maps to replacement tee PASS");
