import {Vector3,type PerspectiveCamera} from 'three';
import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
export function lockVerticalOrbit(controls:OrbitControls){
 controls.minPolarAngle=controls.maxPolarAngle=Math.PI/2;
 controls.enablePan=false;
}
/** Keep the saved azimuth and distance, recentering old tilted cameras on the garment. */
export function restoreVerticalOrbit(camera:PerspectiveCamera,controls:OrbitControls,saved:{position:number[];target:number[]},center:Vector3){
 const offset=new Vector3().fromArray(saved.position).sub(new Vector3().fromArray(saved.target));
 const distance=offset.length();offset.y=0;
 if(offset.lengthSq()<1e-10)offset.set(0,0,1);
 controls.target.copy(center);camera.up.set(0,1,0);
 camera.position.copy(center).add(offset.normalize().multiplyScalar(distance));
 controls.update();
}
