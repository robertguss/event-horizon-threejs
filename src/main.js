import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import "./style.css";
import { createAdventureWorld } from './adventure-world.js';
import { createChapter } from './chapter.js';

// Chapter One: handcrafted models, no external models or paid runtime services.
const scene = new THREE.Scene();
scene.background = new THREE.Color("#8bc3c2");
const world = document.querySelector("#world");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  document.querySelector("#fallback").hidden = false;
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
world.append(renderer.domElement);
const camera = new THREE.OrthographicCamera(-16, 16, 10, -10, 0.1, 160);
const cameraOffset = new THREE.Vector3(17, 24, 29);
const cameraTarget = new THREE.Vector3(0, 0, 0);
const fill = new THREE.HemisphereLight("#e5ffff", "#b97450", 2.6);
scene.add(fill);
const sun = new THREE.DirectionalLight("#fff0d4", 3.4);
sun.position.set(-12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -20,
  right: 20,
  top: 20,
  bottom: -20,
  near: 1,
  far: 65,
});
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.045;
scene.add(sun);
const palette = {};
function mat(color) {
  if (!palette[color])
    palette[color] = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  return palette[color];
}
const C = {
  cream: "#fff0cd",
  mint: "#74afa5",
  dark: "#295762",
  coral: "#dc765b",
  gold: "#efbb68",
  sand: "#e4ad80",
  stone: "#bf8163",
  leaf: "#6da887",
  purple: "#a788b4",
};
const staticWorld = new THREE.Group();
scene.add(staticWorld);
function mesh(geometry, color, x, y, z, parent = staticWorld) {
  const m = new THREE.Mesh(
    geometry,
    typeof color === "string" ? mat(color) : color,
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(w, h, d, color, x, y, z, parent = staticWorld, r = 0.12) {
  return mesh(new RoundedBoxGeometry(w, h, d, 2, r), color, x, y, z, parent);
}
function ball(r, color, x, y, z, parent = staticWorld, sx = 1, sy = 1, sz = 1) {
  const m = mesh(new THREE.SphereGeometry(r, 20, 12), color, x, y, z, parent);
  m.scale.set(sx, sy, sz);
  return m;
}
function cyl(rt, rb, h, color, x, y, z, parent = staticWorld, n = 40) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, n), color, x, y, z, parent);
}
function ring(r, t, color, x, y, z, parent = staticWorld) {
  const m = mesh(new THREE.TorusGeometry(r, t, 8, 56), color, x, y, z, parent);
  m.rotation.x = -Math.PI / 2;
  return m;
}
function label(
  text,
  x,
  y,
  z,
  width = 2.8,
  color = C.dark,
  parent = staticWorld,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 128, 18);
  ctx.fill();
  ctx.fillStyle = "#fff3d5";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 50px sans-serif";
  ctx.fillText(text, 256, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / 4),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
// A compact floating slice of a moon, with soft cliff strata.
cyl(12.7, 11.6, 1.45, C.stone, 0, -0.84, 0, staticWorld, 64);
cyl(12.9, 12.65, 0.4, C.sand, 0, -0.05, 0, staticWorld, 64);
cyl(12.2, 10.7, 1.2, "#a57561", 0, -1.9, 0, staticWorld, 48);
const groundMat = mat(C.sand);
// Paths meet at the little garden: broad shapes instead of a huge empty map.
box(3.1, 0.06, 16, "#f3cb91", 0, 0.18, 0);
box(18, 0.06, 2.8, "#f3cb91", 0, 0.19, 0);
cyl(4.4, 4.4, 0.08, "#f5cf98", 0, 0.2, 0);
ring(4, 0.075, "#fff0c3", 0, 0.26, 0);
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  const p = box(
    0.13,
    0.035,
    0.42,
    C.cream,
    Math.sin(a) * 3.63,
    0.28,
    Math.cos(a) * 3.63,
  );
  p.rotation.y = a;
}
cyl(1.6, 1.8, 0.24, "#c2bfa2", 0, 0.34, -0.2);
cyl(1.4, 1.4, 0.14, "#79917b", 0, 0.52, -0.2);
ring(1.62, 0.12, C.cream, 0, 0.48, -0.2);
// Spaceport headquarters, back-left. Architectural layers and readable signs.
const obstacles = [];
function building(x, z, w, d, h, title) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  staticWorld.add(g);
  box(w + 0.3, 0.35, d + 0.3, "#c8b18c", 0, 0.35, 0, g);
  box(w, h, d, C.cream, 0, h / 2 + 0.45, 0, g, 0.3);
  box(w + 0.35, 0.4, d + 0.35, C.mint, 0, h + 0.5, 0, g, 0.16);
  box(w + 0.48, 0.13, d + 0.48, "#a4cec0", 0, h + 0.73, 0, g, 0.08);
  box(1.22, 1.85, 0.18, C.mint, 0, 1.3, d / 2 + 0.11, g, 0.23);
  box(0.84, 1.52, 0.15, C.dark, 0, 1.22, d / 2 + 0.23, g, 0.2);
  box(0.57, 0.9, 0.04, "#6fabb0", 0, 1.36, d / 2 + 0.32, g, 0.14);
  box(0.18, 0.07, 0.07, C.gold, 0.23, 1.1, d / 2 + 0.36, g);
  box(1.8, 0.2, 0.8, "#d2c3a1", 0, 0.35, d / 2 + 0.4, g);
  for (const xx of [-w * 0.32, w * 0.32]) {
    box(0.84, 1.05, 0.18, "#d7b88a", xx, 1.8, d / 2 + 0.07, g, 0.18);
    box(0.65, 0.81, 0.09, C.dark, xx, 1.82, d / 2 + 0.18, g, 0.15);
    box(0.5, 0.6, 0.06, "#9acaaf", xx, 1.86, d / 2 + 0.24, g, 0.09);
    box(0.07, 0.7, 0.08, C.cream, xx, 1.86, d / 2 + 0.29, g, 0.025);
  }
  label(title, 0, h + 0.05, d / 2 + 0.28, w * 0.7, C.dark, g);
  obstacles.push({ x, z, r: Math.max(w, d) / 2 + 0.35 });
  return g;
}
const station = building(-4.8, -5, 4.7, 3.5, 3.1, "PEBBLE POST");
box(1.65, 1.6, 1.65, C.cream, -0.6, 4.7, -0.15, station, 0.2);
box(1.88, 0.25, 1.87, C.mint, -0.6, 5.57, -0.15, station);
box(0.9, 0.85, 0.08, C.dark, -0.6, 4.75, 0.72, station);
box(0.65, 0.6, 0.05, "#8fc2b8", -0.6, 4.77, 0.78, station);
cyl(0.035, 0.035, 1.3, C.dark, -0.6, 6.3, -0.15, station, 12);
ball(0.14, C.gold, -0.6, 6.98, -0.15, station);
cyl(0.12, 0.18, 0.65, C.dark, 1.2, 3.95, -0.6, station);
const dish = ball(0.75, C.cream, 1.2, 4.55, -0.6, station, 1, 0.2, 1);
dish.rotation.z = 0.5;
const home = building(-6.5, 2.3, 3.35, 3.1, 2.2, "HOME");
const dome = mesh(
  new THREE.SphereGeometry(1.72, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  C.mint,
  0,
  2.83,
  0,
  home,
);
box(0.5, 0.4, 0.7, C.cream, 0.9, 3.9, 0, home);
cyl(0.04, 0.04, 0.8, C.dark, 0.9, 4.4, 0, home, 12);
ball(0.1, C.coral, 0.9, 4.85, 0, home);
// Rocket and landing pad.
cyl(2.75, 2.95, 0.45, "#ac9d83", 6, -0.02, -3);
cyl(2.6, 2.6, 0.12, C.dark, 6, 0.27, -3);
ring(2.22, 0.055, C.gold, 6, 0.35, -3);
for (let i = 0; i < 8; i++) {
  const a = (i * Math.PI) / 4;
  const p = box(
    0.1,
    0.05,
    0.46,
    C.cream,
    6 + Math.sin(a) * 2.2,
    0.4,
    -3 + Math.cos(a) * 2.2,
  );
  p.rotation.y = a;
}
const rocket = new THREE.Group();
rocket.position.set(6, 0.4, -3);
staticWorld.add(rocket);
const hullPoints = [
  [0, 0],
  [0.6, 0],
  [0.83, 0.5],
  [0.9, 1.5],
  [0.77, 2.5],
  [0.5, 3.1],
  [0, 3.8],
].map(([x, y]) => new THREE.Vector2(x, y));
mesh(new THREE.LatheGeometry(hullPoints, 40), C.cream, 0, 0.6, 0, rocket);
const nosePoints = [
  [0.77, 0],
  [0.65, 0.4],
  [0.4, 0.9],
  [0, 1.4],
].map(([x, y]) => new THREE.Vector2(x, y));
mesh(new THREE.LatheGeometry(nosePoints, 40), C.coral, 0, 3, 0, rocket);
ring(0.81, 0.065, C.coral, 0, 1.2, 0, rocket);
const port = cyl(0.43, 0.43, 0.16, C.gold, 0, 2.55, 0.84, rocket);
port.rotation.x = Math.PI / 2;
const glass = cyl(0.32, 0.32, 0.19, C.dark, 0, 2.55, 0.94, rocket);
glass.rotation.x = Math.PI / 2;
ball(0.1, "#aee2d4", -0.1, 2.66, 1.05, rocket, 1, 1, 0.2);
for (const side of [-1, 1]) {
  const shape = new THREE.Shape();
  shape.moveTo(side * 0.55, 0.8);
  shape.lineTo(side * 1.35, 0.12);
  shape.lineTo(side * 1.3, 1.6);
  shape.lineTo(side * 0.67, 2.35);
  shape.closePath();
  mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSize: 0.09,
      bevelThickness: 0.08,
      bevelSegments: 2,
      steps: 1,
    }),
    C.coral,
    0,
    0,
    0,
    rocket,
  );
}
cyl(0.43, 0.65, 0.6, C.dark, 0, 0.3, 0, rocket);
label("01", 0, 1.55, 0.88, 0.6, C.coral, rocket);
obstacles.push({ x: 6, z: -3, r: 1.65 });
// Little landing steps and sign.
for (let i = 0; i < 3; i++)
  box(1.4, 0.15, 0.48, "#d4b387", 6, 0.08 + i * 0.08, -0.1 - i * 0.45);
box(0.12, 1.2, 0.12, C.dark, 4.1, 0.8, 1.7);
label("TO THE STARS ↗", 4.1, 1.7, 1.7, 2.3, C.mint);
// Rounded desert succulents, scattered rocks, and a central alien bloom.
function plant(x, z, size = 1, color = C.leaf) {
  const g = new THREE.Group();
  g.position.set(x, 0.26, z);
  staticWorld.add(g);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const leaf = ball(
      0.3 * size,
      color,
      Math.sin(a) * 0.27 * size,
      0.45 * size,
      Math.cos(a) * 0.27 * size,
      g,
      0.65,
      1.9,
      0.75,
    );
    leaf.rotation.z = Math.cos(a) * 0.5;
    leaf.rotation.x = Math.sin(a) * 0.5;
  }
  ball(0.15 * size, C.gold, 0, 1.05 * size, 0, g);
}
plant(0, -0.2, 1.55, C.mint);
for (const [x, z, s] of [
  [-9, -3, 1.1],
  [-8, 6, 0.9],
  [-3, -8, 1.2],
  [9, 1, 1],
  [7, 5, 0.9],
  [3, 8, 1.3],
  [-4, 7, 0.7],
  [-9, 0, 0.6],
  [1, -9, 0.8],
  [9, -5, 0.8],
  [-6, -8, 0.7],
  [5, 6, 0.6],
])
  plant(x, z, s);
let seed = 2718;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let i = 0; i < 48; i++) {
  const a = random() * Math.PI * 2,
    r = 9 + random() * 3.3,
    x = Math.cos(a) * r,
    z = Math.sin(a) * r;
  const m = mesh(
    new THREE.DodecahedronGeometry(0.16 + random() * 0.38),
    i % 3 ? "#c98c6a" : "#f1c596",
    x,
    0.25,
    z,
  );
  m.scale.set(1.3, 0.65, 1);
  m.rotation.set(random(), random(), random());
}
for (let i = 0; i < 20; i++) {
  const a = (i / 20) * Math.PI * 2;
  const m = mesh(
    new THREE.DodecahedronGeometry(0.8),
    i % 2 ? C.stone : "#c18a6b",
    Math.sin(a) * 11.9,
    -0.9,
    Math.cos(a) * 11.9,
  );
  m.scale.set(1.3, 1.05, 1.2);
  m.rotation.y = a;
}
function crate(x, z, s = 0.65) {
  box(s, s, s, "#d8a866", x, 0.3 + s / 2, z);
  box(s + 0.05, 0.09, s + 0.05, "#b38655", x, 0.32 + s * 0.75, z);
  box(0.1, s + 0.05, s + 0.05, "#b38655", x, 0.3 + s / 2, z);
}
crate(-2.5, -4);
crate(-2, -4.8, 0.5);
crate(7, 0, 0.55);
// Lamps and benches make the port feel inhabited.
for (const [x, z] of [
  [-2.1, 3.4],
  [2.1, 3.4],
  [-2, -2.7],
  [2, -2.7],
  [4.1, -0.4],
  [-8.6, 2],
]) {
  cyl(0.18, 0.24, 0.22, C.mint, x, 0.33, z);
  cyl(0.075, 0.075, 0.78, C.dark, x, 0.81, z, staticWorld, 12);
  cyl(0.18, 0.18, 0.32, "#fff1bd", x, 1.3, z, staticWorld, 16);
  ball(0.2, C.mint, x, 1.48, z, staticWorld, 1, 0.45, 1);
}
for (const x of [-2.8, 2.8]) {
  box(1.4, 0.14, 0.48, C.coral, x, 0.8, 2.4);
  box(1.4, 0.45, 0.1, C.coral, x, 1.05, 2.16);
  for (const d of [-0.45, 0.45]) box(0.09, 0.5, 0.4, C.dark, x + d, 0.48, 2.4);
}
// A few distant moons create depth without expensive sky assets.
const sky = new THREE.Group();
scene.add(sky);
ball(2.8, "#e0c8ad", -1, 2, -17, sky);
const orbit = ring(4.2, 0.1, "#e8dec1", -1, 2, -17, sky);
orbit.rotation.z = 0.24;
ball(0.9, "#d9a091", -16, 6, -14, sky);
for (let i = 0; i < 12; i++) {
  const p = mesh(
    new THREE.IcosahedronGeometry(0.2 + random() * 0.4),
    i % 2 ? "#8aacab" : "#bbbcaa",
    random() * 45 - 22,
    -1 + random() * 5,
    -17 - random() * 10,
    sky,
  );
  p.rotation.set(random(), random(), 0);
}
// Merge static meshes by material to keep the handcrafted world light on iPad.
staticWorld.updateMatrixWorld(true);
const batches = new Map();
staticWorld.traverse((o) => {
  if (o.isMesh && !Array.isArray(o.material)) {
    const k = o.material;
    if (!batches.has(k)) batches.set(k, []);
    const geometry = o.geometry.index
      ? o.geometry.toNonIndexed()
      : o.geometry.clone();
    geometry.applyMatrix4(o.matrixWorld);
    batches.get(k).push(geometry);
  }
});
scene.remove(staticWorld);
const portStatic = new THREE.Group();
scene.add(portStatic);
for (const [material, geometries] of batches) {
  const merged = mergeGeometries(geometries);
  const m = new THREE.Mesh(merged, material);
  m.castShadow = true;
  m.receiveShadow = true;
  portStatic.add(m);
  geometries.forEach((g) => g.dispose());
}
const originals = new Set();
staticWorld.traverse((o) => {
  if (o.isMesh) originals.add(o.geometry);
});
originals.forEach((g) => g.dispose());

function character(kind) {
  const g = new THREE.Group();
  const limbs = [];
  const color = kind === "robot" ? C.gold : kind === "alien" ? C.leaf : C.cream;
  box(0.62, 0.72, 0.45, color, 0, 0.91, 0, g, 0.16);
  box(
    0.46,
    0.5,
    0.25,
    kind === "astronaut" ? C.coral : C.mint,
    0,
    0.94,
    -0.31,
    g,
  );
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.2, 0.59, 0);
    g.add(leg);
    limbs.push(leg);
    box(0.22, 0.43, 0.23, color, 0, -0.19, 0, leg, 0.09);
    box(0.25, 0.18, 0.38, C.dark, 0, -0.4, 0.08, leg, 0.08);
    const arm = new THREE.Group();
    arm.position.set(s * 0.4, 1.1, 0);
    g.add(arm);
    limbs.push(arm);
    box(0.2, 0.43, 0.23, color, 0, -0.15, 0, arm, 0.095);
    ball(0.12, kind === "astronaut" ? C.gold : color, 0, -0.4, 0, arm);
  }
  if (kind === "astronaut") {
    ball(0.44, C.cream, 0, 1.6, 0, g, 1, 1, 0.93);
    ball(0.36, C.dark, 0, 1.63, 0.2, g, 1, 0.73, 0.7);
    ball(0.14, "#74a8b2", -0.13, 1.74, 0.395, g, 1, 0.32, 0.25);
    for (const s of [-1, 1])
      ball(0.15, C.coral, s * 0.43, 1.58, 0, g, 0.45, 1, 1);
    box(0.32, 0.24, 0.08, C.coral, 0, 1.01, 0.26, g, 0.05);
  } else if (kind === "alien") {
    ball(0.43, "#96c7a2", 0, 1.63, 0, g, 1.12, 0.95, 0.9);
    for (const s of [-1, 1]) {
      ball(0.12, C.dark, s * 0.18, 1.65, 0.31, g, 0.65, 1.15, 0.5);
      ball(0.035, C.cream, s * 0.18 - 0.02, 1.7, 0.365, g);
      const ear = ball(0.18, C.leaf, s * 0.47, 1.7, 0, g, 1.5, 0.7, 0.4);
      ear.rotation.z = s * 0.4;
    }
    box(0.13, 0.035, 0.05, C.dark, 0, 1.45, 0.34, g, 0.015);
  } else {
    box(0.77, 0.63, 0.57, C.gold, 0, 1.6, 0, g, 0.16);
    box(0.6, 0.37, 0.09, C.dark, 0, 1.6, 0.31, g, 0.09);
    for (const s of [-1, 1])
      ball(0.065, "#c4f2db", s * 0.16, 1.65, 0.38, g, 1, 1, 0.4);
    box(0.16, 0.035, 0.03, "#c4f2db", 0, 1.49, 0.37, g, 0.01);
    cyl(0.035, 0.035, 0.22, C.dark, 0, 2.01, 0, g, 12);
    ball(0.09, C.coral, 0, 2.15, 0, g);
  }
  g.userData.limbs = limbs;
  g.scale.setScalar(1.18);
  return g;
}
const player = new THREE.Group();
player.position.set(0, 0.24, 4.6);
scene.add(player);
let selected = "astronaut",
  avatar = character(selected);
player.add(avatar);
avatar.rotation.y = 0.15;
const pip = character("robot");
pip.position.set(2.4, 0.24, -0.3);
pip.rotation.y = 0.45;
portStatic.add(pip);
const speech = label("BEEP. NICE HAT.", 2.4, 3, -0.3, 2.3, C.dark, portStatic);
speech.quaternion.copy(camera.quaternion);
const contact = new THREE.Mesh(
  new THREE.CircleGeometry(0.6, 32),
  new THREE.MeshBasicMaterial({
    color: "#3d6159",
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  }),
);
contact.rotation.x = -Math.PI / 2;
contact.position.y = 0.015;
player.add(contact);

const $ = (s) => document.querySelector(s);
const keys = new Set();
let joy = { x: 0, y: 0 },
  pointer = null,
  lastBubble = -10,
  toastTimer,
  night = false;
const dialog = $("#mission-dialog");
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").style.opacity = "0"), 4200);
}
toast("Welcome, explorer. Make yourself at home.");
function resetInput() {
  keys.clear();
  joy = { x: 0, y: 0 };
  pointer = null;
  $("#stick").style.transform = "";
}
window.addEventListener("blur", resetInput);
document.addEventListener("visibilitychange", resetInput);
window.addEventListener("keydown", (e) => {
  if (dialog.open || (e.key === " " && e.target.closest("button"))) return;
  if (e.key.toLowerCase() === 'e' && !e.repeat) { e.preventDefault(); chapter.interact(); return; }
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "w",
      "a",
      "s",
      "d",
      "W",
      "A",
      "S",
      "D",
    ].includes(e.key)
  ) {
    e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key === " " && !e.repeat) blowBubble();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
const joystick = $("#joystick");
function drag(e) {
  if (e.pointerId !== pointer) return;
  const r = joystick.getBoundingClientRect();
  let x = e.clientX - r.left - r.width / 2,
    y = e.clientY - r.top - r.height / 2;
  const length = Math.hypot(x, y),
    limit = r.width * 0.3;
  if (length > limit) {
    x *= limit / length;
    y *= limit / length;
  }
  joy = { x: x / limit, y: y / limit };
  $("#stick").style.transform = `translate(${x}px,${y}px)`;
}
joystick.addEventListener("pointerdown", (e) => {
  if (pointer !== null) return;
  pointer = e.pointerId;
  joystick.setPointerCapture(pointer);
  drag(e);
});
joystick.addEventListener("pointermove", drag);
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  joystick.addEventListener(type, (e) => {
    if (e.pointerId === pointer) {
      pointer = null;
      joy = { x: 0, y: 0 };
      $("#stick").style.transform = "";
    }
  });
$("#mission").onclick = () => {
  resetInput();
  dialog.showModal();
};
$("#close-mission").onclick = () => dialog.close();
dialog.addEventListener("close", () => {
  $("#mission").blur();
  resetInput();
});
$("#home").onclick = () => {
  chapter.recenter();
  toast("Back at the courtyard.");
  $("#home").blur();
};
const originalSky = new THREE.Color("#8bc3c2");
$("#mood").onclick = () => {
  night = !night;
  document.body.classList.toggle("twilight", night);
  $("#mood").setAttribute("aria-pressed", String(night));
  $("#mood").innerHTML = night
    ? '<span aria-hidden="true">☀</span> Daylight'
    : '<span aria-hidden="true">☾</span> Twilight';
  scene.background.set(night ? "#405374" : originalSky);
  fill.color.set(night ? "#a5b7f4" : "#e5ffff");
  fill.groundColor.set(night ? "#7b638f" : "#b97450");
  fill.intensity = night ? 2 : 2.6;
  sun.color.set(night ? "#b8c4ff" : "#fff0d4");
  sun.intensity = night ? 1.6 : 3.4;
  groundMat.color.set(night ? "#b496b0" : C.sand);
  $("#mood").blur();
};
function changeCharacter(kind) {
  const button = document.querySelector(`[data-character="${kind}"]`);
  button.click();
}
document.querySelectorAll("[data-character]").forEach(
  (button) =>
    (button.onclick = () => {
      player.remove(avatar);
      avatar.traverse((o) => {
        if (o.isMesh) o.geometry.dispose();
      });
      selected = button.dataset.character;
      chapter?.saveCharacter(selected);
      avatar = character(selected);
      player.add(avatar);
      document.querySelectorAll("[data-character]").forEach((b) => {
        b.classList.toggle("selected", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      toast(
        {
          astronaut: "A small astronaut. Very big plans.",
          alien: "Officially the friendliest alien in this solar system.",
          robot: "Beep boop. Mischief mode activated.",
        }[selected],
      );
      button.blur();
    }),
);
const adventure = createAdventureWorld({ THREE, scene, box, ball, cyl, ring, label, character, C, mat });
let activeRegion = 'port';
const chapter = createChapter({
  position: () => player.position, heading: () => avatar.rotation.y,
  resetInput, toast, mat, changeCharacter,
  setRegion: region => {
    activeRegion = region;
    portStatic.visible = region === 'port';
    for (const b of bubbles) scene.remove(b.root);
    bubbles.length = 0;
    document.querySelector('#region-name').textContent = region === 'port' ? 'PEBBLE PORT' : 'CRATER RELAY';
  },
}, adventure);
changeCharacter(chapter.initial.character);
const bubbles = [];
const bubbleGeo = new THREE.SphereGeometry(1, 20, 14);
const bubbleMat = new THREE.MeshPhysicalMaterial({
  color: "#b8f1e6",
  transparent: true,
  opacity: 0.33,
  roughness: 0.1,
  metalness: 0.1,
  clearcoat: 1,
  side: THREE.DoubleSide,
  depthWrite: false,
});
let robotFloat = 0;
function blowBubble() {
  if (dialog.open || performance.now() - lastBubble < 250) return;
  lastBubble = performance.now();
  chapter.bubble();
  for (let i = 0; i < 3; i++) {
    const root = new THREE.Group();
    const sphere = new THREE.Mesh(bubbleGeo, bubbleMat);
    root.add(sphere);
    const shine = new THREE.Mesh(bubbleGeo, mat("#f0fff3"));
    shine.scale.set(0.17, 0.065, 0.05);
    shine.position.set(-0.23, 0.39, 0.81);
    root.add(shine);
    root.position
      .copy(player.position)
      .add(new THREE.Vector3((i - 1) * 0.45, 1.3, 0));
    const size = 0.32 + i * 0.12;
    root.scale.setScalar(size);
    scene.add(root);
    const direction = new THREE.Vector3(
      Math.sin(avatar.rotation.y),
      0,
      Math.cos(avatar.rotation.y),
    );
    direction.multiplyScalar(1.8).add(new THREE.Vector3((i - 1) * 0.3, 1, 0));
    bubbles.push({ root, velocity: direction, age: 0 });
  }
  if (activeRegion === 'port' && player.position.distanceTo(new THREE.Vector3(2.4, 0.24, -0.3)) < 3.5) {
    robotFloat = 3;
  }
}
$("#bubble").onpointerdown = (event) => {
  event.preventDefault();
  blowBubble();
};
$("#bubble").onclick = (event) => {
  if (event.detail === 0) blowBubble(); // Keyboard and assistive activation.
};
let width = 0,
  height = 0;
function resize() {
  width = world.clientWidth;
  height = world.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(width, height);
  const aspect = width / height;
  const view = aspect < 1 ? 27 : 23;
  camera.left = (-view * aspect) / 2;
  camera.right = (view * aspect) / 2;
  camera.top = view / 2;
  camera.bottom = -view / 2;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
const clock = new THREE.Clock();
let elapsed = 0;
const direction = new THREE.Vector3(),
  forward = new THREE.Vector3(-cameraOffset.x, 0, -cameraOffset.z).normalize(),
  right = new THREE.Vector3(-forward.z, 0, forward.x);
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  if (!dialog.open) {
    let x =
      joy.x +
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    let y =
      -joy.y +
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    direction.copy(right).multiplyScalar(x).addScaledVector(forward, y);
    if (direction.length() > 1) direction.normalize();
    const step = direction.clone().multiplyScalar((chapter.riding() ? 7 : 4) * dt);
    const blocked = (x,z) => Math.hypot(x,z) > (activeRegion === 'port' ? 10.6 : 9) || chapter.blocked(x,z) ||
      (activeRegion === 'port' && (obstacles.some(o => Math.hypot(x-o.x,z-o.z)<o.r+.3) || Math.hypot(x,z+.2)<2));
    // Slide along collision boundaries rather than trapping diagonal movement.
    if (!blocked(player.position.x+step.x,player.position.z)) player.position.x+=step.x;
    if (!blocked(player.position.x,player.position.z+step.z)) player.position.z+=step.z;
    if (direction.lengthSq() > 0.01) {
      const target = Math.atan2(direction.x, direction.z);
      avatar.rotation.y +=
        Math.atan2(
          Math.sin(target - avatar.rotation.y),
          Math.cos(target - avatar.rotation.y),
        ) * Math.min(dt * 14, 1);
    }
    avatar.position.y =
      direction.lengthSq() > 0.01
        ? Math.abs(Math.sin(elapsed * 11)) * 0.08
        : Math.sin(elapsed * 2) * 0.02;
    avatar.userData.limbs.forEach(
      (limb, i) =>
        (limb.rotation.x =
          direction.lengthSq() > 0.01
            ? Math.sin(
                elapsed * 11 + (i % 2) * Math.PI + (i > 1 ? Math.PI : 0),
              ) * 0.45
            : 0),
    );
    robotFloat = Math.max(0, robotFloat - dt);
    pip.position.y =
      0.24 +
      (robotFloat > 0
        ? Math.sin((Math.min(1, robotFloat) * Math.PI) / 2) * 1.7
        : Math.sin(elapsed * 2) * 0.04);
    pip.rotation.z = robotFloat > 0 ? Math.sin(elapsed * 5) * 0.16 : 0;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.age += dt;
      b.root.position.addScaledVector(b.velocity, dt);
      b.root.position.x += Math.sin(elapsed * 3 + i) * dt * 0.15;
      if (b.age > 3.5) {
        scene.remove(b.root);
        bubbles.splice(i, 1);
      }
    }
  }
  chapter.update(dialog.open ? 0 : dt, elapsed);
  avatar.visible = !chapter.riding();
  // Keep the neighborhood composed; a small camera drift follows exploration.
  cameraTarget.lerp(
    new THREE.Vector3(
      player.position.x * 0.18,
      1,
      player.position.z * 0.12 - 1,
    ),
    Math.min(dt * 3, 1),
  );
  camera.position.copy(cameraTarget).add(cameraOffset);
  camera.lookAt(cameraTarget);
  speech.quaternion.copy(camera.quaternion);
  renderer.render(scene, camera);
}
animate();
// Read-only evidence hooks only enabled for local verification.
if (new URLSearchParams(location.search).has("debug"))
  window.__orbit = () => ({
    character: selected,
    position: player.position.toArray(),
    bubbles: bubbles.length,
    robotFloat,
    night,
    dialog: dialog.open,
    joy: { ...joy },
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    pixelRatio: renderer.getPixelRatio(),
    chapter: chapter.debug(),
    portVisible: portStatic.visible,
    relayVisible: adventure.relay.visible,
  });
