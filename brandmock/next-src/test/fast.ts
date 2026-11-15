import assert from 'node:assert/strict';
import {RawImage} from '@huggingface/transformers';
import {fileURLToPath} from 'node:url';
import {fastSurface} from '../src/fastSurface';
import {fitObject} from '../src/objectGeometry';
import {garmentRegion} from '../src/garmentGeometry';
const read=async(path:string)=>{const raw=await RawImage.read(fileURLToPath(new URL(path,import.meta.url)));const ratio=Math.min(1,640/Math.max(raw.width,raw.height));return raw.rgba().resize(Math.round(raw.width*ratio),Math.round(raw.height*ratio))};
for(const name of ['shirt','hoodie','polo']){const im=await read('../public/demo/'+name+'.png'),request={width:im.width,height:im.height,rgba:im.data,kind:'shirt' as const};const start=performance.now(),mask=fastSurface(request),fit=fitObject(mask,{width:im.width,height:im.height,data:im.data} as ImageData,'shirt',{garment_type:name==='shirt'?'tshirt':name as 'hoodie'|'polo'});console.log(name,Math.round(performance.now()-start)+'ms',fit.corners);assert.deepEqual(mask.mask,fastSurface(request).mask);assert.equal(fit.model,'fabric');const ys=fit.corners.map(p=>p[1]);assert(Math.min(...ys)>100&&Math.max(...ys)<400);if(name!=='shirt')assert(Math.abs(fit.corners[1][1]-fit.corners[0][1])>8,'Torso axes should follow garment tilt');const small=garmentRegion(mask.mask,im.width,im.height,{print_zone:'left-chest'}),large=garmentRegion(mask.mask,im.width,im.height,{print_zone:'back'});assert(Math.hypot(small[1][0]-small[0][0],small[1][1]-small[0][1])<Math.hypot(large[1][0]-large[0][0],large[1][1]-large[0][1])*.6)}
const empty=new Uint8Array(320*240*4).fill(255);assert.throws(()=>fastSurface({width:320,height:240,rgba:empty,kind:'shirt'}));
console.log('Fast segmentation, garment axes, collar/sleeve exclusion, print zones and blank rejection PASS');
