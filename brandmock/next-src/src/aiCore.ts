export type AiKind='mug'|'shirt';
export type AiRequest={width:number;height:number;rgba:Uint8Array;kind:AiKind;point?:number[]};
export type AiResult={width:number;height:number;mask:Uint8Array;seed:number[];detectedCup:boolean;source:string};
export type AiProgress=(stage:string)=>void;
/** Real local YOLOS + SlimSAM inference, shared by worker and CPU smoke checks. */
export async function createAiEngine(modelsBase:string,runtimeBase:string|undefined,progress:AiProgress=()=>{}){
 const {pipeline,SamModel,AutoProcessor,RawImage,env}=await import('@huggingface/transformers');env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath=modelsBase;
 if(env.backends.onnx.wasm){env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;if(runtimeBase)env.backends.onnx.wasm.wasmPaths=runtimeBase}
 let detector:any,model:any,processor:any,lastHash='',embedding:any;const device=runtimeBase?'wasm':'cpu';
 const dispose=(v:any)=>{if(v&&typeof v==='object')for(const item of Object.values(v))if(item&&typeof (item as any).dispose==='function')(item as any).dispose()};
 return {async analyze(request:AiRequest):Promise<AiResult>{const {width,height,rgba,kind}=request;if(width<20||height<20||width*height>650_000||rgba.length!==width*height*4)throw Error('Некорректное изображение для ИИ');const image=new RawImage(rgba,width,height,4);let seed=request.point,detectedCup=false;
  if(!seed&&kind==='mug'){progress('Загружаю модель поиска кружек…');detector??=await pipeline('object-detection','yolos-tiny',{dtype:'q8',device:device as any});progress('Ищу кружку на фотографии…');const boxes=await detector(image,{threshold:.25});const cups=boxes.filter((x:any)=>x.label==='cup').sort((a:any,b:any)=>b.score-a.score);if(!cups.length)throw Error('Модель не нашла кружку. Нажмите «Указать изделие одним кликом» и кликните по корпусу.');const box=cups[0].box;seed=[(box.xmin+box.xmax)/2,(box.ymin+box.ymax)/2];detectedCup=true}
  seed??=[width/2,height/2];if(!seed.every(Number.isFinite)||seed[0]<0||seed[1]<0||seed[0]>=width||seed[1]>=height)throw Error('Точка должна быть внутри фотографии');
  progress('Загружаю модель маски изделия…');model??=await SamModel.from_pretrained('slimsam',{dtype:'q8',device:device as any});processor??=await AutoProcessor.from_pretrained('slimsam');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba as any))).join(',');progress('Выделяю изделие на устройстве…');const inputs=await processor(image,{input_points:[[[seed]]],input_labels:[[[1]]]});
  try{if(hash!==lastHash){dispose(embedding);embedding=await model.get_image_embeddings(inputs);lastHash=hash}const output=await model({...inputs,...embedding});try{const masks=await processor.post_process_masks(output.pred_masks,inputs.original_sizes,inputs.reshaped_input_sizes);try{const tensor=masks[0],n=width*height,num=tensor.data.length/n;let best:Uint8Array|undefined,bestScore=-Infinity;
   for(let c=0;c<num;c++){const data=new Uint8Array(tensor.data.subarray(c*n,(c+1)*n)),anchor=Math.floor(seed[1])*width+Math.floor(seed[0]);if(!data[anchor])continue;let area=0;for(const v of data)if(v)area++;if(area<n*.008||area>n*.88)continue;const score=Number(output.iou_scores.data[c]);if(score>bestScore){bestScore=score;best=data}}
   if(!best)throw Error('Маска неоднозначна. Кликните по середине нужного изделия.');return {width,height,mask:best,seed,detectedCup,source:detectedCup?'YOLOS-tiny + SlimSAM':'SlimSAM по точке на изделии'};
  }finally{for(const m of masks)m.dispose?.()}}finally{dispose(output)}}finally{dispose(inputs)}
 },async dispose(){dispose(embedding);await detector?.dispose();await model?.dispose()}};
}
