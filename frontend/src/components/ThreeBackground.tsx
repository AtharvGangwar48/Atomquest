import { useEffect, useRef, Component, type ReactNode } from 'react';
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

    // Vibrant color palette
    const COLORS = {
      orange:  0xf97316,
      teal:    0x14b8a6,
      yellow:  0xeab308,
      red:     0xef4444,
      blue:    0x3b82f6,
      green:   0x22c55e,
    };

    // Icosahedron — orange
    const icoMat = new THREE.LineBasicMaterial({ color: COLORS.orange, transparent: true, opacity: 0.18 });
    const ico = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(100, 1)), icoMat);
    ico.position.set(200, 80, -100);
    scene.add(ico);

    // Torus — teal
    const torusMat = new THREE.LineBasicMaterial({ color: COLORS.teal, transparent: true, opacity: 0.15 });
    const torus = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(75, 1.4, 8, 48)), torusMat);
    torus.position.set(-270, 150, -200);
    torus.rotation.x = 1.1;
    scene.add(torus);

    // Octahedron — red
    const octMat = new THREE.LineBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.16 });
    const oct = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(60)), octMat);
    oct.position.set(-190, -190, -60);
    scene.add(oct);

    // Tetrahedron — yellow
    const tetraMat = new THREE.LineBasicMaterial({ color: COLORS.yellow, transparent: true, opacity: 0.18 });
    const tetra = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(55)), tetraMat);
    tetra.position.set(310, -130, -150);
    scene.add(tetra);

    // Small torus — green
    const torus2Mat = new THREE.LineBasicMaterial({ color: COLORS.green, transparent: true, opacity: 0.13 });
    const torus2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(40, 1.0, 6, 32)), torus2Mat);
    torus2.position.set(-80, -280, -80);
    torus2.rotation.y = 0.8;
    scene.add(torus2);

    // Colorful floating dots — multi-color
    const dotColors = [COLORS.orange, COLORS.teal, COLORS.yellow, COLORS.red, COLORS.blue, COLORS.green];
    dotColors.forEach((col, ci) => {
      const count = 12;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 900;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 700;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 200 - 100;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: col, size: ci % 2 === 0 ? 3 : 2, transparent: true, opacity: 0.3 });
      scene.add(new THREE.Points(geo, mat));
    });

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
      ico.rotation.y   += 0.0015; ico.rotation.x   += 0.0008;
      torus.rotation.z += 0.003;  torus.rotation.y  += 0.001;
      oct.rotation.x   += 0.002;  oct.rotation.z    += 0.0012;
      tetra.rotation.y += 0.002;  tetra.rotation.x  += 0.0015;
      torus2.rotation.z += 0.004; torus2.rotation.x += 0.001;
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
