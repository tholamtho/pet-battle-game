/**
 * Model viewer for artists: open /viewer.html while `npm run dev` is running.
 * Shows which clip each animation state resolves to, plays every state/skill, and accepts
 * a dropped .glb (+ config.json) so you can test before putting files in public/pets/.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Renderer } from '@/render/Renderer.js';
import { AssetLoader } from '@/render/AssetLoader.js';
import { Effects } from '@/render/fx.js';
import { buildModelFromGltf, createPetModel } from '@/render/PetFactory.js';
import { DEFAULT_CONFIG, SLOTS, STATES } from '@/render/animation/config.js';
import { createEquipmentObject } from '@/render/EquipmentFactory.js';
import { getSkill, listItems, listSpecies } from '@/data/index.js';
import { Loop } from '@/core/Loop.js';
import { h } from '@/utils/dom.js';

const renderer = new Renderer(document.getElementById('stage'));
const assets = new AssetLoader();
const fx = new Effects(renderer.scene);
const { scene, camera } = renderer;
scene.background = new THREE.Color(0x141a2b);
scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x2a2438, 1));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(4, 8, 5);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshStandardMaterial({ color: 0x252e48 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const controls = new OrbitControls(camera, renderer.gl.domElement);
controls.target.set(0, 1, 0);

const panel = document.getElementById('panel');
const species = listSpecies();
let current = species[0];
let model = null;
let dropped = { glbUrl: null, config: null };

async function load() {
  model?.dispose();
  if (dropped.glbUrl) {
    const gltf = await assets.loadGLTF(dropped.glbUrl);
    model = buildModelFromGltf(gltf, { ...DEFAULT_CONFIG, ...(dropped.config || {}) });
  } else {
    model = await createPetModel(current, assets);
  }
  model.setHome(0, 0, 0);
  scene.add(model.root);
  render();
}

const impact = (skill) => () => fx.burst(new THREE.Vector3(1.5, 1.1, 0), skill.element, skill.anim === 'special');
const run = (fn) => async () => {
  await fn();
};

function render() {
  const info = model.describe();
  const skills = current.skills.map((s) => getSkill(s.skillId));
  panel.replaceChildren(
    h('h1', {}, 'Pet model viewer'),
    h('select', { onChange: (e) => ((current = species.find((s) => s.id === e.target.value)), (dropped = { glbUrl: null, config: null }), load()) },
      species.map((s) => h('option', { value: s.id, selected: s.id === current.id }, `${s.name} (${s.id})`))),
    h('p', { class: 'hint' }, `Loads public/pets/${current.id}/config.json. Or drop a .glb (+ config.json) on the page.`),
    h('h2', {}, 'States'),
    ...STATES.map((s) => h('button', { onClick: run(() => play(s)) }, s)),
    h('button', { onClick: () => load() }, 'reset'),
    h('h2', {}, 'Skills (uses the skill\'s anim + per-skill overrides)'),
    ...skills.map((k) => h('button', { onClick: run(() => model.perform(k, { direction: 1, onImpact: impact(k) })) }, `${k.name} · ${k.anim}`)),
    h('h2', {}, 'Equipment (placeholder, or public/items/<id>/ if present)'),
    ...listItems().filter((i) => i.type === 'equipment').map((i) => h('button', { onClick: run(async () => { const { object, config } = await createEquipmentObject(i, assets); model.equip(i.slot, object, config); }) }, `${i.name} · ${i.slot}`)),
    h('button', { onClick: () => SLOTS.forEach((s) => model.unequip(s)) }, 'remove all'),
    h('h2', {}, 'Resolved clips'),
    h('table', {}, STATES.map((s) => h('tr', {}, h('td', {}, s), h('td', { class: info.states[s] ? 'ok' : 'no' }, info.states[s] ?? 'none, procedural fallback')))),
    h('h2', {}, `Clips in file (${info.clips.length})`),
    h('p', { class: 'hint' }, info.clips.join(', ') || 'no animations'),
  );
}

async function play(state) {
  if (state === 'hit') return model.react();
  if (state === 'faint') return model.faint();
  if (state === 'idle') return load();
  const skill = { id: `viewer_${state}`, anim: state, element: current.elements[0] };
  return model.perform(skill, { direction: 1, onImpact: impact(skill) });
}

// ---- drag & drop ----
const drop = document.getElementById('drop');
addEventListener('dragover', (e) => (e.preventDefault(), (drop.style.display = 'grid')));
addEventListener('dragleave', (e) => e.relatedTarget === null && (drop.style.display = 'none'));
addEventListener('drop', async (e) => {
  e.preventDefault();
  drop.style.display = 'none';
  for (const file of e.dataTransfer.files) {
    if (/\.(glb|gltf)$/i.test(file.name)) dropped.glbUrl = URL.createObjectURL(file);
    else if (/\.json$/i.test(file.name)) dropped.config = JSON.parse(await file.text());
  }
  if (dropped.glbUrl) await load();
});

new Loop((dt) => {
  model?.update(dt);
  fx.update(dt);
  controls.update();
  renderer.render();
}).start();
load();
