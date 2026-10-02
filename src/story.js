export const SAVE_KEY = 'event-horizon-chapter-one-v1';
export const stages = [
  'arrival', 'snacks', 'thought', 'guard', 'alien', 'fruit', 'return',
  'delivery-brief', 'delivery', 'parcel-robot', 'delivery-return',
  'signal-brief', 'relay-log', 'relay-guards', 'relay-power', 'relay-return', 'finished',
];
export const deliveryNotes = [
  { id: 'blanket', title: 'A soft parcel', text: 'Mira lives in the round-roofed house. Her heater works, but she gets chilly while reading. Send her something soft to wrap around her shoulders.', recipient: 'mira' },
  { id: 'watering', title: 'A clinking parcel', text: 'Luma has plenty of food now. Her new moonberry plants are drooping because the soil is dry. She needs something that carries water, not something to eat.', recipient: 'luma' },
  { id: 'bulb', title: 'A fragile parcel', text: 'Pip sorts letters at Pebble Post. His desk lamp has stopped shining, even though the power is working. Send a replacement for the part that makes light.', recipient: 'pip' },
];
export const passages = {
  muffins: '“I left a box of moon muffins beside the rocket. Now the box is empty! Tiny purple footprints lead toward the garden, and whoever took my muffins left a flower. A very polite snack thief, if you ask me.” — Pip',
  food: '“My babies ate your muffins. I left a flower because I thought it was a fair trade. We can grow our own food if you bring moonberries. They grow on the low blue plant with crescent-shaped leaves. The tall purple plant has prickly fruit that makes our tongues itch!” — Luma',
  relay: 'Caretaker’s maintenance log: “The battery overheats unless the cooling fan is running. Start the fan before switching on the battery. The antenna dish must wait until the battery supplies power. When all three are working, open the console to send a message.”',
};
export function newProgress() {
  return { version: 1, stage: 'arrival', clues: [], delivered: [], power: [], guards: [],
    rewards: [], decor: { porch: null, yard: null, garden: null }, character: 'astronaut',
    paint: 'mint', found: [], bestLap: null, completedLaps: 0 };
}
export function restoreProgress(raw) {
  try {
    const p = JSON.parse(raw);
    if (p?.version !== 1 || !stages.includes(p.stage) ||
      !['clues','delivered','power','guards','rewards','found'].every(k=>Array.isArray(p[k])) ||
      !p.decor || !['astronaut','alien','robot'].includes(p.character)) return null;
    return { ...newProgress(), ...p };
  } catch { return null; }
}
export function chapterNumber(p) {
  const i = stages.indexOf(p.stage);
  return i < 7 ? 1 : i < 11 ? 2 : 3;
}
export const objectives = {
  arrival: 'Read Pip’s message to begin.', snacks: 'Inspect the snack box, tracks, and flower beside the rocket.',
  thought: 'Talk to Pip about the clues.', guard: 'Bubble the garden guard three times.',
  alien: 'Meet Luma at the garden.', fruit: 'Use Luma’s note to find food for her babies.',
  return: 'Tell Pip what really happened.', 'delivery-brief': 'Visit Pebble Post for a delivery job.',
  delivery: 'Read the delivery notes. Match each parcel to a neighbor.', 'parcel-robot': 'Bubble the parcel robot guarding Pebble Post.',
  'delivery-return': 'Report your deliveries at Pebble Post.', 'signal-brief': 'Talk to Pip about the strange signal.',
  'relay-log': 'Take the crater shuttle and read the maintenance log.',
  'relay-guards': 'Bubble both relay sentries three times each.', 'relay-power': 'Use the log to restart the three systems in order.',
  'relay-return': 'Open the relay console, then bring the news to Pip.',
  finished: 'Chapter complete! Decorate, drive, bowl, and find the little aliens.',
};
export const titles = ['The Missing Moon Muffins', 'Special Delivery… Probably', 'The Signal Beyond the Crater'];

export function canBubbleGuard(p,id) {
  return id.startsWith('bowl-') || (id==='garden' && p.stage==='guard') ||
    (id==='parcel' && p.stage==='parcel-robot') ||
    (['left','right'].includes(id) && p.stage==='relay-guards');
}

// All story advancement is here; UI and effects cannot award mission progress themselves.
export function advance(current, event, value) {
  const p = structuredClone(current);
  let feedback = '', changed = false;
  const stage = s => { p.stage=s; changed=true; };
  const add = (key,id) => { if(!p[key].includes(id)){p[key].push(id);changed=true;} };
  switch(event) {
    case 'start': if(p.stage==='arrival')stage('snacks'); break;
    case 'clue':
      if(p.stage==='snacks' && ['box','tracks','flower'].includes(value)) {
        add('clues',value); if(p.clues.length===3)stage('thought');
      } break;
    case 'inference':
      if(p.stage==='thought') {
        if(value==='trade')stage('guard');
        else feedback='The thief left something behind. What might the flower tell Pip about their intention? You can reread his message.';
      } break;
    case 'garden-guard': if(p.stage==='guard')stage('alien'); break;
    case 'meet-luma': if(p.stage==='alien')stage('fruit'); break;
    case 'food':
      if(p.stage==='fruit') {
        if(value==='moonberries'){p.carryFood=true;changed=true;}
        else feedback='Those are prickly purple fruit. Luma said they make her babies’ tongues itch. Try the low blue plant.';
      } break;
    case 'feed': if(p.stage==='fruit' && p.carryFood)stage('return');break;
    case 'report-muffins':
      if(p.stage==='return'){add('rewards','planter');stage('delivery-brief');} break;
    case 'accept-deliveries': if(p.stage==='delivery-brief')stage('delivery'); break;
    case 'deliver':
      if(p.stage==='delivery') {
        const note=deliveryNotes.find(n=>n.id===value?.parcel);
        if(note && note.recipient===value.recipient) {
          add('delivered',note.id); if(p.delivered.length===3)stage('parcel-robot');
        } else feedback='This neighbor needs something else. Read the notes again: think about the problem the parcel should solve.';
      } break;
    case 'parcel-robot': if(p.stage==='parcel-robot')stage('delivery-return'); break;
    case 'report-deliveries':
      if(p.stage==='delivery-return'){add('rewards','paint');stage('signal-brief');} break;
    case 'accept-signal': if(p.stage==='signal-brief')stage('relay-log'); break;
    case 'read-log': if(p.stage==='relay-log')stage('relay-guards'); break;
    case 'relay-guard':
      if(p.stage==='relay-guards' && ['left','right'].includes(value)) {
        add('guards',value); if(p.guards.length===2)stage('relay-power');
      } break;
    case 'power':
      if(p.stage==='relay-power') {
        const sequence=['fan','battery','dish'];
        if(value===sequence[p.power.length]) {
          add('power',value); if(p.power.length===3)stage('relay-return');
        } else feedback=value==='battery'?'The battery is still too hot. The log says to start the cooling fan first.':value==='dish'?'The dish has no power yet. Check what the log says must supply it.':'That system is already running. Keep going; your progress is safe.';
      } break;
    case 'console':
      if(p.stage==='relay-return'){p.signalHeard=true;changed=true;} break;
    case 'report-signal':
      if(p.stage==='relay-return' && p.signalHeard){add('rewards','lamp');stage('finished');} break;
    case 'decorate':
      if(['porch','yard','garden'].includes(value?.slot) && (value.reward===null || p.rewards.includes(value.reward)) && value.reward!=='paint') {
        p.decor[value.slot]=value.reward;changed=true;
      } break;
    case 'character': if(['astronaut','alien','robot'].includes(value)){p.character=value;changed=true;} break;
    case 'paint': if(['mint','coral','gold'].includes(value) && (value==='mint'||p.rewards.includes('paint'))){p.paint=value;changed=true;} break;
    case 'find': if(p.rewards.includes('planter') && ['sprout','nib','wiggle'].includes(value))add('found',value);break;
    case 'lap':
      p.completedLaps++;changed=true;
      if(typeof value==='number' && value>0)p.bestLap=p.bestLap===null?value:Math.min(value,p.bestLap);
      break;
  }
  return { progress: changed?p:current, changed, feedback };
}
