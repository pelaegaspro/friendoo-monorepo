import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const story = document.querySelector('[data-call-story]');

if (story) {
  const canvas = story.querySelector('canvas');
  const stageLabel = story.querySelector('[data-call-stage]');
  const storyCopy = story.querySelector('.call-story-copy');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (value, start, end) => clamp((value - start) / (end - start), 0, 1);
  const ease = (value) => value * value * (3 - 2 * value);

  const stages = [
    '01 · A caller starts an in-app audio call',
    '02 · An online host receives the ringing call',
    '03 · The host accepts — the conversation begins',
  ];
  let currentStage = -1;

  function updateStage(progress) {
    const nextStage = progress < 0.35 ? 0 : progress < 0.7 ? 1 : 2;
    if (nextStage !== currentStage && stageLabel) {
      currentStage = nextStage;
      stageLabel.textContent = stages[nextStage];
    }
  }

  function createPerson({ skin, outfit, hair, male = false }) {
    const person = new THREE.Group();
    const material = (color, roughness = 0.55, metalness = 0.04) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const skinMaterial = material(skin, 0.68);
    const outfitMaterial = material(outfit, 0.42);
    const hairMaterial = material(hair, 0.82);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.58, 8, 16), outfitMaterial);
    torso.position.y = 0.15;
    person.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.18, 16), skinMaterial);
    neck.position.y = 0.67;
    person.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 28, 22), skinMaterial);
    head.position.y = 0.96;
    person.add(head);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), skinMaterial);
    nose.scale.set(0.65, 0.8, 1.4);
    nose.position.set(0, 0.98, 0.28);
    person.add(nose);

    if (male) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMaterial);
      cap.position.y = 1.07;
      person.add(cap);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.085, 0.09), hairMaterial);
      fringe.position.set(0.03, 1.13, 0.22);
      fringe.rotation.z = -0.14;
      person.add(fringe);
    } else {
      const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.33, 28, 22), hairMaterial);
      backHair.scale.set(1.03, 1.18, 0.88);
      backHair.position.set(0, 0.97, -0.04);
      person.add(backHair);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.276, 28, 22), skinMaterial);
      face.position.set(0, 0.96, 0.075);
      person.add(face);
      const sideHair = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.45, 6, 12), hairMaterial);
      sideHair.position.set(-0.25, 0.74, 0.03);
      sideHair.rotation.z = 0.1;
      person.add(sideHair);
    }

    const shoulder = new THREE.Group();
    shoulder.position.set(0.29, 0.46, 0.02);
    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.38, 6, 12), outfitMaterial);
    upperArm.position.y = -0.18;
    upperArm.rotation.z = -0.28;
    shoulder.add(upperArm);
    person.add(shoulder);

    const phonePivot = new THREE.Group();
    phonePivot.position.set(0.43, 0.45, 0.08);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), skinMaterial);
    hand.position.set(0.1, -0.29, 0.05);
    phonePivot.add(hand);

    const phone = new THREE.Group();
    phone.position.set(0.12, -0.42, 0.08);
    const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.39, 0.055), new THREE.MeshStandardMaterial({ color: 0x111526, roughness: 0.26, metalness: 0.64 }));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.185, 0.305), new THREE.MeshBasicMaterial({ color: 0x8b7dff, transparent: true, opacity: 0.94 }));
    screen.position.z = 0.031;
    phone.add(phoneBody, screen);
    phonePivot.add(phone);
    person.add(phonePivot);

    return { person, phonePivot, phone, screen };
  }

  function init() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(maxPixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060810, 0.115);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.18, 9.0);
    camera.lookAt(0, 0, 0);

    const root = new THREE.Group();
    root.rotation.x = -0.08;
    scene.add(root);

    const ambient = new THREE.HemisphereLight(0xa89eff, 0x101328, 1.8);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.7);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const pink = new THREE.PointLight(0xff7ab6, 12, 8, 2);
    pink.position.set(2.8, 1.6, 2.8);
    scene.add(pink);
    const teal = new THREE.PointLight(0x18c6b8, 8, 7, 2);
    teal.position.set(-3.2, 0.5, 2.4);
    scene.add(teal);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 64),
      new THREE.MeshStandardMaterial({ color: 0x11142a, roughness: 0.34, metalness: 0.22, transparent: true, opacity: 0.74 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.03;
    root.add(floor);

    const caller = createPerson({ skin: 0x8f6048, outfit: 0x416ff5, hair: 0x171521, male: true });
    caller.person.position.set(0.7, -0.32, 0);
    caller.person.rotation.y = -0.32;
    caller.phonePivot.rotation.set(-0.2, 0.02, 0.16);
    root.add(caller.person);

    const host = createPerson({ skin: 0xb7755d, outfit: 0xff6fa7, hair: 0x26151c });
    host.person.position.set(3.7, -0.62, -0.08);
    host.person.rotation.y = -0.42;
    host.person.scale.setScalar(0.72);
    host.phonePivot.rotation.set(0.72, -0.08, -0.7);
    root.add(host.person);

    const connection = new THREE.Group();
    const arcCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.1, 0.9, 0),
      new THREE.Vector3(0, 2.45, -0.25),
      new THREE.Vector3(1.1, 0.9, 0),
    );
    const arc = new THREE.Mesh(
      new THREE.TubeGeometry(arcCurve, 72, 0.016, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x9e8dff, transparent: true, opacity: 0 }),
    );
    connection.add(arc);
    const signalGeometry = new THREE.TorusGeometry(0.28, 0.022, 8, 32);
    const callerSignal = new THREE.Mesh(signalGeometry, new THREE.MeshBasicMaterial({ color: 0x18c6b8, transparent: true, opacity: 0 }));
    callerSignal.position.set(-1.05, 0.63, 0.08);
    callerSignal.rotation.x = Math.PI / 2;
    const hostSignal = new THREE.Mesh(signalGeometry, new THREE.MeshBasicMaterial({ color: 0xff7ab6, transparent: true, opacity: 0 }));
    hostSignal.position.set(1.1, 0.63, 0.08);
    hostSignal.rotation.x = Math.PI / 2;
    connection.add(callerSignal, hostSignal);
    root.add(connection);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 280;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 5 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1.8;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xc7c0ff, size: 0.024, transparent: true, opacity: 0.62, sizeAttenuation: true }));
    root.add(stars);

    const resize = () => {
      const { width, height } = story.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    let progress = 0;
    let targetProgress = 0;
    const updateProgress = () => {
      const rect = story.getBoundingClientRect();
      const travel = Math.max(story.offsetHeight - window.innerHeight, 1);
      targetProgress = clamp(-rect.top / travel, 0, 1);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    const clock = new THREE.Clock();
    const render = () => {
      const elapsed = clock.getElapsedTime();
      progress += (targetProgress - progress) * 0.085;
      const hostIn = ease(smooth(progress, 0.14, 0.58));
      const accepts = ease(smooth(progress, 0.48, 0.82));
      const connected = ease(smooth(progress, 0.64, 0.9));
      const pulse = 1 + Math.sin(elapsed * 5.2) * 0.08;

      caller.person.position.x = lerp(0.7, -0.9, hostIn);
      caller.person.position.y = -0.32 + Math.sin(elapsed * 1.7) * 0.012;
      caller.person.rotation.y = lerp(-0.32, 0.14, connected);
      caller.phonePivot.rotation.x = lerp(-0.2, 0.08, connected);
      caller.screen.material.color.setHex(connected > 0.45 ? 0x18c6b8 : 0x8b7dff);

      host.person.position.x = lerp(3.7, 1.05, hostIn);
      host.person.position.y = lerp(-0.7, -0.32, hostIn) + Math.sin(elapsed * 1.9 + 1.6) * 0.011;
      host.person.scale.setScalar(lerp(0.48, 1, hostIn));
      host.person.rotation.y = lerp(-0.62, -0.14, hostIn);
      host.phonePivot.rotation.x = lerp(0.82, -0.12, accepts);
      host.phonePivot.rotation.z = lerp(-0.7, -0.05, accepts);
      host.screen.material.color.setHex(connected > 0.45 ? 0x18c6b8 : 0xff7ab6);

      arc.material.opacity = 0.12 + connected * 0.86;
      arc.scale.y = 0.84 + connected * 0.2;
      callerSignal.material.opacity = (1 - accepts) * 0.8;
      callerSignal.scale.setScalar(pulse * (1.15 - accepts * 0.4));
      hostSignal.material.opacity = hostIn * (1 - connected * 0.22) * 0.92;
      hostSignal.scale.setScalar(pulse * (1.2 - connected * 0.35));
      stars.rotation.y = elapsed * 0.035;
      root.rotation.y = Math.sin(elapsed * 0.2) * 0.045 + lerp(-0.08, 0.08, progress);
      camera.position.y = lerp(0.18, 0.3, progress);
      camera.position.z = lerp(9.0, 7.7, progress);
      camera.lookAt(0, 0, 0);
      if (storyCopy) storyCopy.style.opacity = String(1 - ease(smooth(progress, 0.14, 0.45)) * 0.88);

      updateStage(progress);
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();
  }

  if (prefersReducedMotion.matches || !window.WebGLRenderingContext) {
    story.classList.add('story-static');
    updateStage(1);
  } else {
    try {
      init();
    } catch (error) {
      console.warn('3D call story could not start.', error);
      story.classList.add('story-static');
      updateStage(1);
    }
  }
}
