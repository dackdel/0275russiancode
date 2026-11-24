// Generative lotus, drawn as meshes.
// A blade is a vein: a chain of points, each with a side normal and a half-width.
// Petals and leaves are that same blade. The stem is a thick polyline.
// Petal color runs from an inner hue to a rim hue.
// The shape function takes the blossom stage, which is the fraction of the hour.
// The anatomy is a lotus first. The hour seed only turns it, shifts the pink,
// and bends the stem.

import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from "./vendor/three.module.js";

const U = 22;
const V = 10;
const OUTER_COUNT = 14;
const INNER_COUNT = 8;
const SEPAL_COUNT = 5;

const _color = new Color();
const _tangent = new Vector3();
const _normal = new Vector3();
const _binormal = new Vector3();
const _side = new Vector3();

export function bloomFraction(date) {
  const into = date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000;
  return into / 3600;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Shortest turn on the color wheel, so cream (near 30°) meets rose (near 350°)
// without walking the long way through green and blue.
function lerpHue(a, b, t) {
  const delta = ((b - a + 540) % 360) - 180;
  return a + delta * t;
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hsvRgb(h, s, v) {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) { r = c; g = x; }
  else if (hh < 120) { r = x; g = c; }
  else if (hh < 180) { g = c; b = x; }
  else if (hh < 240) { g = x; b = c; }
  else if (hh < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [r + m, g + m, b + m];
}

function writeHsv(target, offset, h, s, v) {
  const rgb = hsvRgb(h, s, v);
  _color.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);
  target[offset] = _color.r;
  target[offset + 1] = _color.g;
  target[offset + 2] = _color.b;
}

// How far this petal has opened. Outer petals follow the hour.
// Sepals peel away early. The inner whorl lags, so the center stays cupped.
export function openness(stage, role) {
  if (role === "leaf") return 1;
  if (role === "sepal") return smoothstep(0, 0.42, stage);
  if (role === "inner") return smoothstep(0.3, 1, stage);
  return clamp(stage, 0, 1);
}

// Bend along a blade. `open` is that petal's openness, itself driven by the
// hour. The whole blade swings out together; the tip curls a little more.
export function flowerOpenCurve(along, open) {
  return open * (0.86 + 0.14 * along * along);
}

function widthMask(role, u) {
  if (role === "leaf") {
    return Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.72);
  }
  // Broad through the middle, a soft point at the tip, a little width at the base.
  const body = Math.pow(Math.sin(Math.PI * u), 0.72);
  const shoulder = (1 - u) * 0.22;
  return body + shoulder;
}

export function createLotus(hour) {
  const h = ((hour % 24) + 24) % 24;
  const seed = h + 1;
  const rand = mulberry32(seed * 10007);
  const spin = rand() * Math.PI * 2;
  const hue = 346 + (rand() - 0.5) * 12;
  return {
    species: "lotus",
    seed: seed,
    hour: h,
    hue: hue,
    spin: spin,
    bend: 0.22 + rand() * 0.28,
    bendZ: (rand() - 0.5) * 0.22,
    outerCount: OUTER_COUNT,
    innerCount: INNER_COUNT
  };
}

function bladeSpecs(lotus) {
  const specs = [];
  const hue = lotus.hue;

  for (let i = 0; i < SEPAL_COUNT; i++) {
    specs.push({
      role: "sepal",
      azimuth: lotus.spin * 0.2 + (i / SEPAL_COUNT) * Math.PI * 2,
      len: 0.7,
      width: 0.32,
      closedElev: 0.16,
      openElev: 2.05,
      phase: i * 1.2,
      innerHue: [142, 0.42, 0.32],
      rimHue: [118, 0.36, 0.48]
    });
  }

  for (let i = 0; i < OUTER_COUNT; i++) {
    specs.push({
      role: "outer",
      azimuth: lotus.spin + (i / OUTER_COUNT) * Math.PI * 2,
      len: 1.08,
      width: 0.42,
      closedElev: 0.14,
      openElev: 1.62,
      phase: i * 0.7,
      innerHue: [32, 0.22, 0.99],
      rimHue: [hue, 0.55, 0.9]
    });
  }

  for (let i = 0; i < INNER_COUNT; i++) {
    specs.push({
      role: "inner",
      azimuth: lotus.spin + Math.PI / OUTER_COUNT + (i / INNER_COUNT) * Math.PI * 2,
      len: 0.52,
      width: 0.16,
      closedElev: 0.14,
      openElev: 0.78,
      phase: i * 0.9,
      innerHue: [36, 0.24, 0.99],
      rimHue: [hue + 4, 0.22, 0.96]
    });
  }

  return specs;
}

function leafSpecs(lotus) {
  return [
    {
      role: "leaf",
      azimuth: lotus.spin,
      stemT: 0.4,
      len: 0.7,
      width: 0.26,
      closedElev: 1.05,
      openElev: 1.32,
      phase: 0.4,
      innerHue: [150, 0.48, 0.32],
      rimHue: [118, 0.4, 0.52]
    },
    {
      role: "leaf",
      azimuth: lotus.spin + Math.PI * 0.85,
      stemT: 0.62,
      len: 0.58,
      width: 0.22,
      closedElev: 1.1,
      openElev: 1.36,
      phase: 1.6,
      innerHue: [152, 0.5, 0.3],
      rimHue: [124, 0.38, 0.5]
    }
  ];
}

function quadPoint(a, b, c, t) {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    y: u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    z: u * u * a.z + 2 * u * t * b.z + t * t * c.z
  };
}

function headAt(stage, seconds, reduce) {
  const sway = reduce ? 0 : Math.sin(seconds * 0.62) * 0.03;
  return {
    x: sway,
    y: 0.96 + stage * 0.34,
    z: sway * 0.18
  };
}

function stemPoint(t, head, lotus, sway) {
  const base = { x: 0.02, y: 0.03, z: 0.2 };
  const tip = { x: head.x, y: head.y, z: head.z };
  const ctrl = {
    x: lerp(base.x, tip.x, 0.42) + lotus.bend + sway,
    y: lerp(base.y, tip.y, 0.46),
    z: lerp(base.z, tip.z, 0.5) + lotus.bendZ
  };
  return quadPoint(base, ctrl, tip, t);
}

// Stations along a vein. Each one carries the point, the side normal,
// and the half-width used to build the blade.
function veinStations(spec, stage, origin, azimuth) {
  const open = openness(stage, spec.role);
  const stations = [];
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    const bend = spec.role === "leaf"
      ? lerp(0.72, 1, u * u)
      : flowerOpenCurve(u, open);
    const elev = lerp(spec.closedElev, spec.openElev, bend);
    const len = spec.len * (spec.role === "leaf" ? 1 : 0.9 + 0.1 * open);
    const half = spec.width * len * widthMask(spec.role, u);
    const radial = Math.sin(elev) * u * len;
    const y = Math.cos(elev) * u * len;
    const cup = spec.role === "leaf" ? 0.05 : (1 - open) * 0.2;
    stations.push({
      x: origin.x + Math.sin(azimuth) * radial,
      y: origin.y + y,
      z: origin.z + Math.cos(azimuth) * radial,
      sx: Math.cos(azimuth),
      sy: 0,
      sz: -Math.sin(azimuth),
      ix: -Math.sin(azimuth),
      iz: -Math.cos(azimuth),
      half: half,
      cup: cup,
      u: u
    });
  }
  return stations;
}

function makeBladeGeometry() {
  const geo = new BufferGeometry();
  const count = (U + 1) * (V + 1);
  geo.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute("color", new BufferAttribute(new Float32Array(count * 3), 3));
  const index = [];
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j;
      const b = a + 1;
      const c = a + (V + 1);
      const d = c + 1;
      index.push(a, b, c, b, d, c);
    }
  }
  geo.setIndex(index);
  return geo;
}

function paintBlade(geo, spec) {
  const colors = geo.attributes.color.array;
  let k = 0;
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    for (let j = 0; j <= V; j++) {
      const vv = j / V * 2 - 1;
      const rim = clamp(u * 0.92 + Math.abs(vv) * 0.18, 0, 1);
      const h = lerpHue(spec.innerHue[0], spec.rimHue[0], rim);
      const s = lerp(spec.innerHue[1], spec.rimHue[1], rim);
      const v = lerp(spec.innerHue[2], spec.rimHue[2], rim);
      writeHsv(colors, k, h, s, v);
      k += 3;
    }
  }
  geo.attributes.color.needsUpdate = true;
}

function poseBlade(geo, spec, stage, origin, azimuth) {
  const stations = veinStations(spec, stage, origin, azimuth);
  const pos = geo.attributes.position.array;
  let k = 0;
  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    for (let j = 0; j <= V; j++) {
      const vv = j / V * 2 - 1;
      const tuck = st.cup * st.half * vv * vv;
      pos[k] = st.x + st.sx * vv * st.half + st.ix * tuck;
      pos[k + 1] = st.y + st.sy * vv * st.half;
      pos[k + 2] = st.z + st.sz * vv * st.half + st.iz * tuck;
      k += 3;
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  const tip = stations[stations.length - 1];
  return Math.hypot(tip.x - origin.x, tip.z - origin.z);
}

function makeTube(rings, sides) {
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(rings * sides * 3), 3));
  const index = [];
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j;
      const b = i * sides + ((j + 1) % sides);
      const c = (i + 1) * sides + j;
      const d = (i + 1) * sides + ((j + 1) % sides);
      index.push(a, c, b, b, c, d);
    }
  }
  geo.setIndex(index);
  return geo;
}

function poseTube(geo, points, radiusAt) {
  const sides = 8;
  const pos = geo.attributes.position.array;
  _normal.set(1, 0, 0);
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    _tangent.set(next.x - prev.x, next.y - prev.y, next.z - prev.z);
    if (_tangent.lengthSq() < 1e-8) _tangent.set(0, 1, 0);
    _tangent.normalize();
    _normal.addScaledVector(_tangent, -_normal.dot(_tangent));
    if (_normal.lengthSq() < 1e-8) _normal.set(1, 0, 0);
    _normal.normalize();
    _binormal.crossVectors(_tangent, _normal).normalize();
    const radius = radiusAt(i / (points.length - 1));
    const p = points[i];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const c = Math.cos(a) * radius;
      const s = Math.sin(a) * radius;
      const k = (i * sides + j) * 3;
      pos[k] = p.x + _normal.x * c + _binormal.x * s;
      pos[k + 1] = p.y + _normal.y * c + _binormal.y * s;
      pos[k + 2] = p.z + _normal.z * c + _binormal.z * s;
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
}

function padTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const g = canvas.getContext("2d");
  const fill = g.createRadialGradient(256, 240, 16, 256, 256, 250);
  fill.addColorStop(0, "#3c9a72");
  fill.addColorStop(0.62, "#1e6e54");
  fill.addColorStop(1, "#145743");
  g.fillStyle = fill;
  g.beginPath();
  g.arc(256, 256, 248, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(214, 236, 220, 0.4)";
  g.lineWidth = 1.6;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    g.beginPath();
    g.moveTo(256, 256);
    g.lineTo(256 + Math.cos(a) * 236, 256 + Math.sin(a) * 236);
    g.stroke();
  }
  g.strokeStyle = "rgba(255, 255, 255, 0.22)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(256, 256, 244, 0, Math.PI * 2);
  g.stroke();
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function makeCenter(lotus) {
  const group = new Group();
  const gold = new MeshStandardMaterial({ color: 0xe0b23c, roughness: 0.42, metalness: 0.02 });
  const pitMat = new MeshStandardMaterial({ color: 0x6b4514, roughness: 0.7 });
  const cup = new Mesh(new SphereGeometry(0.16, 28, 18), gold);
  cup.scale.set(1, 0.48, 1);
  cup.position.y = 0.05;
  group.add(cup);

  const pits = 8;
  const pitGeo = new SphereGeometry(0.022, 10, 8);
  for (let i = 0; i < pits; i++) {
    const a = i * 2.399963 + lotus.spin;
    const r = 0.1 * Math.sqrt((i + 0.5) / pits);
    const pit = new Mesh(pitGeo, pitMat);
    pit.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
    group.add(pit);
  }

  const filament = new CylinderGeometry(0.008, 0.01, 0.2, 6);
  const anther = new SphereGeometry(0.02, 8, 8);
  const up = new Vector3(0, 1, 0);
  const dir = new Vector3();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + lotus.spin * 0.3;
    const base = new Vector3(Math.cos(a) * 0.1, 0.02, Math.sin(a) * 0.1);
    const tip = new Vector3(Math.cos(a) * 0.24, 0.16, Math.sin(a) * 0.24);
    dir.copy(tip).sub(base);
    const len = dir.length();
    const stem = new Mesh(filament, gold);
    stem.scale.y = len / 0.2;
    stem.position.copy(base).addScaledVector(dir, 0.5);
    stem.quaternion.setFromUnitVectors(up, dir.normalize());
    group.add(stem);
    const dot = new Mesh(anther, gold);
    dot.position.copy(tip);
    group.add(dot);
  }
  return group;
}

export function mountLotus(canvas) {
  const renderer = new WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new Scene();
  scene.background = new Color("#12363c");
  scene.fog = new Fog("#12363c", 7.5, 16);

  const camera = new PerspectiveCamera(30, 1, 0.05, 40);
  camera.position.set(0.72, 1.72, 4.55);

  scene.add(new AmbientLight(0xffffff, 0.55));
  scene.add(new HemisphereLight(0xe7f4ee, 0x1a3e42, 0.7));
  const key = new DirectionalLight(0xfff3e6, 2.1);
  key.position.set(-2.4, 4.8, 3.4);
  scene.add(key);
  const fill = new DirectionalLight(0xc5e4de, 1.15);
  fill.position.set(3.2, 1.4, -1.6);
  scene.add(fill);

  const water = new Mesh(
    new CircleGeometry(8, 48),
    new MeshStandardMaterial({ color: 0x12363c, roughness: 1 })
  );
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const pad = new Mesh(
    new CircleGeometry(1.42, 64),
    new MeshStandardMaterial({ map: padTexture(), roughness: 0.72, metalness: 0.02 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(-0.22, 0.02, 0.05);
  scene.add(pad);

  const stemMat = new MeshStandardMaterial({ color: 0x1c6a46, roughness: 0.68 });
  const stemGeo = makeTube(26, 8);
  const stem = new Mesh(stemGeo, stemMat);
  scene.add(stem);

  const collar = new Mesh(new SphereGeometry(0.075, 16, 12), stemMat);
  collar.scale.y = 0.7;
  scene.add(collar);

  // Fills the seams of the closed bud, then fades as the petals open.
  const core = new Mesh(
    new SphereGeometry(0.36, 32, 24),
    new MeshStandardMaterial({ color: 0xf3c1b4, roughness: 0.58 })
  );
  scene.add(core);

  const bladeMat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.56,
    metalness: 0,
    side: DoubleSide
  });

  const blades = [];
  let lotus = null;
  let center = null;

  function rebuild(hour) {
    for (let i = 0; i < blades.length; i++) {
      scene.remove(blades[i].mesh);
      blades[i].mesh.geometry.dispose();
    }
    blades.length = 0;
    if (center) {
      scene.remove(center);
      center = null;
    }

    lotus = createLotus(hour);
    const specs = bladeSpecs(lotus).concat(leafSpecs(lotus));
    for (let i = 0; i < specs.length; i++) {
      const geo = makeBladeGeometry();
      paintBlade(geo, specs[i]);
      const mesh = new Mesh(geo, bladeMat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      blades.push({ mesh: mesh, spec: specs[i] });
    }
    center = makeCenter(lotus);
    scene.add(center);
  }

  function render(date, seconds, reduce) {
    const stage = bloomFraction(date);
    const hour = date.getHours();
    if (!lotus || lotus.hour !== hour) rebuild(hour);

    const head = headAt(stage, seconds, reduce);
    const sway = reduce ? 0 : Math.sin(seconds * 0.62) * 0.04;
    const points = [];
    for (let i = 0; i < 26; i++) points.push(stemPoint(i / 25, head, lotus, sway));
    poseTube(stemGeo, points, function (t) {
      return 0.02 + 0.032 * Math.pow(1 - t, 0.65);
    });

    collar.position.set(head.x, head.y - 0.02, head.z);
    const coreAmt = 1 - smoothstep(0.04, 0.4, stage);
    core.visible = coreAmt > 0.04;
    core.position.set(head.x, head.y + 0.4, head.z);
    core.scale.set(1.05, 1.55, 1.05);

    let reach = 0;
    let reachN = 0;
    for (let i = 0; i < blades.length; i++) {
      const spec = blades[i].spec;
      const flutter = reduce ? 0 : Math.sin(seconds * 1.15 + spec.phase) * 0.012 * openness(stage, spec.role);
      const origin = spec.role === "leaf"
        ? points[Math.round(spec.stemT * (points.length - 1))]
        : head;
      const r = poseBlade(blades[i].mesh.geometry, spec, stage, origin, spec.azimuth + flutter);
      if (spec.role === "outer") {
        reach += r;
        reachN += 1;
      }
    }

    center.position.set(head.x, head.y, head.z);
    const shown = smoothstep(0.46, 0.84, stage);
    center.scale.setScalar(0.15 + 0.85 * shown);
    center.visible = shown > 0.02;

    camera.lookAt(0, 0.78, 0);
    renderer.render(scene, camera);

    return {
      species: "lotus",
      radius: reachN ? reach / reachN : 0,
      seed: lotus.seed,
      petals: OUTER_COUNT,
      inner: INNER_COUNT
    };
  }

  function resize(width, height) {
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
  }

  return { render: render, resize: resize };
}
