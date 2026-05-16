import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 120;
const CONNECTION_DISTANCE = 120;

export default function ThreeBackground() {
  const mountRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;

    // ── Particles ──────────────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: THREE.Vector3[] = [];
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const palette = [
      new THREE.Color('#6366f1'), // indigo
      new THREE.Color('#06b6d4'), // cyan
      new THREE.Color('#8b5cf6'), // violet
      new THREE.Color('#3b82f6'), // blue
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * window.innerWidth;
      positions[i * 3 + 1] = (Math.random() - 0.5) * window.innerHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.1,
      ));

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Connection lines ───────────────────────────────────────────────────
    const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
    const lineColors    = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
    const lineGeo = new THREE.BufferGeometry();
    const linePosAttr   = new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage);
    const lineColorAttr = new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', linePosAttr);
    lineGeo.setAttribute('color', lineColorAttr);

    const lineMat = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
    }));
    scene.add(lineMat);

    // ── Mouse parallax ─────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ─────────────────────────────────────────────────────
    let frameId: number;
    const halfW = window.innerWidth  / 2;
    const halfH = window.innerHeight / 2;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const pos = particleGeo.attributes.position.array as Float32Array;

      // Move particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3]     += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        // Wrap around edges
        if (pos[i * 3]     >  halfW) pos[i * 3]     = -halfW;
        if (pos[i * 3]     < -halfW) pos[i * 3]     =  halfW;
        if (pos[i * 3 + 1] >  halfH) pos[i * 3 + 1] = -halfH;
        if (pos[i * 3 + 1] < -halfH) pos[i * 3 + 1] =  halfH;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Build connection lines
      let lineIdx = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = pos[i * 3]     - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = 1 - dist / CONNECTION_DISTANCE;
            linePositions[lineIdx * 6]     = pos[i * 3];
            linePositions[lineIdx * 6 + 1] = pos[i * 3 + 1];
            linePositions[lineIdx * 6 + 2] = pos[i * 3 + 2];
            linePositions[lineIdx * 6 + 3] = pos[j * 3];
            linePositions[lineIdx * 6 + 4] = pos[j * 3 + 1];
            linePositions[lineIdx * 6 + 5] = pos[j * 3 + 2];

            lineColors[lineIdx * 6]     = 0.39 * alpha;
            lineColors[lineIdx * 6 + 1] = 0.40 * alpha;
            lineColors[lineIdx * 6 + 2] = 0.95 * alpha;
            lineColors[lineIdx * 6 + 3] = 0.39 * alpha;
            lineColors[lineIdx * 6 + 4] = 0.40 * alpha;
            lineColors[lineIdx * 6 + 5] = 0.95 * alpha;
            lineIdx++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2);
      linePosAttr.needsUpdate   = true;
      lineColorAttr.needsUpdate = true;

      // Subtle camera parallax on mouse move
      camera.position.x += (mouse.x * 30 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 20 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={mountRef} id="three-canvas" />;
}
