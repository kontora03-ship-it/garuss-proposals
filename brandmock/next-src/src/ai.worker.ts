import {createAiEngine} from './aiCore';
import {fastSurface} from './fastSurface';
const scope:any=self;
let engine:Awaited<ReturnType<typeof createAiEngine>>|undefined;
scope.onmessage=async(e:MessageEvent)=>{const {id,...request}=e.data;try{const started=performance.now();let result;if(request.mode!=='ai'){result=fastSurface({...request,rgba:new Uint8Array(request.rgba)})}else{engine??=await createAiEngine(request.modelsBase,request.runtimeBase,stage=>scope.postMessage({id,type:'progress',stage}));result=await engine.analyze({...request,rgba:new Uint8Array(request.rgba)});}scope.postMessage({id,type:'result',...result,elapsed_ms:Math.round(performance.now()-started)},[result.mask.buffer])}catch(error){scope.postMessage({id,type:'error',message:error instanceof Error?error.message:String(error)})}};
