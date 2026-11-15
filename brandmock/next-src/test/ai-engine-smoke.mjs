import assert from 'node:assert/strict';
import {createAiEngine} from '../src/aiCore.ts';
import {fitObject} from '../src/objectGeometry.ts';
import {RawImage} from '@huggingface/transformers';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public/models/',import.meta.url));
const engine=await createAiEngine(root,undefined,console.log);
try {
 const im=await RawImage.read(fileURLToPath(new URL('./fixtures/mug-real.jpg',import.meta.url)));
 const small=await im.rgba().resize(640,427);
 const request={width:640,height:427,rgba:small.data,kind:'mug'};
 const result=await engine.analyze(request),again=await engine.analyze(request);
 assert.deepEqual(result.mask,again.mask,'Repeat inference must match');
 assert(result.detectedCup);
 const area=result.mask.reduce((a,v)=>a+(v?1:0),0);
 assert(area>15000&&area<60000,'Mug mask area must be plausible');
 const fitted=fitObject(result,{width:640,height:427,data:small.data},'mug');
 assert.equal(fitted.model,'cylinder');assert(fitted.corners.every(([x,y])=>x>70&&x<280&&y>210&&y<365),'Print region should be on body, away from handle and rim');
 console.log('Actual YOLOS + SlimSAM inference, deterministic mask and mug body fitting PASS');
} finally {await engine.dispose()}
