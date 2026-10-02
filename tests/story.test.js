import test from 'node:test';
import assert from 'node:assert/strict';
import {newProgress,advance,restoreProgress,deliveryNotes,canBubbleGuard} from '../src/story.js';

test('early bubbles cannot consume quest guards before their story stage',()=>{
  for(const [id,stage] of [['garden','guard'],['parcel','parcel-robot'],['left','relay-guards'],['right','relay-guards']]) {
    assert.equal(canBubbleGuard(newProgress(),id),false);
    assert.equal(canBubbleGuard({...newProgress(),stage},id),true);
  }
  assert.equal(canBubbleGuard(newProgress(),'bowl-0'),true);
});

function journey() {
  let p=newProgress();
  const send=(e,v)=>{const result=advance(p,e,v);p=result.progress;return result;};
  return {send,get p(){return p;}};
}
test('clues and inference are necessary; wrong choices do not erase evidence',()=>{
  const j=journey();j.send('report-muffins');assert.equal(j.p.stage,'arrival');
  j.send('start');j.send('clue','flower');j.send('clue','flower');j.send('clue','tracks');
  assert.equal(j.p.stage,'snacks');j.send('inference','trade');assert.equal(j.p.stage,'snacks');
  j.send('clue','box');const before=structuredClone(j.p);
  assert.ok(j.send('inference','mean').feedback);assert.deepEqual(j.p,before);
  j.send('inference','trade');assert.equal(j.p.stage,'guard');
  j.send('food','moonberries');assert.equal(j.p.stage,'guard');
  j.send('garden-guard');j.send('meet-luma');j.send('food','prickly');assert.equal(j.p.stage,'fruit');
  j.send('food','moonberries');assert.equal(j.p.stage,'fruit');j.send('feed');j.send('report-muffins');j.send('report-muffins');
  assert.deepEqual(j.p.rewards,['planter']);assert.equal(j.p.stage,'delivery-brief');
});
function deliveredJourney(){
  const j=journey();for(const [e,v] of [['start'],['clue','box'],['clue','tracks'],['clue','flower'],['inference','trade'],['garden-guard'],['meet-luma'],['food','moonberries'],['feed'],['report-muffins'],['accept-deliveries']])j.send(e,v);return j;
}
test('delivery solves recipient needs in any order, duplicates and guesses do not finish',()=>{
  const j=deliveredJourney();
  j.send('deliver',{recipient:'luma',parcel:'blanket'});assert.deepEqual(j.p.delivered,[]);
  j.send('deliver',{recipient:'pip',parcel:'bulb'});j.send('deliver',{recipient:'pip',parcel:'bulb'});
  assert.equal(j.p.delivered.length,1);assert.equal(j.p.stage,'delivery');
  j.send('deliver',{recipient:'luma',parcel:'watering'});j.send('deliver',{recipient:'mira',parcel:'blanket'});
  assert.equal(j.p.stage,'parcel-robot');j.send('report-deliveries');assert.deepEqual(j.p.rewards,['planter']);
  j.send('parcel-robot');j.send('report-deliveries');assert.deepEqual(j.p.rewards,['planter','paint']);
});
test('relay power has causal order, both sentries required, console heard before completion',()=>{
  const j=deliveredJourney();for(const n of deliveryNotes)j.send('deliver',{recipient:n.recipient,parcel:n.id});
  j.send('parcel-robot');j.send('report-deliveries');j.send('accept-signal');j.send('read-log');
  j.send('relay-guard','right');j.send('relay-guard','right');assert.equal(j.p.stage,'relay-guards');
  j.send('power','fan');assert.deepEqual(j.p.power,[]);j.send('relay-guard','left');
  j.send('power','battery');assert.deepEqual(j.p.power,[]);j.send('power','fan');
  j.send('power','dish');assert.deepEqual(j.p.power,['fan']);j.send('power','battery');j.send('power','dish');
  assert.equal(j.p.stage,'relay-return');j.send('report-signal');assert.equal(j.p.stage,'relay-return');
  j.send('console');j.send('report-signal');assert.equal(j.p.stage,'finished');assert.deepEqual(j.p.rewards,['planter','paint','lamp']);
});
test('rewards can be placed only when earned, save roundtrip retains meaningful progress',()=>{
  const j=journey();j.send('decorate',{slot:'porch',reward:'lamp'});assert.equal(j.p.decor.porch,null);
  const p={...newProgress(),stage:'relay-power',power:['fan'],guards:['left','right'],rewards:['planter','paint']};
  const next=advance(p,'decorate',{slot:'yard',reward:'planter'}).progress;
  assert.equal(p.decor.yard,null);assert.equal(next.decor.yard,'planter');assert.deepEqual(restoreProgress(JSON.stringify(next)),next);
  assert.equal(restoreProgress('{broken'),null);assert.equal(restoreProgress('null'),null);
});
test('free play saves crew, earned paint, finds and best lap without advancing story',()=>{
  const j=journey();j.send('character','robot');j.send('paint','coral');j.send('find','sprout');
  assert.equal(j.p.character,'robot');assert.equal(j.p.paint,'mint');assert.deepEqual(j.p.found,[]);
  j.send('lap',null);j.send('lap',24);j.send('lap',30);j.send('lap',18);
  assert.equal(j.p.completedLaps,4);assert.equal(j.p.bestLap,18);assert.equal(j.p.stage,'arrival');
  const earned={...j.p,rewards:['planter','paint']};
  const painted=advance(earned,'paint','coral').progress;
  const found=advance(painted,'find','sprout').progress;
  assert.equal(found.paint,'coral');assert.deepEqual(found.found,['sprout']);
  assert.deepEqual(restoreProgress(JSON.stringify(found)),found);
});
