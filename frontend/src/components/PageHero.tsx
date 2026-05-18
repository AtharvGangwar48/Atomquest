import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PageHeroProps {
  variant: 'mygoals' | 'team' | 'analytics' | 'admin' | 'audit' | 'help' | 'scoring';
}

// Bold, vibrant gradients — no more light purple
const META: Record<PageHeroProps['variant'], { g1: string; g2: string; g3: string; shadow: string }> = {
  mygoals:   { g1: '#ea580c', g2: '#f97316', g3: '#fbbf24', shadow: 'rgba(234,88,12,0.4)'   },
  team:      { g1: '#0369a1', g2: '#0ea5e9', g3: '#38bdf8', shadow: 'rgba(3,105,161,0.4)'   },
  analytics: { g1: '#15803d', g2: '#16a34a', g3: '#4ade80', shadow: 'rgba(21,128,61,0.4)'   },
  admin:     { g1: '#b91c1c', g2: '#dc2626', g3: '#f87171', shadow: 'rgba(185,28,28,0.4)'   },
  audit:     { g1: '#92400e', g2: '#d97706', g3: '#fbbf24', shadow: 'rgba(146,64,14,0.4)'   },
  help:      { g1: '#1e3a5f', g2: '#1d4ed8', g3: '#60a5fa', shadow: 'rgba(30,58,95,0.4)'    },
  scoring:   { g1: '#6b21a8', g2: '#9333ea', g3: '#c084fc', shadow: 'rgba(107,33,168,0.4)'  },
};

// ── MyGoals: Bullseye target with orange rings ────────────────────────────
function SceneMyGoals(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const rings: THREE.Mesh[] = [];
  const ringColors = [0xfbbf24, 0xf97316, 0xea580c, 0xdc2626];
  [1.7, 1.2, 0.8, 0.4].forEach((r, i) => {
    const geo = new THREE.TorusGeometry(r, 0.055, 14, 80);
    const mat = new THREE.MeshPhongMaterial({ color: ringColors[i], emissive: new THREE.Color(ringColors[i]), emissiveIntensity: 0.3, shininess: 80 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    rings.push(ring);
  });

  // Arrow hitting center
  const arrowMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), arrowMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.6;
  scene.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 8), arrowMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 1.25;
  scene.add(tip);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pt = new THREE.PointLight(0xfbbf24, 2, 20); pt.position.set(3, 3, 4); scene.add(pt);

  return (t: number) => {
    rings.forEach((r, i) => {
      r.rotation.z = t * (0.3 + i * 0.12) * (i % 2 === 0 ? 1 : -1);
      r.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + i) * 0.2;
    });
    renderer.render(scene, camera);
  };
}

// ── Team: Org-chart nodes with blue connections ───────────────────────────
function SceneTeam(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5.5;

  const positions = [
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(-1.4, 0.2, 0), new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(1.4, 0.2, 0),
    new THREE.Vector3(-1.8, -1.2, 0), new THREE.Vector3(-0.6, -1.2, 0), new THREE.Vector3(0.6, -1.2, 0), new THREE.Vector3(1.8, -1.2, 0),
  ];
  const nodeColors = [0xfbbf24, 0x38bdf8, 0x38bdf8, 0x38bdf8, 0x60a5fa, 0x60a5fa, 0x60a5fa, 0x60a5fa];
  const nodes: THREE.Mesh[] = [];

  positions.forEach((pos, i) => {
    const size = i === 0 ? 0.22 : 0.13;
    const mat = new THREE.MeshPhongMaterial({ color: nodeColors[i], emissive: new THREE.Color(nodeColors[i]), emissiveIntensity: 0.35, shininess: 100 });
    const node = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), mat);
    node.position.copy(pos);
    scene.add(node);
    nodes.push(node);
  });

  // Connections
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 });
  [[0,1],[0,2],[0,3],[1,4],[1,5],[2,5],[3,6],[3,7]].forEach(([a, b]) => {
    const pts = [positions[a].clone(), positions[b].clone()];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), edgeMat));
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pt = new THREE.PointLight(0x38bdf8, 2, 20); pt.position.set(3, 3, 3); scene.add(pt);

  return (t: number) => {
    nodes.forEach((n, i) => {
      n.position.y = positions[i].y + Math.sin(t * 0.9 + i * 0.8) * 0.07;
      n.scale.setScalar(1 + Math.sin(t * 1.3 + i) * 0.07);
    });
    scene.rotation.y = Math.sin(t * 0.2) * 0.25;
    renderer.render(scene, camera);
  };
}

// ── Analytics: Colorful bar chart ────────────────────────────────────────
function SceneAnalytics(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3, 2.5, 4.5);
  camera.lookAt(0, 0.5, 0);

  const data = [0.5, 1.0, 0.7, 1.6, 0.9, 1.4, 1.1];
  const barColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6, 0x8b5cf6, 0xec4899];
  const bars: { mesh: THREE.Mesh; target: number }[] = [];

  data.forEach((h, i) => {
    const mat = new THREE.MeshPhongMaterial({ color: barColors[i], emissive: new THREE.Color(barColors[i]), emissiveIntensity: 0.25, shininess: 70 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), mat);
    bar.position.x = (i - 3) * 0.48;
    bar.scale.y = 0.01;
    scene.add(bar);
    bars.push({ mesh: bar, target: h });
  });

  const grid = new THREE.GridHelper(4, 8, 0x166534, 0x14532d);
  grid.position.y = -0.5;
  scene.add(grid);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pt = new THREE.PointLight(0x4ade80, 2, 20); pt.position.set(2, 4, 2); scene.add(pt);

  return (t: number) => {
    bars.forEach(({ mesh, target }) => {
      if (mesh.scale.y < target) mesh.scale.y = Math.min(mesh.scale.y + 0.022, target);
      mesh.position.y = (mesh.scale.y - 1) * 0.5;
    });
    bars.forEach(({ mesh }, i) => {
      mesh.position.y = (mesh.scale.y - 1) * 0.5 + Math.sin(t * 1.5 + i * 0.7) * 0.035;
    });
    scene.rotation.y = t * 0.12;
    renderer.render(scene, camera);
  };
}

// ── Admin: Red shield with lock ───────────────────────────────────────────
function SceneAdmin(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  // Shield shape
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 2);
  shieldShape.bezierCurveTo(1.5, 2, 1.8, 1.2, 1.8, 0.5);
  shieldShape.bezierCurveTo(1.8, -0.8, 0.8, -1.6, 0, -2.2);
  shieldShape.bezierCurveTo(-0.8, -1.6, -1.8, -0.8, -1.8, 0.5);
  shieldShape.bezierCurveTo(-1.8, 1.2, -1.5, 2, 0, 2);

  const shieldGeo = new THREE.ShapeGeometry(shieldShape);
  const shieldMat = new THREE.MeshPhongMaterial({ color: 0xdc2626, emissive: 0xb91c1c, emissiveIntensity: 0.2, side: THREE.DoubleSide, shininess: 80 });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  scene.add(shield);

  // Lock body
  const lockMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.3, shininess: 100 });
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.2), lockMat);
  lockBody.position.set(0, -0.1, 0.12);
  scene.add(lockBody);

  // Lock shackle
  const shackleMat = new THREE.LineBasicMaterial({ color: 0xfbbf24 });
  const shacklePoints = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI;
    shacklePoints.push(new THREE.Vector3(Math.cos(a) * 0.22, Math.sin(a) * 0.28 + 0.18, 0.12));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(shacklePoints), shackleMat));

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pt = new THREE.PointLight(0xfbbf24, 2, 20); pt.position.set(3, 3, 4); scene.add(pt);

  return (t: number) => {
    shield.rotation.y = Math.sin(t * 0.5) * 0.3;
    shield.rotation.z = Math.sin(t * 0.3) * 0.05;
    lockBody.rotation.y = shield.rotation.y;
    renderer.render(scene, camera);
  };
}

// ── Audit: Timeline with colored nodes ───────────────────────────────────
function SceneAudit(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  // Vertical timeline line
  const lineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)
  ]), lineMat));

  const eventColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6];
  const nodes: THREE.Mesh[] = [];
  const basePositions: THREE.Vector3[] = [];

  eventColors.forEach((col, i) => {
    const y = -1.6 + i * 0.8;
    const side = i % 2 === 0 ? 1 : -1;
    const pos = new THREE.Vector3(side * 0.8, y, 0);
    basePositions.push(pos.clone());

    const mat = new THREE.MeshPhongMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 0.4, shininess: 100 });
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), mat);
    node.position.copy(pos);
    scene.add(node);
    nodes.push(node);

    // Connector to timeline
    const connMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, y, 0), pos
    ]), connMat));

    // Small label box
    const boxMat = new THREE.MeshPhongMaterial({ color: col, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const box = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), boxMat);
    box.position.set(side * 1.4, y, 0);
    scene.add(box);
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pt = new THREE.PointLight(0xfbbf24, 1.5, 20); pt.position.set(3, 2, 3); scene.add(pt);

  return (t: number) => {
    nodes.forEach((n, i) => {
      n.position.x = basePositions[i].x + Math.sin(t * 0.8 + i) * 0.06;
      n.scale.setScalar(1 + Math.sin(t * 1.5 + i * 0.7) * 0.1);
    });
    scene.rotation.y = Math.sin(t * 0.2) * 0.2;
    renderer.render(scene, camera);
  };
}

// ── Help: Open book with blue pages ──────────────────────────────────────
function SceneHelp(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.5, 4.5);
  camera.lookAt(0, 0, 0);

  const spineMat = new THREE.MeshPhongMaterial({ color: 0x1d4ed8, shininess: 80 });
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.4, 0.1), spineMat));

  const pageMat = new THREE.MeshPhongMaterial({ color: 0xeff6ff, side: THREE.DoubleSide, shininess: 20 });
  const pages: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const page = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), pageMat);
    page.position.x = side * 0.82;
    page.rotation.y = side * -0.22;
    scene.add(page);
    pages.push(page);
  });

  // Colorful text lines
  const lineColors = [0x3b82f6, 0xf97316, 0x22c55e, 0xef4444, 0xeab308, 0x8b5cf6, 0x3b82f6];
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 7; row++) {
      const y = 0.75 - row * 0.24;
      const w = 0.45 + Math.random() * 0.45;
      const mat = new THREE.LineBasicMaterial({ color: lineColors[row], transparent: true, opacity: 0.7 });
      const pts = [new THREE.Vector3(side * 0.18, y, 0.01), new THREE.Vector3(side * 0.18 + side * w, y, 0.01)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pt = new THREE.PointLight(0x3b82f6, 1.5, 20); pt.position.set(2, 3, 3); scene.add(pt);

  return (t: number) => {
    pages[0].rotation.y = -0.22 + Math.sin(t * 0.5) * 0.1;
    pages[1].rotation.y =  0.22 - Math.sin(t * 0.5) * 0.1;
    scene.rotation.y = Math.sin(t * 0.25) * 0.28;
    renderer.render(scene, camera);
  };
}

// ── Scoring: Purple speedometer gauge ────────────────────────────────────
function SceneScoring(_c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const arcColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e];
  for (let i = 0; i < 4; i++) {
    const start = Math.PI + (i / 4) * Math.PI;
    const end   = Math.PI + ((i + 1) / 4) * Math.PI;
    const geo = new THREE.TorusGeometry(1.5, 0.2, 8, 40, end - start);
    const mat = new THREE.MeshPhongMaterial({ color: arcColors[i], emissive: new THREE.Color(arcColors[i]), emissiveIntensity: 0.3, shininess: 70 });
    const arc = new THREE.Mesh(geo, mat);
    arc.rotation.z = start;
    scene.add(arc);
  }

  // Needle
  const needleMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 });
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.055, 1.3, 8), needleMat);
  needle.position.y = 0.65;
  const pivot = new THREE.Group();
  pivot.add(needle);
  pivot.rotation.z = Math.PI * 1.5;
  scene.add(pivot);

  scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 120 })));

  // Tick marks
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const pts = [
      new THREE.Vector3(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0),
      new THREE.Vector3(Math.cos(a) * 1.38, Math.sin(a) * 1.38, 0),
    ];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })));
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pt = new THREE.PointLight(0xc084fc, 2, 20); pt.position.set(3, 3, 3); scene.add(pt);

  return (t: number) => {
    pivot.rotation.z = Math.PI * 1.5 - Math.PI * 0.75 + Math.sin(t * 0.6) * Math.PI * 0.42;
    renderer.render(scene, camera);
  };
}

const SCENE_BUILDERS: Record<PageHeroProps['variant'], (_c: HTMLCanvasElement, r: THREE.WebGLRenderer) => (t: number) => void> = {
  mygoals:   SceneMyGoals,
  team:      SceneTeam,
  analytics: SceneAnalytics,
  admin:     SceneAdmin,
  audit:     SceneAudit,
  help:      SceneHelp,
  scoring:   SceneScoring,
};

function ThreeScene({ variant }: { variant: PageHeroProps['variant'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(180, 180);
    renderer.setClearColor(0x000000, 0);
    const tick = SCENE_BUILDERS[variant](canvas, renderer);
    const clock = new THREE.Clock();
    let frameId: number;
    const animate = () => { frameId = requestAnimationFrame(animate); tick(clock.getElapsedTime()); };
    animate();
    return () => { cancelAnimationFrame(frameId); renderer.dispose(); };
  }, [variant]);

  return <canvas ref={canvasRef} style={{ width: 180, height: 180, flexShrink: 0 }} />;
}

const CONTENT: Record<PageHeroProps['variant'], { label: string; title: string; subtitle: string; icon: string }> = {
  mygoals:   { label: 'Goal Management',       title: 'My Goals',            subtitle: 'Set your yearly goals, get them approved, and log quarterly progress. Your score updates automatically.',                                                                icon: '🎯' },
  team:      { label: 'Team Management',        title: 'Team Goal Sheets',    subtitle: 'Review and approve your team\'s goal sheets, add quarterly check-in comments, and track everyone\'s progress.',                                                          icon: '👥' },
  analytics: { label: 'Performance Insights',   title: 'Analytics',           subtitle: 'Quarter-on-quarter trends, completion heatmaps by thrust area, goal distribution, and escalation rule management.',                                                      icon: '📊' },
  admin:     { label: 'Administration',          title: 'Admin Panel',         subtitle: 'Configure goal cycles, manage the completion dashboard, export Excel reports, and unlock approved sheets.',                                                               icon: '⚙️' },
  audit:     { label: 'Governance & Compliance', title: 'Audit Trail',         subtitle: 'Every change logged — who did what, when, and exactly what changed. Filter by entity type or ID.',                                                                       icon: '📋' },
  help:      { label: 'Documentation',           title: 'How AtomQuest Works', subtitle: 'Step-by-step guide for Employees, Managers, and Admins. Understand the goal lifecycle, scoring, and your role.',                                                         icon: '📖' },
  scoring:   { label: 'Scoring System',          title: 'How Scoring Works',   subtitle: 'Four scoring types — MAX, MIN, TIMELINE, ZERO. AtomQuest calculates your performance score automatically.',                                                              icon: '🧠' },
};

export default function PageHero({ variant }: PageHeroProps) {
  const { g1, g2, g3, shadow } = META[variant];
  const { label, title, subtitle, icon } = CONTENT[variant];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${g1} 0%, ${g2} 60%, ${g3} 100%)`,
      borderRadius: '18px',
      padding: '1.75rem 2rem',
      marginBottom: '1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      flexWrap: 'wrap',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: `0 10px 40px ${shadow}`,
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: '-40px', right: '160px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {label}
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '-0.025em', lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {icon} {title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: 0, lineHeight: 1.65, maxWidth: '500px' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, opacity: 0.95, flexShrink: 0 }}>
        <ThreeScene variant={variant} />
      </div>
    </div>
  );
}
