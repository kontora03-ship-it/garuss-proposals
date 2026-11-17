import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {lockVerticalOrbit,restoreVerticalOrbit} from '../src/cameraOrbit';
class Canvas extends EventTarget{
 style={touchAction:''};clientWidth=800;clientHeight=600;
 getRootNode(){return this}setPointerCapture(){}releasePointerCapture(){}
}
const element=new Canvas();const camera=new PerspectiveCamera();camera.position.set(0,0,4);
const controls=new OrbitControls(camera,element as unknown as HTMLElement);lockVerticalOrbit(controls);controls.update();
function pointer(type:string,x:number,y:number){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerType:'mouse',pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y});element.dispatchEvent(e)}
pointer('pointerdown',400,300);pointer('pointermove',400,450);pointer('pointerup',400,450);
assert(Math.abs(camera.position.y-controls.target.y)<1e-10,'Vertical drag must not pitch the camera');assert(Math.abs(camera.position.x)<1e-10);
pointer('pointerdown',400,300);pointer('pointermove',600,300);pointer('pointerup',600,300);
assert(Math.abs(camera.position.x)>1,'Horizontal drag must still rotate around the garment');assert(Math.abs(camera.position.y-controls.target.y)<1e-10);
const center=new Vector3(1,.2,-.3);restoreVerticalOrbit(camera,controls,{position:[2,3,4],target:[0,1,0]},center);
assert(controls.target.distanceTo(center)<1e-10);assert(Math.abs(camera.position.y-center.y)<1e-10);assert(Math.abs(camera.position.distanceTo(center)-Math.sqrt(24))<1e-10);assert(Math.abs((camera.position.x-center.x)/(camera.position.z-center.z)-.5)<1e-10);
controls.dispose();console.log('Real OrbitControls: vertical drag locked, horizontal orbit preserved, old camera recentered PASS');
const {upgradeBuiltinDemo}=await import('../src/projectStorage');const {defaults}=await import('../src/types');const {demoSvg,legacyDemoSvg}=await import('../src/logoLoader');
const builtin={version:2 as const,settings:structuredClone(defaults),assets:{demo:new File([legacyDemoSvg],'demo-forme.svg')}};
assert.equal(await(await upgradeBuiltinDemo(builtin)).assets.demo.text(),demoSvg);
const customer={...builtin,assets:{demo:new File(['customer logo bytes'],'my-logo.svg')}};
assert.equal(await upgradeBuiltinDemo(customer),customer);assert.equal(await customer.assets.demo.text(),'customer logo bytes');
console.log('Built-in demo upgraded to BrandMock; customer originals preserved PASS');
