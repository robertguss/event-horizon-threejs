import {SAVE_KEY,newProgress,restoreProgress,advance,chapterNumber,objectives,titles,passages,deliveryNotes,canBubbleGuard} from './story.js';
import {createVoicePlayer} from './voice-player.js';

export function createChapter(api,world) {
  const $=s=>document.querySelector(s), dialog=$('#mission-dialog');
  const voice=createVoicePlayer($('#read-aloud'));
  let progress=newProgress(), saved=true, nearest=null, region='port', riding=false, lap=null, hidePlaying=false;
  let soundEnabled=false, audio=null, audioGain=null, lastPrompt='', updateTime=0;
  try {progress=restoreProgress(localStorage.getItem(SAVE_KEY))||newProgress();}catch {saved=false;}
  const initial=structuredClone(progress);
  function sound(type='click') {
    if(!soundEnabled)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    audio??=new Audio();audio.resume().catch(()=>{});
    if(!audioGain){audioGain=audio.createGain();audioGain.gain.value=.08;audioGain.connect(audio.destination);}
    const tones=type==='reward'?[440,554,659]:type==='bubble'?[330,600]:[480];
    tones.forEach((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+i*.07;osc.type='sine';osc.frequency.setValueAtTime(freq,start);osc.frequency.exponentialRampToValueAtTime(freq*1.3,start+.1);gain.gain.setValueAtTime(.5,start);gain.gain.exponentialRampToValueAtTime(.001,start+.17);osc.connect(gain).connect(audioGain);osc.start(start);osc.stop(start+.18);});
  }
  function save() {try{localStorage.setItem(SAVE_KEY,JSON.stringify(progress));saved=true;}catch{saved=false;}refresh();}
  function send(event,value) {
    const result=advance(progress,event,value);
    if(result.changed){progress=result.progress;save();syncWorld();}
    if(result.feedback){$('#dialog-feedback').textContent=result.feedback;sound();}
    return result;
  }
  function close(){dialog.close();voice.stop();api.resetInput();}
  function show(title,paragraphs,actions=[],speaker='PEBBLE PORT') {
    api.resetInput();voice.stop();
    $('#mission-title').textContent=title;$('#dialog-speaker').textContent=speaker;
    $('#dialog-feedback').textContent='';
    const body=$('#dialog-body');body.replaceChildren();
    for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;body.append(p);}
    const choices=$('#dialog-actions');choices.replaceChildren();
    for(const [text,fn] of actions){const button=document.createElement('button');button.className='primary-button';button.textContent=text;button.onclick=()=>{sound();fn();};choices.append(button);}
    if(!actions.length){const b=document.createElement('button');b.className='primary-button';b.textContent='Back to exploring';b.onclick=close;choices.append(b);}
    if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
  }
  function reward(title,text){sound('reward');show(title,[text,'Your reward is saved on this browser. Visit the home decoration marker to place it, or keep exploring.'],[['Keep exploring',close]],'ADVENTURE COMPLETE');}
  function clue(id){
    const texts={box:'An empty muffin box. There are crumbs, but no broken lock or ripped lid. Someone opened it carefully.',tracks:'Small paired purple footprints head away from the rocket and toward the garden. These are not Pip’s square robot feet.',flower:'A purple flower was left beside the box. It looks deliberately placed, not dropped during a chase.'};
    const result=send('clue',id);
    show({box:'Not a muffin in sight.',tracks:'A tiny trail.',flower:'A thank-you… perhaps?'}[id],[texts[id],result.changed?'Clue added to your journal.':progress.clues.includes(id)?'You already recorded this clue.':'Pip has a story about this box. Open your journal to begin.'],[['Keep investigating',close]],'FIELD NOTES');
  }
  function pipConversation(atPost=false) {
    if(progress.stage==='arrival')return show('Something ate my moon muffins.',[passages.muffins,'Use the movement stick to explore. When you are near an object or neighbor, the green interaction button tells you what you can do. Bubbles are always available for goofing off.'],[['Investigate the missing muffins',()=>{send('start');close();}]],'PIP');
    if(progress.stage==='thought')return show('What might the flower mean?',[passages.muffins,'Pip: “You found careful tracks and a flower. What explanation fits those clues?”'],[
      ['They wanted to break the rocket.',()=>send('inference','rocket')],
      ['They may have thought the flower was a fair trade.',()=>{send('inference','trade');show('A polite mystery.', ['Pip: “That makes sense! Let’s meet our visitor before blaming them.”','The garden guard is being ridiculous again. Stand near the coral-capped robot and bubble it three times.'],[['Let’s go',close]],'PIP');}],
      ['They wanted Pip to be hungry.',()=>send('inference','mean')],
    ],'PIP');
    if(progress.stage==='return')return show('The snack thief had a reason.', ['Pip: “Hungry babies? That explains the crumbs! Next time we’ll ask before borrowing muffins.”','Luma is growing her own moonberries now. Pip gives you a flower planter to remember your first rescue.'],[['Finish the adventure',()=>{send('report-muffins');reward('A little kindness grows.', 'You earned the alien-flower planter. Luma’s babies also want to play hide-and-seek around the port!');}]],'PIP');
    if(progress.stage==='delivery-brief' && atPost)return show('Special delivery… probably.', ['Pip: “Three packages, three neighbors. I mixed up the address labels while practicing my dramatic entrance.”','Your notes describe what each neighbor needs. Read them, drive the buggy if you like, and choose a parcel when you visit Mira, Luma, or me at Pebble Post.',...deliveryNotes.map(n=>n.text)],[['Take the delivery job',()=>{send('accept-deliveries');close();}]],'PEBBLE POST');
    if(progress.stage==='delivery' && atPost)return delivery('pip');
    if(progress.stage==='parcel-robot' && atPost)return show('Parcel robot on strike.', ['Pip: “The coral-capped parcel robot has decided it owns this entire post office. Three bubbles should reboot its manners.”'],[['I’ll sort it out',close]],'PIP');
    if(progress.stage==='delivery-return' && atPost)return show('Everything in its right place.', ['Pip: “Mira is warm, Luma’s plants have water, and I can see my letters again! You matched the packages to the problems.”','The buggy paint booth is yours. Choose mint, coral, or sunshine gold when you visit the buggy.'],[['Finish the delivery job',()=>{send('report-deliveries');reward('Signed, sealed, delivered.', 'You earned new buggy paint colors. Pip has also picked up a very peculiar signal.');}]],'PIP');
    if(progress.stage==='signal-brief')return show('A voice beyond the crater.', ['Pip: “The old crater relay keeps saying HELLO? HELLO? The shuttle is ready, but nobody has used that station in years.”','Travel to the relay. Read the caretaker’s maintenance log, deal with the confused sentries, and find out who is trying to call.'],[['Investigate the signal',()=>{send('accept-signal');close();}]],'PIP');
    if(progress.stage==='relay-return' && progress.signalHeard)return show('Someone was waiting for a friend.', ['Pip: “The caretaker wasn’t warning us about an invasion. It was lonely! We’ll call it every evening.”','Beyond the relay, you picked up a new signal from a dark ring of stars. That mystery belongs to a future chapter. For now, Pebble Port is yours.'],[['Complete Chapter One',()=>{send('report-signal');reward('Trouble at Pebble Port: solved!', 'You earned the star lamp. All three adventures are complete. Keep driving, decorate home, play robot bowling, or find the little aliens.');}]],'PIP');
    return show(atPost?'Welcome to Pebble Post.':'Pip has a thought.', ['“My favorite hobby is being extremely helpful. My second favorite is muffins.”',objective()], [['Open journal',journal],['Back to exploring',close]],'PIP');
  }
  function delivery(recipient) {
    const names={mira:'Mira',luma:'Luma',pip:'Pip'};
    const parcelNames={blanket:'Soft blanket',watering:'Watering can',bulb:'Lamp bulb'};
    const actions=deliveryNotes.filter(n=>!progress.delivered.includes(n.id)).map(n=>[
      `Give ${names[recipient]} the ${parcelNames[n.id].toLowerCase()}`,()=>{
        const result=send('deliver',{recipient,parcel:n.id});
        if(result.changed){sound('reward');show('A delivery that helps.',[`${names[recipient]}: “Just what I needed. Thank you!”`,`${progress.delivered.length} of 3 parcels delivered.`,objective()],[['Keep exploring',close]],names[recipient].toUpperCase());}
      }]);
    if(!actions.length)actions.push(['Keep exploring',close]);
    show(`A parcel for ${names[recipient]}.`,deliveryNotes.map(n=>n.text),actions,names[recipient].toUpperCase());
  }
  function lumaConversation() {
    if(progress.stage==='alien')return show('A flower for a muffin.',[passages.food,'Luma: “Can you help us find food we can grow? I’ll ask Pip before trading things next time.”'],[['Help Luma’s family',()=>{send('meet-luma');close();}]],'LUMA');
    if(progress.stage==='fruit' && progress.carryFood)return show('A snack of their own.', ['The babies accept the moonberries with three tiny happy squeaks. Luma plants the seeds in the garden.','Luma: “No more borrowing muffins without asking. Tell Pip we’re sorry—and thank you for listening.”'],[['Give Luma the moonberries',()=>{send('feed');close();api.toast('Moonberries delivered! Tell Pip what happened.');sound('reward');}]],'LUMA');
    if(progress.stage==='delivery')return delivery('luma');
    return show('Luma’s garden.',[progress.rewards.includes('planter')?'“Our babies are hiding around the neighborhood. Sprout likes the house, Nib watches the shuttle, and Wiggle is somewhere behind the post office.”':passages.food], [['Keep exploring',close]],'LUMA');
  }
  function fruit(id) {
    show(id==='moonberries'?'The low blue plant.':'The tall purple plant.', [passages.food,id==='moonberries'?'Its curved leaves cradle clusters of blue berries.':'Its fruit has tiny pale spikes.'],[[progress.carryFood?'You already have moonberries':'Bring these to Luma',()=>{
      const result=send('food',id);if(result.changed){close();api.toast('Moonberries in your backpack. Take them to Luma.');sound('reward');}
      else if(!result.feedback)$('#dialog-feedback').textContent='Talk to Luma first; find out what her family needs.';
    }],['Keep exploring',close]],'GARDEN NOTES');
  }
  function log(){
    show('Power has a reason.',[passages.relay,'Caretaker: “The sentries think every visitor is a maintenance hazard. Bubble each one three times; nobody gets hurt.”'],[['Record the log',()=>{send('read-log');close();}],['Keep exploring',close]],'CRATER RELAY');
  }
  function system(id) {
    if(progress.power.includes(id))return show('Already running.', ['That system is working. Your progress is safe.',passages.relay],[['Keep exploring',close]],'RELAY SYSTEM');
    show({fan:'Start the cooling fan?',battery:'Power the battery?',dish:'Align the antenna dish?'}[id],[passages.relay], [['Switch it on',()=>{
      const result=send('power',id);if(result.changed){close();api.toast(`${id==='dish'?'Antenna':id==='fan'?'Cooling fan':'Battery'} running. ${progress.power.length}/3 systems online.`);sound('reward');}
      else if(!result.feedback)$('#dialog-feedback').textContent='Read the log and settle both sentries first. They keep interrupting repairs.';
    }],['Not yet',close]],'RELAY SYSTEM');
  }
  function consoleConversation(){
    if(progress.stage!=='relay-return' && progress.stage!=='finished')return show('A very quiet console.', ['The console needs a working fan, battery, and dish.',passages.relay],[['Keep exploring',close]],'RELAY CONSOLE');
    show('Hello? Is somebody there?', ['Caretaker: “I kept sending HELLO because nobody had called in years. I wasn’t trying to scare anyone. I just wanted a friend.”','A second message arrives: “Beyond the dark ring, a light is still waiting.” You save the mysterious signal for another day.','Take the shuttle home and tell Pip what the caretaker really needed.'],[['Save the transmission',()=>{send('console');close();}]],'THE SIGNAL');
  }
  function decorations(slot='porch') {
    const rewardNames={planter:'Alien-flower planter',lamp:'Star lamp'};
    const actions=progress.rewards.filter(r=>r!=='paint').map(r=>[`Place ${rewardNames[r]} in the ${slot}`,()=>{send('decorate',{slot,reward:r});decorations(slot);}]);
    actions.push([`Clear the ${slot}`,()=>{send('decorate',{slot,reward:null});decorations(slot);}]);
    for(const next of ['porch','yard','garden'])if(next!==slot)actions.push([`Choose the ${next} spot`,()=>decorations(next)]);
    actions.push(['Back to exploring',close]);
    show('Make this place yours.', [progress.rewards.length?'Choose a reward and a spot. You can change your mind whenever you like.':'Earn the flower planter in the first adventure, then bring it home.',`Selected spot: ${slot}. Placed: ${rewardNames[progress.decor[slot]]||'nothing yet'}.`],actions,'HOME');
  }
  function buggyMenu() {
    const actions=[[riding?'Hop out':'Drive the buggy',()=>{riding=!riding;if(riding)api.position().set(world.buggy.position.x,.24,world.buggy.position.z);close();api.toast(riding?'Same movement stick. Faster wheels. All the silliness.':'Back on foot.');}]];
    if(progress.rewards.includes('paint'))for(const color of ['mint','coral','gold'])actions.push([`Paint it ${color}`,()=>{send('paint',color);buggyMenu();}]);
    actions.push(['Back to exploring',close]);show('Your moon buggy.', ['Free to drive from the start. Hop out to investigate or talk to neighbors.','For a little challenge, visit the COURSE marker and drive through the numbered arches.'],actions,'BUGGY GARAGE');
  }
  function courseMenu() {
    const begin=timed=>{lap={next:0,seconds:0,timed};if(!riding){riding=true;api.position().set(world.buggy.position.x,.24,world.buggy.position.z);}close();api.toast('Drive through arch 1, then follow the numbers around the port.');};
    show('A lap around the moon.', ['Six arches and a finish back at arch 1. No penalties. Go at your own pace, or choose an optional timed lap.',`Completed laps: ${progress.completedLaps}. Best timed lap: ${progress.bestLap===null?'none yet':progress.bestLap.toFixed(1)+' seconds'}.`], [['Start an untimed lap',()=>begin(false)],['Try a timed lap',()=>begin(true)],['Back to exploring',close]],'BUGGY COURSE');
  }
  function hideMenu() {
    if(!progress.rewards.includes('planter'))return show('Three little future friends.', ['Help Luma in the first adventure to meet her babies. They love hide-and-seek.'],[['Keep exploring',close]],'ALIEN GAMES');
    show('Small aliens. Big hiding places.', ['Sprout likes the round-roofed house. Nib watches shuttles. Wiggle likes looking at the back of Pebble Post.','Find each one and use the interaction button. Your journal keeps count.',`${progress.found.length}/3 found.`],[['Play again / start hiding',()=>{progress={...progress,found:[]};hidePlaying=true;save();syncWorld();close();}],['Keep exploring',close]],'HIDE-AND-SEEK');
  }
  function journal() {
    if(progress.stage==='arrival')return pipConversation();
    const n=chapterNumber(progress), texts=[objective()];
    if(n===1){texts.push(passages.muffins);if(['fruit','return'].includes(progress.stage))texts.push(passages.food);texts.push(`Clues found: ${progress.clues.join(', ')||'none yet'}.`);}
    if(n===2)texts.push(...deliveryNotes.map(note=>`${progress.delivered.includes(note.id)?'✓ Delivered. ':''}${note.text}`));
    if(n===3)texts.push(passages.relay,`Systems online: ${progress.power.join(', ')||'none yet'}.`);
    texts.push('Move: stick or WASD/arrows. Interact: green button or E. Bubbles: round button or Space. Notes are always available here.');
    const actions=[['Keep exploring',close],['Alien hide-and-seek',hideMenu],['Home rewards',()=>region==='port' && distance(-4.7,3.9)<3?decorations():show('A place to call home.',['Visit the gold marker just outside HOME to place your rewards.'],[['Keep exploring',close]])],['Course / free-play tips',()=>show('Make your own fun.',['The buggy is parked near the front courtyard. The course starts at arch 1. Robot bowling is on the right: bubble all three pins, then use the reset marker to play again.','The crater shuttle opens in adventure three. Stories never have a timer.'],[['Keep exploring',close]])],['Start a new adventure…',()=>show('Start again on this device?', ['This clears your Chapter One progress and decorations in this browser only. It cannot be undone.'],[['Keep my adventure',journal],['Yes, start Chapter One again',()=>{progress=newProgress();save();riding=false;lap=null;hidePlaying=false;api.changeCharacter('astronaut');travel('port');world.enemies.forEach(e=>{e.hits=0;e.float=0;});close();api.toast('A fresh adventure. Pip has a message.');}]],'NEW ADVENTURE')]];
    show(progress.stage==='finished'?'Trouble at Pebble Port: solved!':titles[n-1],texts,actions,'MISSION JOURNAL');
  }
  function objective(){return progress.stage==='fruit' && progress.carryFood?'Take the moonberries back to Luma.':objectives[progress.stage];}
  function distance(x,z){const p=api.position();return Math.hypot(p.x-x,p.z-z);}
  function travel(next) {
    region=next;riding=false;lap=null;api.resetInput();world.port.visible=next==='port';world.relay.visible=next==='relay';api.setRegion(next);
    api.position().set(next==='port'?7.5:0,.24,next==='port'?3.5:6.3);syncWorld();api.toast(next==='port'?'Back at Pebble Port.':'Crater Relay. A quiet place with a very chatty signal.');
  }
  function interact(id=nearest?.id) {
    if(dialog.open || !id)return;
    if(riding && id!=='course' && id!=='buggy') {riding=false;api.toast('Hopped out of the buggy.');}
    if(id==='pip'||id==='post')return pipConversation(id==='post');
    if(['box','tracks','flower'].includes(id))return clue(id);
    if(id==='luma')return lumaConversation();
    if(id==='mira')return progress.stage==='delivery'?delivery('mira'):show('Mira’s reading nook.',['“I can read about the stars all afternoon. Sometimes my shoulders get chilly, though.”'],[['Keep exploring',close]],'MIRA');
    if(['moonberries','prickly'].includes(id))return fruit(id);
    if(id==='home-decor')return decorations();
    if(id==='buggy')return buggyMenu();
    if(id==='course')return courseMenu();
    if(id==='shuttle')return chapterNumber(progress)>=3?show('Next stop: Crater Relay.',['Your buggy stays at Pebble Port. The shuttle will bring you back whenever you like.'],[['Take the shuttle',()=>{close();travel('relay');}],['Not yet',close]],'CRATER SHUTTLE'):show('Shuttle warming up.', ['Pip has to finish the delivery job before he can decode the crater signal. You can use the buggy and other toys now.'],[['Keep exploring',close]]);
    if(id==='return-port'){close();return travel('port');}
    if(id==='log')return log();if(['fan','battery','dish'].includes(id))return system(id);if(id==='console')return consoleConversation();
    if(id==='bowling'){world.enemies.filter(e=>e.id.startsWith('bowl')).forEach(e=>{e.hits=0;e.float=0;});api.toast('Three robot pins, ready for bubbles!');return;}
    if(['sprout','nib','wiggle'].includes(id)) {
      const result=send('find',id);if(result.changed){sound('reward');api.toast(`${id[0].toUpperCase()+id.slice(1)} found! ${progress.found.length}/3 little aliens.`);if(progress.found.length===3)show('You found the whole family!', ['Three delighted squeaks. Luma’s babies now consider you an honorary alien. Open the journal to play again.'],[['Keep exploring',close]],'HIDE-AND-SEEK');}
    }
  }
  function syncWorld() {
    const n=chapterNumber(progress);
    for(const e of world.enemies) {
      const complete=e.id==='garden'?n>1||['alien','fruit','return'].includes(progress.stage):e.id==='parcel'?n>2||progress.stage==='delivery-return':progress.guards.includes(e.id);
      if(complete)e.hits=3;
      e.root.visible=e.id==='garden'?n===1:e.id==='parcel'?n===2: true;
      e.sign.visible=e.root.visible;
    }
    world.hidden.forEach(h=>h.root.visible=progress.rewards.includes('planter')&&!progress.found.includes(h.id));
    Object.entries(world.slots).forEach(([id,g])=>{g.getObjectByName('planter').visible=progress.decor[id]==='planter';g.getObjectByName('lamp').visible=progress.decor[id]==='lamp';});
    world.buggyMaterial.color.set({mint:'#6daea2',coral:'#df876d',gold:'#edbd61'}[progress.paint]);
    for(const [id,g] of Object.entries(world.systems))g.getObjectByName('status').material=api.mat(progress.power.includes(id)?'#8acb94':'#dc765b');
  }
  function bubble() {
    sound('bubble');
    const candidates=world.enemies.filter(e=>e.region===region&&e.root.visible&&e.hits<3&&canBubbleGuard(progress,e.id)&&distance(e.base.x,e.base.z)<3.2);
    candidates.sort((a,b)=>distance(a.base.x,a.base.z)-distance(b.base.x,b.base.z));
    const e=candidates[0];if(!e)return;
    e.hits++;e.float=1;
    api.toast(e.hits<3?`${e.id.startsWith('bowl')?'Bowling bot':'Silly robot'}: ${e.hits}/3 bubbles. “Unscheduled bath time?!”`:'Robot rebooted! “I appear to be… a balloon.”');
    if(e.hits===3) {
      if(e.id==='garden')send('garden-guard');else if(e.id==='parcel')send('parcel-robot');else if(['left','right'].includes(e.id))send('relay-guard',e.id);
      if(e.id.startsWith('bowl') && world.enemies.filter(b=>b.id.startsWith('bowl')).every(b=>b.hits===3)){sound('reward');api.toast('Robot bowling strike! Use the reset marker to play again.');}
    }
  }
  function targetVisible(t) {
    if(t.region!==region)return false;
    if(['sprout','nib','wiggle'].includes(t.id))return progress.rewards.includes('planter')&&!progress.found.includes(t.id);
    if(['box','tracks','flower'].includes(t.id))return chapterNumber(progress)===1;
    return true;
  }
  function refresh(){
    $('#mission small').textContent=progress.stage==='finished'?'CHAPTER ONE COMPLETE':`ADVENTURE ${chapterNumber(progress)} OF 3`;
    $('#mission strong').textContent=progress.stage==='finished'?'Your spaceport. Your adventures.':titles[chapterNumber(progress)-1];
    $('#mission em').textContent='Journal & clues ↗';$('#objective').textContent=objective();
    $('#save-status').textContent=saved?'Progress saved on this device':'Saving unavailable — keep this tab open';
  }
  function update(dt,time) {
    updateTime+=dt;
    if(riding){world.buggy.position.set(api.position().x,.3,api.position().z);world.buggy.rotation.y=api.heading();}
    for(const e of world.enemies) {
      e.float=Math.max(0,e.float-dt);const floating=e.hits===3||e.float>0;
      e.root.position.copy(e.base);e.root.position.y+=floating?1.35+Math.sin(time*2)*.12:Math.sin(time*2)*.03;
      if(e.hits===3&&e.id.startsWith('bowl')){e.root.position.z+=1.2;e.root.rotation.z=.7;}else e.root.rotation.z=floating?Math.sin(time*3)*.12:0;
      e.bubble.visible=floating;e.sign.visible=e.root.visible&&!floating;
    }
    if(progress.power.includes('fan'))world.systems.fan.getObjectByName('rotor').rotation.z+=dt*4;
    if(lap && riding){
      lap.seconds+=dt;const point=world.course[lap.next];
      world.gates.forEach((g,i)=>g.scale.setScalar(i===lap.next%6?1.15:1));
      if(distance(point[0],point[1])<1.2){lap.next++;sound();if(lap.next===world.course.length){const done=lap;lap=null;send('lap',done.timed?done.seconds:null);sound('reward');api.toast(done.timed?`Lap complete! ${done.seconds.toFixed(1)} seconds.`:'Lap complete! Nicely driven.');}else api.toast(`Arch ${lap.next} passed. Next: ${lap.next===6?'back to 1':lap.next+1}.`);}
    }
    $('#activity-status').textContent=lap?`BUGGY LAP · ${lap.next===6?'FINISH AT 1':`ARCH ${lap.next+1}`} ${lap.timed?'· '+lap.seconds.toFixed(1)+'s':''}`:hidePlaying?`HIDE-AND-SEEK · ${progress.found.length}/3` : '';
    if(updateTime<.12)return;updateTime=0;
    const active=world.targets.filter(targetVisible);
    active.forEach(t=>{
      t.marker.visible=t.id!=='buggy'||!riding;
      if(t.id==='buggy'){t.marker.position.x=world.buggy.position.x;t.marker.position.z=world.buggy.position.z;}
    });
    world.targets.filter(t=>!targetVisible(t)).forEach(t=>t.marker.visible=false);
    nearest=active.filter(t=>t.id!=='buggy' && distance(t.x,t.z)<1.6).sort((a,b)=>distance(a.x,a.z)-distance(b.x,b.z))[0]||null;
    if(region==='port' && !nearest && (riding||distance(world.buggy.position.x,world.buggy.position.z)<1.8))nearest={id:'buggy',title:riding?'Hop out / paint buggy':'Drive / paint buggy'};
    const prompt=nearest?nearest.title:'Explore to find something nearby';
    if(lastPrompt!==prompt){$('#interact').textContent=nearest?`${prompt} · E`:'Explore';$('#interact').disabled=!nearest;$('#nearby').textContent=nearest?prompt:'';lastPrompt=prompt;}
    $('#ride-status').textContent=riding?'DRIVING':'ON FOOT';
  }
  $('#mission').onclick=journal;
  $('#close-mission').onclick=close;
  $('#interact').onclick=()=>interact();
  $('#read-aloud').onclick=()=>{
    // Read body paragraphs, not the decorative heading, to start recorded dialogue immediately.
    voice.read([...$('#dialog-body').children].map(element=>({text:element.textContent,element})));
  };
  $('#sound').onclick=()=>{soundEnabled=!soundEnabled;$('#sound').setAttribute('aria-pressed',String(soundEnabled));$('#sound').textContent=soundEnabled?'♫ Effects on':'♫ Effects off';if(audioGain)audioGain.gain.value=soundEnabled?.08:0;sound();$('#sound').blur();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audio?.suspend().catch(()=>{});voice.stop();}});
  window.addEventListener('pagehide',voice.stop);
  dialog.addEventListener('close',()=>{voice.stop();api.resetInput();});
  refresh();syncWorld();
  return { initial,update,bubble,interact,journal,travel,saveCharacter:kind=>send('character',kind),
    riding:()=>riding,region:()=>region,recenter:()=>{riding=false;lap=null;api.resetInput();api.position().set(0,.24,region==='port'?4.6:6.3);},
    blocked:(x,z)=>world.enemies.some(e=>e.region===region&&e.root.visible&&e.hits<3&&Math.hypot(x-e.base.x,z-e.base.z)<.75),
    debug:()=>({progress:structuredClone(progress),region,riding,nearest:nearest?.id,lap:lap&&{...lap},enemies:world.enemies.map(e=>({id:e.id,hits:e.hits,x:e.base.x,z:e.base.z})),targets:world.targets.filter(targetVisible).map(t=>({id:t.id,x:t.x,z:t.z})),audio:audio?.state||'not-created',saved}),
  };
}
