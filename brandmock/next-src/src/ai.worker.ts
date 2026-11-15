import {createAiEngine} from './aiCore';
const scope:any=self;
let engine:Awaited<ReturnType<typeof createAiEngine>>|undefined;
scope.onmessage=async(e:MessageEvent)=>{const {id,...request}=e.data;try{engine??=await createAiEngine(request.modelsBase,request.runtimeBase,stage=>scope.postMessage({id,type:'progress',stage}));const result=await engine.analyze({...request,rgba:new Uint8Array(request.rgba)});scope.postMessage({id,type:'result',...result},[result.mask.buffer])}catch(error){scope.postMessage({id,type:'error',message:error instanceof Error?error.message:String(error)})}};
