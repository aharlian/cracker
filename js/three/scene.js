import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { nebulaVertex, nebulaFragment, beamVertex, beamFragment, chromaticAberrationShader } from './shaders.js';
import { clamp, lerp, reducedMotion } from '../utils/dom.js';

function capabilityProfile() {
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const reduce = reducedMotion();
  const low = reduce || cores <= 4 || memory <= 4;
  return {
    mobile,
    low,
    pixelRatio: Math.min(window.devicePixelRatio || 1, low ? 1.25 : mobile ? 1.5 : 1.8),
    stars: low ? 1600 : mobile ? 2600 : 4300,
    dust: low ? 450 : 950,
    post: !reduce,
    depthOfField: !mobile && !low,
  };
}

function canvasTexture(draw, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  draw(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeStoneTexture() {
  return canvasTexture((ctx, size) => {
    const image = ctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = 22 + Math.random() * 28;
      image.data[i] = n * 1.08;
      image.data[i + 1] = n;
      image.data[i + 2] = n * .86;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    ctx.globalAlpha = .12;
    for (let i = 0; i < 40; i += 1) {
      ctx.strokeStyle = i % 3 ? '#947451' : '#171717';
      ctx.lineWidth = Math.random() * 1.8 + .3;
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.lineTo(Math.random() * size, Math.random() * size);
      ctx.stroke();
    }
  }, 384);
}

function makeEyeTexture() {
  return canvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = 'rgba(202,157,81,.95)';
    ctx.fillStyle = 'rgba(202,157,81,.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-150, 0);
    ctx.quadraticCurveTo(0, -105, 150, 0);
    ctx.quadraticCurveTo(0, 105, -150, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .32;
    ctx.beginPath();
    ctx.moveTo(0, -185);
    ctx.lineTo(-205, 165);
    ctx.lineTo(205, 165);
    ctx.closePath();
    ctx.stroke();
  });
}

function makeGlowTexture() {
  return canvasTexture((ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(225,189,118,.9)');
    gradient.addColorStop(.12, 'rgba(198,147,70,.46)');
    gradient.addColorStop(.42, 'rgba(105,82,53,.12)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }, 256);
}

function createStarField(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const radius = THREE.MathUtils.randFloat(18, 72);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi) * .65;
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 18;
    const warm = Math.random() > .76;
    colors[index * 3] = warm ? .95 : .58;
    colors[index * 3 + 1] = warm ? .76 : .72;
    colors[index * 3 + 2] = warm ? .48 : .9;
    sizes[index] = THREE.MathUtils.randFloat(.4, 1.7);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({
    size: .065,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: .82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function createDust(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(22);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(-5, 8);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(-12, 5);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc5a56d,
    size: .025,
    transparent: true,
    opacity: .36,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function createFallbackShip() {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x202326, metalness: .9, roughness: .2 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8c602f, metalness: .95, roughness: .22 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), dark);
  hull.scale.set(2.8, .58, 1.15);
  group.add(hull);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, 5.3), dark);
  wing.position.set(-.3, -.08, 0);
  group.add(wing);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.72, .12, 20, 64), bronze);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(-.15, -.62, 0);
  group.add(ring);
  return group;
}

export function createCinematicScene(container) {
  const profile = capabilityProfile();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070809, .032);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, .1, 180);
  camera.position.set(0, .8, 10.8);

  const renderer = new THREE.WebGLRenderer({ antialias: !profile.low, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(profile.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .78;
  renderer.shadowMap.enabled = !profile.low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();

  const world = new THREE.Group();
  scene.add(world);

  const nebulaUniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0x15191f) },
    uColorB: { value: new THREE.Color(0x5f4122) },
  };
  const nebula = new THREE.Mesh(
    new THREE.SphereGeometry(76, profile.low ? 32 : 56, profile.low ? 20 : 34),
    new THREE.ShaderMaterial({
      vertexShader: nebulaVertex,
      fragmentShader: nebulaFragment,
      uniforms: nebulaUniforms,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  world.add(nebula);

  const stars = createStarField(profile.stars);
  world.add(stars);
  const dust = createDust(profile.dust);
  world.add(dust);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x070707, roughness: .78, metalness: .12, transparent: true, opacity: .86 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.55;
  ground.receiveShadow = true;
  world.add(ground);

  const pyramid = new THREE.Mesh(
    new THREE.ConeGeometry(3.65, 4.5, 4, 1),
    new THREE.MeshStandardMaterial({ map: makeStoneTexture(), color: 0x4c4439, roughness: .86, metalness: .04, bumpScale: .25 }),
  );
  pyramid.position.set(2.6, -1.35, -4.8);
  pyramid.rotation.y = Math.PI * .25;
  pyramid.castShadow = true;
  pyramid.receiveShadow = true;
  world.add(pyramid);

  const eye = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeEyeTexture(), color: 0xcaa05f, transparent: true, opacity: .17, depthWrite: false }));
  eye.scale.set(2.2, 2.2, 1);
  eye.position.set(2.25, -.95, -1.65);
  world.add(eye);

  const shipPivot = new THREE.Group();
  shipPivot.position.set(-2.2, .8, -1.2);
  shipPivot.rotation.set(.05, -.16, -.035);
  world.add(shipPivot);

  const beamUniforms = { uTime: { value: 0 } };
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.42, 5.5, 48, 1, true),
    new THREE.ShaderMaterial({
      vertexShader: beamVertex,
      fragmentShader: beamFragment,
      uniforms: beamUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.set(-2.2, -2.12, -1.2);
  beam.rotation.z = Math.PI;
  beam.scale.set(.78, 1, .78);
  world.add(beam);

  const beamGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
  beamGlow.scale.set(4.5, 4.5, 1);
  beamGlow.position.set(-2.2, -3.28, -1.2);
  beamGlow.rotation.x = -Math.PI / 2;
  world.add(beamGlow);

  const ambient = new THREE.HemisphereLight(0x607486, 0x171007, .55);
  scene.add(ambient);
  const moon = new THREE.DirectionalLight(0x8da7c0, 1.9);
  moon.position.set(-8, 10, 4);
  moon.castShadow = !profile.low;
  moon.shadow.mapSize.set(profile.low ? 512 : 1024, profile.low ? 512 : 1024);
  scene.add(moon);
  const bronzeLight = new THREE.SpotLight(0xd6a45d, 75, 34, .5, .8, 1.4);
  bronzeLight.position.set(7, 8, 5);
  bronzeLight.target = pyramid;
  bronzeLight.castShadow = !profile.low;
  scene.add(bronzeLight);
  const underLight = new THREE.PointLight(0x74b9e0, 16, 12, 1.6);
  underLight.position.set(-2.2, -.4, -1.2);
  scene.add(underLight);

  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xd5a568, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
  flare.position.set(7, 7, -11);
  flare.scale.set(7, 7, 1);
  scene.add(flare);

  let composer = null;
  let chromaticPass = null;
  if (profile.post) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), profile.low ? .28 : .48, .58, .78);
    composer.addPass(bloom);
    if (profile.depthOfField) {
      const bokeh = new BokehPass(scene, camera, { focus: 11.5, aperture: .000055, maxblur: .005, width: window.innerWidth, height: window.innerHeight });
      composer.addPass(bokeh);
    }
    chromaticPass = new ShaderPass(chromaticAberrationShader);
    composer.addPass(chromaticPass);
    composer.addPass(new OutputPass());
  }

  const loader = new GLTFLoader();
  let ship;
  const ready = new Promise((resolve) => {
    loader.load(
      './assets/models/ufo-magic-ark.glb',
      (gltf) => {
        ship = gltf.scene;
        ship.scale.setScalar(.6);
        ship.rotation.y = Math.PI;
        ship.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = !profile.low;
          node.receiveShadow = true;
          if (node.material) {
            node.material.envMapIntensity = 1.35;
            if (/engine_core/i.test(node.name)) {
              node.material.emissive = new THREE.Color(0x65bde6);
              node.material.emissiveIntensity = 5;
            }
          }
        });
        shipPivot.add(ship);
        resolve(true);
      },
      undefined,
      () => {
        ship = createFallbackShip();
        ship.scale.setScalar(.62);
        ship.rotation.y = Math.PI;
        shipPivot.add(ship);
        resolve(false);
      },
    );
  });

  const mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  const onPointerMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth - .5) * 2;
    mouse.y = (event.clientY / window.innerHeight - .5) * 2;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const clock = new THREE.Clock();
  let visible = true;
  let frame;
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .01 });
  observer.observe(container);

  function render() {
    frame = requestAnimationFrame(render);
    if (!visible || document.hidden) return;
    const time = clock.getElapsedTime();
    const scroll = clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1.6);
    mouse.smoothX = lerp(mouse.smoothX, mouse.x, .035);
    mouse.smoothY = lerp(mouse.smoothY, mouse.y, .035);

    nebulaUniforms.uTime.value = time;
    beamUniforms.uTime.value = time;
    stars.rotation.y = time * .0025;
    stars.rotation.x = Math.sin(time * .05) * .015;
    dust.rotation.y = time * .009;
    const dustPositions = dust.geometry.attributes.position.array;
    for (let i = 1; i < dustPositions.length; i += 3) {
      dustPositions[i] += .0016 + (i % 9) * .00002;
      if (dustPositions[i] > 8) dustPositions[i] = -5;
    }
    dust.geometry.attributes.position.needsUpdate = true;

    shipPivot.position.y = .8 + Math.sin(time * .42) * .13 - scroll * .38;
    shipPivot.rotation.z = -.035 + Math.sin(time * .3) * .018;
    shipPivot.rotation.y = -.16 + mouse.smoothX * .1;
    beam.position.y = shipPivot.position.y - 2.92;
    underLight.position.y = shipPivot.position.y - 1.22;
    beam.material.opacity = .82 + Math.sin(time * 1.2) * .08;
    eye.material.opacity = .12 + Math.max(0, Math.sin(time * .34)) * .06;

    camera.position.x = mouse.smoothX * .44 + scroll * .45;
    camera.position.y = .8 - mouse.smoothY * .28 - scroll * .35;
    camera.position.z = 10.8 + scroll * 1.1;
    camera.lookAt(.25 - scroll * .4, -.25, -2.4);
    world.rotation.y = mouse.smoothX * .018;
    world.position.x = mouse.smoothX * -.13;
    if (chromaticPass) chromaticPass.uniforms.angle.value = time * .05;

    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  render();

  const onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.pixelRatio));
    composer?.setSize(width, height);
  };
  window.addEventListener('resize', onResize, { passive: true });

  gsap.to(flare.material, { opacity: .34, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  return {
    ready,
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      composer?.dispose?.();
      container.innerHTML = '';
    },
  };
}
