import assert from 'node:assert/strict';
import {analyzePlane} from '../src/planeAnalysis';
export function projectedPlane(width=2,height=1.2,yaw=.6,pitch=.4,roll=.08,f=950,z=5,w=1200,h=900){const points=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]];return points.map(([x,y])=>{const X=x*Math.cos(yaw),Z=-x*Math.sin(yaw),Y=y*Math.cos(pitch)-Z*Math.sin(pitch),ZZ=y*Math.sin(pitch)+Z*Math.cos(pitch);return [w/2+f*(X*Math.cos(roll)-Y*Math.sin(roll))/(z+ZZ),h/2+f*(X*Math.sin(roll)+Y*Math.cos(roll))/(z+ZZ)]})}
const q=projectedPlane();const a=analyzePlane(q,1200,900);console.log('Synthetic camera estimate',a);assert(a.perspective);assert(Math.abs(a.aspectRatio!-2/1.2)<1e-8);
assert(!analyzePlane([[100,100],[800,100],[800,600],[100,600]],1200,900).perspective);
assert(!analyzePlane(projectedPlane(2,1.2,1.35,.4),1200,900).perspective);
assert(!analyzePlane([[100,100],[800,150],[800,600],[100,550]],1200,900).perspective);
for(const [yaw,pitch]of [[.45,.3],[.7,.35],[-.55,.4],[.65,-.35]]){const result=analyzePlane(projectedPlane(2,1.2,yaw,pitch),1200,900);assert(result.perspective);assert(Math.abs(result.aspectRatio!-2/1.2)<1e-8)}
console.log('Automatic metric plane recovery and ambiguous/extreme-view rejection passed');
