// Authored story props share the prototype's material/model kit.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Flatten only immutable scenery. Keep actors, markers, gates and reward slots
// separate: their visibility, transforms or materials change during play.
function batchScenery(THREE, group, dynamic) {
  group.updateMatrixWorld(true);
  const batches=new Map(), meshes=[];
  function visit(o) {
    if(dynamic.has(o))return;
    if(o.isMesh && !Array.isArray(o.material)) {
      const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      geometry.applyMatrix4(o.matrixWorld);
      if(!batches.has(o.material))batches.set(o.material,[]);
      batches.get(o.material).push(geometry);meshes.push(o);
    }
    o.children.forEach(visit);
  }
  visit(group);
  for(const [material,geometries] of batches) {
    const merged=mergeGeometries(geometries);
    const m=new THREE.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;group.add(m);
    geometries.forEach(g=>g.dispose());
  }
  meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});
}
export function createAdventureWorld({THREE,scene,box,ball,cyl,ring,label,character,C,mat}) {
  const port=new THREE.Group(),relay=new THREE.Group();scene.add(port,relay);relay.visible=false;
  const targets=[];
  function target(id,title,x,z,region='port',y=.28) {
    const group=region==='port'?port:relay;
    const marker=ring(.5,.035,C.gold,x,y,z,group);
    marker.castShadow=false;
    targets.push({id,title,x,z,region,marker});return marker;
  }
  target('pip','Talk to Pip',2.4,-.3);
  target('post','Pebble Post',-4.8,-1.7);
  target('mira','Visit Mira',-6.5,4.9);
  target('home-decor','Decorate home',-4.7,3.9);
  // Empty muffin box, visible flower, and a trail of paired footprints.
  box(.9,.35,.65,'#bf8a55',6,.46,.65,port);
  box(.68,.08,.44,'#644a3f',6,.65,.65,port);
  target('box','Inspect the muffin box',6,.65);
  for(let i=0;i<7;i++)for(const side of [-1,1]) {
    const x=5.3-i*.7,z=.45-i*.38+side*.12;
    const print=ball(.09,C.purple,x,.24,z,port,1.3,.12,.65);print.rotation.y=-.4;
  }
  target('tracks','Inspect the footprints',4.2,-.15);
  cyl(.04,.04,.45,C.leaf,3.7,.5,2.7,port,8);
  for(let i=0;i<5;i++) {const a=i*Math.PI*2/5;ball(.13,C.purple,3.7+Math.sin(a)*.15,.8,2.7+Math.cos(a)*.15,port,1,.45,1);}
  ball(.08,C.gold,3.7,.83,2.7,port);
  target('flower','Inspect the thank-you flower',3.7,2.7);
  const luma=character('alien');luma.position.set(-1.7,.24,-3.1);port.add(luma);
  target('luma','Talk to Luma',-1.7,-3.1);label('LUMA',-1.7,2.9,-3.1,1.2,C.dark,port);
  const mira=character('astronaut');mira.scale.setScalar(1.05);mira.position.set(-6.5,.24,4.9);port.add(mira);
  label('MIRA',-6.5,2.6,4.9,1.2,C.dark,port);
  const fruit={};
  for(const [id,x,z,color,height] of [['moonberries',-8,-2,'#79b9d2',.65],['prickly',-8.8,.2,C.purple,1.3]]) {
    const g=new THREE.Group();g.position.set(x,.25,z);port.add(g);
    cyl(.65,.8,.3,'#bb936c',0,.15,0,g,16);
    cyl(.07,.07,height,C.leaf,0,height/2+.3,0,g,12);
    for(const side of [-1,1]) {
      const leaf=ball(.25,color,side*.24,.55,0,g,.5,1.8,.4);leaf.rotation.z=side*.7;
      ball(.15,id==='moonberries'?'#4f80b0':'#ba74a3',side*.23,height+.3,.1,g);
      if(id==='prickly')for(let i=0;i<3;i++)cyl(0,.035,.15,C.cream,side*.23+i*.055-.05,height+.45,.1,g,5);
    }
    fruit[id]=g;target(id,id==='moonberries'?'Inspect the low blue plant':'Inspect the tall purple plant',x,z);
  }
  const enemies=[];
  function enemy(id,x,z,region,flavor) {
    const g=character('robot');g.position.set(x,.24,z);g.rotation.y=.7;
    const parent=region==='port'?port:relay;parent.add(g);
    // Coral cap and visible spring distinguish malfunctioning robots from neighbors.
    box(.87,.16,.68,C.coral,0,2.14,0,g);
    const bubble=ball(.95,new THREE.MeshStandardMaterial({color:'#bceee5',transparent:true,opacity:.22,depthWrite:false}),0,1.2,0,g,1,1.4,1);
    bubble.visible=false;
    const sign=label(flavor,x,3.3,z,1.9,C.coral,parent);
    enemies.push({id,root:g,base:new THREE.Vector3(x,.24,z),region,hits:0,float:0,bubble,sign});
  }
  enemy('garden',.6,-3.4,'port','NO SNACKS!');
  enemy('parcel',-2.4,-2.7,'port','ALL MINE!');
  for(let i=0;i<3;i++)enemy(`bowl-${i}`,5.2+i,5.7,'port','BOWL ME!');
  for(let i=0;i<6;i++)cyl(.15,.15,.35,C.coral,5.6+(i%3)*.5,.45+Math.floor(i/3)*.35,7.3,port,12);
  target('bowling','Reset robot bowling',6.2,4.2);
  label('ROBOT BOWLING',6.3,1.5,7.8,2.5,C.dark,port);
  const buggy=new THREE.Group();buggy.position.set(2.5,.3,5.5);port.add(buggy);
  const buggyMaterial=mat('#6daea2').clone();
  box(1.2,.4,1.85,buggyMaterial,0,.5,0,buggy,.17);
  box(.96,.2,1.2,C.cream,0,.8,.15,buggy);
  box(.6,.45,.35,C.dark,0,1,.25,buggy);
  box(.93,.7,.06,'#a9d9ca',0,1.15,-.5,buggy,.06);
  for(const x of [-.68,.68])for(const z of [-.6,.6]) {
    const wheel=cyl(.3,.3,.2,C.dark,x,.35,z,buggy,16);wheel.rotation.z=Math.PI/2;
    const hub=cyl(.16,.16,.22,C.gold,x,.35,z,buggy,12);hub.rotation.z=Math.PI/2;
  }
  for(const x of [-.4,.4])ball(.1,C.cream,x,.65,.94,buggy);
  target('buggy','Hop in the moon buggy',2.5,5.5);
  const course=[[0,8],[-7,5.5],[-9,-1],[0,-8],[8,-5.5],[8,2.8],[0,8]];
  const gates=course.slice(0,-1).map(([x,z],i)=>{
    const g=new THREE.Group();g.position.set(x,.28,z);port.add(g);
    const arch=meshArch(THREE,mat,C,g);arch.rotation.y=i*Math.PI/3;
    label(String(i+1),0,1.65,0,.65,C.dark,g);return g;
  });
  target('course','Start the buggy course',0,7);
  const shuttle=new THREE.Group();port.add(shuttle);
  cyl(.8,1,.22,C.mint,7.8,.34,2.2,shuttle,24);
  ring(.65,.06,C.gold,7.8,.49,2.2,shuttle);
  label('CRATER SHUTTLE',7.8,1.5,2.2,2.6,C.dark,shuttle);
  target('shuttle','Travel to Crater Relay',7.8,2.2);
  const hidden=[];
  for(const [id,x,z] of [['sprout',-9,3.7],['nib',8.5,-.4],['wiggle',-1.5,-8.8]]) {
    const root=character('alien');root.scale.setScalar(.5);root.position.set(x,.24,z);port.add(root);
    hidden.push({id,root});target(id,'Found a little alien?',x,z);
  }
  // Reward positions are deliberately small and outside the movement route.
  const slots={};
  for(const [id,x,z] of [['porch',-5.7,4.3],['yard',-8.7,5.4],['garden',-3.5,5.3]]) {
    const g=new THREE.Group();g.position.set(x,.25,z);port.add(g);slots[id]=g;
    cyl(.35,.4,.1,'#d2b78e',0,.05,0,g,16);
    const planter=new THREE.Group();g.add(planter);planter.name='planter';planter.visible=false;
    cyl(.28,.35,.4,C.mint,0,.28,0,planter,16);cyl(.03,.03,.65,C.leaf,0,.72,0,planter,8);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(.15,C.purple,Math.sin(a)*.2,1.04,Math.cos(a)*.2,planter,1,.5,1);}ball(.1,C.gold,0,1.08,0,planter);
    const lamp=new THREE.Group();g.add(lamp);lamp.name='lamp';lamp.visible=false;
    cyl(.15,.2,.15,C.gold,0,.15,0,lamp,12);cyl(.035,.035,.9,C.dark,0,.65,0,lamp,8);
    const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.15:.34;const x=Math.sin(a)*r,y=Math.cos(a)*r;i?star.lineTo(x,y):star.moveTo(x,y);}star.closePath();
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(star,{depth:.08,bevelEnabled:false}),mat('#ffe9a4'));m.position.set(0,1.2,0);lamp.add(m);
  }
  // Crater relay is a separate reachable area, not an unimplemented menu destination.
  cyl(10.8,10,1.1,'#8d7893',0,-.65,0,relay,48);
  cyl(10.9,10.8,.3,'#b7a1b9',0,-.02,0,relay,48);
  box(3,.06,16,'#d4bdc2',0,.18,0,relay);
  box(14,.06,2.2,'#d4bdc2',0,.18,-2,relay);
  for(let i=0;i<15;i++){const a=i*Math.PI*2/15;const rock=ball(.6,'#887894',Math.sin(a)*9.5,.4,Math.cos(a)*9.5,relay,1.1,.7,1);rock.rotation.y=a;}
  target('return-port','Shuttle back to Pebble Port',0,6.8,'relay');label('PEBBLE PORT ↓',0,1.6,7,2.3,C.dark,relay);
  const caretaker=character('robot');caretaker.position.set(-2,.24,4);relay.add(caretaker);
  target('log','Read the maintenance log',-2,4,'relay');label('MAINTENANCE LOG',-2,2.9,4,2.6,C.dark,relay);
  enemy('left',-3,-.5,'relay','PLEASE WAIT!');enemy('right',3,-.5,'relay','NO VISITORS!');
  const systems={};
  for(const [id,title,x] of [['fan','COOLING FAN',-5],['battery','BATTERY',0],['dish','ANTENNA',5]]) {
    const g=new THREE.Group();g.position.set(x,.25,-3.5);relay.add(g);systems[id]=g;
    box(1.4,.8,1.2,C.cream,0,.4,0,g);box(1.6,.15,1.4,C.mint,0,.9,0,g);
    const light=ball(.12,C.coral,0,.6,.64,g);light.name='status';
    if(id==='fan'){
      const rotor=new THREE.Group();rotor.position.set(0,1.7,0);g.add(rotor);rotor.name='rotor';
      const frame=ring(.65,.08,C.dark,0,1.7,0,g);frame.rotation.x=0;
      for(let i=0;i<3;i++){const blade=box(.17,1.05,.1,C.mint,0,0,0,rotor,.07);blade.rotation.z=i*Math.PI/3;}
    }else if(id==='battery'){
      box(.8,1.2,.75,C.gold,0,1.6,0,g);box(.3,.15,.3,C.dark,0,2.28,0,g);label('⚡',0,1.6,.4,.5,C.dark,g);
    }else {
      cyl(.09,.09,1.5,C.dark,0,1.65,0,g,12);
      const plate=ball(.9,C.cream,0,2.5,0,g,1,.2,1);plate.rotation.z=.6;
    }
    label(title,0,3.1,0,2.2,C.dark,g);target(id,`Switch on ${title.toLowerCase()}`,x,-2,'relay');
  }
  box(1.8,1.1,1,C.mint,0,.8,-6.3,relay);box(1.35,.6,.07,C.dark,0,1.1,-5.76,relay);
  label('RELAY CONSOLE',0,2,-6.3,2.7,C.dark,relay);target('console','Open relay console',0,-5.1,'relay');
  const dynamic=new Set([buggy,...gates,...Object.values(slots),...Object.values(systems),
    ...targets.map(t=>t.marker),...hidden.map(h=>h.root),...enemies.flatMap(e=>[e.root,e.sign])]);
  batchScenery(THREE,port,dynamic);batchScenery(THREE,relay,dynamic);
  return {port,relay,targets,enemies,hidden,buggy,buggyMaterial,gates,course,slots,systems,luma,mira,caretaker};
}
function meshArch(THREE,mat,C,parent) {
  const g=new THREE.Group();parent.add(g);
  for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.25,8),mat(C.gold));p.position.set(s*.85,.63,0);g.add(p);}
  const curve=new THREE.Mesh(new THREE.TorusGeometry(.85,.07,6,20,Math.PI),mat(C.gold));curve.position.y=1.25;g.add(curve);return g;
}
