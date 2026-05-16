import { useEffect, useRef, Component, ReactNode } from 'react';
import * as THREE from 'three';

class ThreeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ThreeBackgroundCanvas() {
  const mountRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch { return; }
    if (!renderer.getContext()) { renderer.dispose(); return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 600;

    // ── Soft floating geometric shapes ────────────────────────────────────
    const matLine = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.12 });
    const matLineFaint = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.07 });

    // Large icosahedron wireframe — center
    const icoGeo = new THREE.IcosahedronGeometry(110, 1);
    const icoEdges = new THREE.EdgesGeometry(icoGeo);
    const ico = new THREE.LineSegments(icoEdges, matLine);
    ico.position.set(180, 60, -100);
    scene.add(ico);

    // Torus ring — upper left
    const torusGeo = new THREE.TorusGeometry(70, 1.2, 8, 48);
    const torusEdges = new THREE.EdgesGeometry(torusGeo);
    const torus = new THREE.LineSegments(torusEdges, matLineFaint);
    torus.position.set(-260, 140, -200);
    torus.rotation.x = 1.1;
    scene.add(torus);

    // Octahedron — lower right
    const octGeo = new THREE.OctahedronGeometry(55);
    const octEdges = new THREE.EdgesGeometry(octGeo);
    const oct = new THREE.LineSegments(octEdges, matLine);
    oct.position.set(-180, -180, -60);
    scene.add(oct);

    // Small sphere — top right
    const sphereGeo = new THREE.SphereGeometry(38, 12, 8);
    const sphereEdges = new THREE.EdgesGeometry(sphereGeo);
    const sphere = new THREE.LineSegments(sphereEdges, matLineFaint);
    sphere.position.set(300, -120, -150);
    scene.add(sphere);

    // Floating dots (points)
    const dotCount = 60;
    const dotPos = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      dotPos[i * 3]     = (Math.random() - 0.5) * 900;
      dotPos[i * 3 + 1] = (Math.random() - 0.5) * 700;
      dotPos[i * 3 + 2] = (Math.random() - 0.5) * 200 - 100;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
    const dotMat = new THREE.PointsMaterial({ color: 0x818cf8, size: 2.5, transparent: true, opacity: 0.25 });
    scene.add(new THREE.Points(dotGeo, dotMat));

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      ico.rotation.y += 0.0015;
      ico.rotation.x += 0.0008;

      torus.rotation.z += 0.003;
      torus.rotation.y += 0.001;

      oct.rotation.x += 0.002;
      oct.rotation.z += 0.0012;

      sphere.rotation.y += 0.002;
      sphere.rotation.x += 0.0015;

      // Subtle camera drift
      camera.position.x += (mouse.x * 20 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 14 - camera.position.y) * 0.03;
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

export default function ThreeBackground() {
  return (
    <ThreeErrorBoundary>
      <ThreeBackgroundCanvas />
    </ThreeErrorBoundary>
  );
}
