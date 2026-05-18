import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const MESSAGES = [
  "Welcome! I'll help you crush your goals. 🎯",
  "Set goals. Track progress. Achieve more.",
  "Your performance journey starts here.",
  "Let's build something great together! 🚀",
];

function buildRobot(scene: THREE.Scene) {
  const robot = new THREE.Group();

  const bodyMat   = new THREE.MeshPhongMaterial({ color: 0x0369a1, shininess: 90 });
  const darkMat   = new THREE.MeshPhongMaterial({ color: 0x0c4a6e, shininess: 60 });
  const lightMat  = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 120 });
  const eyeMat    = new THREE.MeshPhongMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.9, shininess: 200 });
  const mouthMat  = new THREE.MeshPhongMaterial({ color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 0.5 });
  const antMat    = new THREE.MeshPhongMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.5 });
  const jointMat  = new THREE.MeshPhongMaterial({ color: 0x082f49, shininess: 40 });

  // ── Torso ──────────────────────────────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.7), bodyMat);
  torso.position.y = 0;
  robot.add(torso);

  // Chest panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.05), darkMat);
  panel.position.set(0, 0.1, 0.38);
  robot.add(panel);

  // Chest lights (3 small dots)
  [-0.22, 0, 0.22].forEach((x, i) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshPhongMaterial({ color: [0xf87171, 0xfbbf24, 0x34d399][i], emissive: [0xf87171, 0xfbbf24, 0x34d399][i], emissiveIntensity: 0.6 }));
    dot.position.set(x, 0.1, 0.41);
    robot.add(dot);
  });

  // ── Head ───────────────────────────────────────────────────────────────
  const head = new THREE.Group();
  head.position.y = 1.05;
  robot.add(head);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.75), bodyMat);
  head.add(skull);

  // Visor strip
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.05), darkMat);
  visor.position.set(0, 0.08, 0.4);
  head.add(visor);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), eyeMat);
  eyeL.position.set(-0.22, 0.08, 0.42);
  head.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), eyeMat);
  eyeR.position.set(0.22, 0.08, 0.42);
  head.add(eyeR);

  // Eye blink lids (scale Y to 0 when blinking)
  const lidL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.06), darkMat);
  lidL.position.set(-0.22, 0.08, 0.44);
  head.add(lidL);
  const lidR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.06), darkMat);
  lidR.position.set(0.22, 0.08, 0.44);
  head.add(lidR);

  // Mouth — segmented bar
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), mouthMat);
    seg.position.set(-0.24 + i * 0.12, -0.2, 0.41);
    head.add(seg);
  }

  // Ear bolts
  [-0.5, 0.5].forEach((x) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), lightMat);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(x, 0.05, 0);
    head.add(bolt);
  });

  // Antenna
  const antBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), darkMat);
  antBase.position.set(0, 0.57, 0);
  head.add(antBase);
  const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), antMat);
  antBall.position.set(0, 0.78, 0);
  head.add(antBall);

  // Head top ridge
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), lightMat);
  ridge.position.set(0, 0.46, 0);
  head.add(ridge);

  // ── Neck ───────────────────────────────────────────────────────────────
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.22, 10), jointMat);
  neck.position.y = 0.67;
  robot.add(neck);

  // ── Arms ───────────────────────────────────────────────────────────────
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), jointMat);
    shoulder.position.set(side * 0.72, 0.42, 0);
    robot.add(shoulder);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 10), bodyMat);
    upperArm.position.set(side * 0.72, 0.1, 0);
    robot.add(upperArm);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), jointMat);
    elbow.position.set(side * 0.72, -0.18, 0);
    robot.add(elbow);

    const foreArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 10), lightMat);
    foreArm.position.set(side * 0.72, -0.44, 0);
    robot.add(foreArm);

    // Hand / claw
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), darkMat);
    hand.position.set(side * 0.72, -0.7, 0);
    robot.add(hand);
  });

  // ── Waist ──────────────────────────────────────────────────────────────
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.2, 12), darkMat);
  waist.position.y = -0.72;
  robot.add(waist);

  // ── Legs ───────────────────────────────────────────────────────────────
  [-1, 1].forEach((side) => {
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), jointMat);
    hip.position.set(side * 0.3, -0.9, 0);
    robot.add(hip);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.55, 10), bodyMat);
    thigh.position.set(side * 0.3, -1.2, 0);
    robot.add(thigh);

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), jointMat);
    knee.position.set(side * 0.3, -1.5, 0);
    robot.add(knee);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.5, 10), lightMat);
    shin.position.set(side * 0.3, -1.78, 0);
    robot.add(shin);

    // Foot
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.42), darkMat);
    foot.position.set(side * 0.3, -2.08, 0.06);
    robot.add(foot);
  });

  scene.add(robot);

  return { robot, head, eyeL, eyeR, lidL, lidR, antBall };
}

export default function Robot3D({ page }: { page: 'login' | 'signup' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  // Typewriter effect
  useEffect(() => {
    const full = MESSAGES[msgIndex];
    if (typing) {
      if (displayed.length < full.length) {
        const t = setTimeout(() => setDisplayed(full.slice(0, displayed.length + 1)), 45);
        return () => clearTimeout(t);
      } else {
        setTyping(false);
        const t = setTimeout(() => {
          setTyping(true);
          setDisplayed('');
          setMsgIndex((i) => (i + 1) % MESSAGES.length);
        }, 2800);
        return () => clearTimeout(t);
      }
    }
  }, [displayed, typing, msgIndex]);

  // Three.js robot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch { return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(220, 320);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 220 / 320, 0.1, 100);
    camera.position.set(0, 0.2, 6.5);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fill.position.set(-3, 2, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xf97316, 0.3);
    rim.position.set(0, -2, -3);
    scene.add(rim);

    const { robot, head, lidL, lidR, antBall } = buildRobot(scene);

    // Shadow circle under feet
    const shadowGeo = new THREE.CircleGeometry(0.7, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x0369a1, transparent: true, opacity: 0.15 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.18;
    scene.add(shadow);

    const clock = new THREE.Clock();
    let blinkTimer = 0;
    let blinking = false;
    let blinkProgress = 0;
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Idle bob
      robot.position.y = Math.sin(t * 1.4) * 0.07;

      // Gentle head sway
      head.rotation.y = Math.sin(t * 0.7) * 0.18;
      head.rotation.z = Math.sin(t * 0.5) * 0.06;

      // Antenna pulse scale
      const pulse = 1 + Math.sin(t * 3) * 0.15;
      antBall.scale.setScalar(pulse);

      // Blink logic
      blinkTimer += clock.getDelta() * 0; // use t diff below
      const blinkCycle = (t % 4.5);
      if (blinkCycle > 4.0 && !blinking) { blinking = true; blinkProgress = 0; }
      if (blinking) {
        blinkProgress += 0.18;
        const lidScale = blinkProgress < 0.5
          ? blinkProgress * 2
          : 2 - blinkProgress * 2;
        const clamped = Math.max(0, Math.min(1, lidScale));
        lidL.scale.y = clamped;
        lidR.scale.y = clamped;
        if (blinkProgress >= 1) { blinking = false; lidL.scale.y = 0; lidR.scale.y = 0; }
      }

      // Slight robot tilt toward viewer on mouse (passive)
      robot.rotation.y = Math.sin(t * 0.3) * 0.12;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, []);

  const isLogin = page === 'login';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', userSelect: 'none' }}>
      {/* Speech bubble */}
      <div style={{
        position: 'relative',
        background: '#ffffff',
        border: '1.5px solid #7dd3fc',
        borderRadius: '14px',
        padding: '0.75rem 1rem',
        maxWidth: '220px',
        minHeight: '52px',
        boxShadow: '0 4px 16px rgba(3,105,161,0.15)',
        marginBottom: '0',
      }}>
        <p style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600, margin: 0, lineHeight: 1.5, minHeight: '2.4em' }}>
          {displayed}
          <span style={{ display: 'inline-block', width: '2px', height: '0.85em', background: '#0369a1', marginLeft: '1px', verticalAlign: 'text-bottom', animation: 'blink-cursor 0.7s step-end infinite' }} />
        </p>
        {/* Bubble tail pointing down */}
        <div style={{
          position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '10px solid #7dd3fc',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '9px solid #ffffff',
        }} />
      </div>

      {/* Robot canvas */}
      <canvas ref={canvasRef} style={{ width: 220, height: 320 }} />

      {/* Label */}
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '-8px' }}>
        {isLogin ? 'AtomBot · Login Assistant' : 'AtomBot · Setup Assistant'}
      </div>

      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
