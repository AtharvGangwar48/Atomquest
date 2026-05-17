import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PageHeroProps {
  variant: 'mygoals' | 'team' | 'analytics' | 'admin' | 'audit' | 'help' | 'scoring';
}

const META: Record<PageHeroProps['variant'], { g1: string; g2: string; shadow: string }> = {
  mygoals:   { g1: '#4f46e5', g2: '#7c3aed', shadow: 'rgba(79,70,229,0.35)'   },
  team:      { g1: '#0891b2', g2: '#0284c7', shadow: 'rgba(8,145,178,0.35)'   },
  analytics: { g1: '#059669', g2: '#0d9488', shadow: 'rgba(5,150,105,0.35)'   },
  admin:     { g1: '#7c3aed', g2: '#a855f7', shadow: 'rgba(124,58,237,0.35)'  },
  audit:     { g1: '#d97706', g2: '#dc2626', shadow: 'rgba(217,119,6,0.35)'   },
  help:      { g1: '#0f172a', g2: '#1e3a5f', shadow: 'rgba(15,23,42,0.4)'     },
  scoring:   { g1: '#e11d48', g2: '#be123c', shadow: 'rgba(225,29,72,0.35)'   },
};

// ── Scene 1: MyGoals — Orbiting target rings (bullseye) ───────────────────
function SceneMyGoals(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const rings: THREE.Mesh[] = [];
  const radii = [0.4, 0.8, 1.2, 1.6];
  radii.forEach((r, i) => {
    const geo = new THREE.TorusGeometry(r, 0.04, 12, 80);
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.72 - i * 0.04, 0.9, 0.65),
      emissive: new THREE.Color().setHSL(0.72 - i * 0.04, 0.9, 0.25),
      shininess: 100,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    rings.push(ring);
  });

  // Center dot
  const dotGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const dotMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  scene.add(new THREE.Mesh(dotGeo, dotMat));

  // Crosshair lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
  [0, Math.PI / 2].forEach((angle) => {
    const pts = [new THREE.Vector3(Math.cos(angle) * -2, Math.sin(angle) * -2, 0), new THREE.Vector3(Math.cos(angle) * 2, Math.sin(angle) * 2, 0)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  });

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.5)));
  const pt = new THREE.PointLight(0xffffff, 1.5, 20); pt.position.set(4, 4, 4); scene.add(pt);

  return (t: number) => {
    rings.forEach((r, i) => {
      r.rotation.z = t * (0.4 + i * 0.15) * (i % 2 === 0 ? 1 : -1);
      r.rotation.x = Math.PI / 2 + Math.sin(t * 0.3 + i) * 0.3;
    });
    renderer.render(scene, camera);
  };
}

// ── Scene 2: Team — Interconnected nodes network ──────────────────────────
function SceneTeam(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const nodePositions: THREE.Vector3[] = [];
  const nodes: THREE.Mesh[] = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = i === 0 ? 0 : (i < 4 ? 1.2 : 2.0);
    const pos = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * 0.6, (Math.random() - 0.5) * 0.5);
    nodePositions.push(pos);
    const size = i === 0 ? 0.18 : 0.1;
    const geo = new THREE.SphereGeometry(size, 16, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: i === 0 ? 0xffffff : new THREE.Color().setHSL(0.55, 0.8, 0.65),
      emissive: i === 0 ? 0x88aaff : new THREE.Color().setHSL(0.55, 0.8, 0.3),
      emissiveIntensity: 0.4,
    });
    const node = new THREE.Mesh(geo, mat);
    node.position.copy(pos);
    scene.add(node);
    nodes.push(node);
  }

  // Edges
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.4 });
  [[0,1],[0,2],[0,3],[1,4],[2,5],[3,6],[1,7],[4,5],[5,6]].forEach(([a, b]) => {
    if (nodePositions[a] && nodePositions[b]) {
      const pts = [nodePositions[a].clone(), nodePositions[b].clone()];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), edgeMat));
    }
  });

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.6)));
  const pt = new THREE.PointLight(0x7dd3fc, 2, 20); pt.position.set(3, 3, 3); scene.add(pt);

  return (t: number) => {
    nodes.forEach((n, i) => {
      n.position.y = nodePositions[i].y + Math.sin(t * 0.8 + i * 0.9) * 0.08;
      n.scale.setScalar(1 + Math.sin(t * 1.2 + i) * 0.08);
    });
    scene.rotation.y = Math.sin(t * 0.2) * 0.3;
    renderer.render(scene, camera);
  };
}

// ── Scene 3: Analytics — Bar chart rising from floor ─────────────────────
function SceneAnalytics(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3, 2.5, 4);
  camera.lookAt(0, 0.5, 0);

  const heights = [0.6, 1.1, 0.8, 1.5, 1.0, 1.8, 1.3];
  const colors  = [0x34d399, 0x6ee7b7, 0x10b981, 0x059669, 0x34d399, 0x6ee7b7, 0x10b981];
  const bars: { mesh: THREE.Mesh; targetH: number }[] = [];

  heights.forEach((h, i) => {
    const geo = new THREE.BoxGeometry(0.28, 1, 0.28);
    const mat = new THREE.MeshPhongMaterial({
      color: colors[i % colors.length],
      emissive: new THREE.Color(colors[i % colors.length]),
      emissiveIntensity: 0.2,
      shininess: 60,
    });
    const bar = new THREE.Mesh(geo, mat);
    bar.position.x = (i - 3) * 0.45;
    bar.scale.y = 0.01;
    scene.add(bar);
    bars.push({ mesh: bar, targetH: h });
  });

  // Floor grid
  const gridHelper = new THREE.GridHelper(4, 8, 0x1a7a5a, 0x1a5a4a);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.5)));
  const pt = new THREE.PointLight(0x34d399, 2, 20); pt.position.set(2, 4, 2); scene.add(pt);

  let grown = false;
  return (t: number) => {
    if (!grown) {
      bars.forEach(({ mesh, targetH }) => {
        if (mesh.scale.y < targetH) {
          mesh.scale.y = Math.min(mesh.scale.y + 0.025, targetH);
          mesh.position.y = (mesh.scale.y - 1) * 0.5;
        }
      });
      grown = bars.every(({ mesh, targetH }) => mesh.scale.y >= targetH);
    }
    bars.forEach(({ mesh }, i) => {
      mesh.position.y = (mesh.scale.y - 1) * 0.5 + Math.sin(t * 1.5 + i * 0.7) * 0.04;
    });
    scene.rotation.y = t * 0.15;
    renderer.render(scene, camera);
  };
}

// ── Scene 4: Admin — Gear / cog system ───────────────────────────────────
function SceneAdmin(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const makeGear = (r: number, teeth: number, color: number) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, r, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    // Add teeth
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const toothShape = new THREE.Shape();
      const w = 0.12, h = 0.18;
      toothShape.moveTo(Math.cos(a - w / r) * r, Math.sin(a - w / r) * r);
      toothShape.lineTo(Math.cos(a - w / r) * (r + h), Math.sin(a - w / r) * (r + h));
      toothShape.lineTo(Math.cos(a + w / r) * (r + h), Math.sin(a + w / r) * (r + h));
      toothShape.lineTo(Math.cos(a + w / r) * r, Math.sin(a + w / r) * r);
      toothShape.closePath();
      shape.holes.push(toothShape);
    }

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.15, side: THREE.DoubleSide, shininess: 80 });
    return new THREE.Mesh(geo, mat);
  };

  const g1 = makeGear(0.9, 10, 0xa78bfa);
  const g2 = makeGear(0.55, 7, 0xc4b5fd);
  g2.position.set(1.5, 0, 0);
  const g3 = makeGear(0.4, 5, 0xddd6fe);
  g3.position.set(-1.3, 0.8, 0);

  scene.add(g1, g2, g3);

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.5)));
  const pt = new THREE.PointLight(0xa78bfa, 2, 20); pt.position.set(3, 3, 3); scene.add(pt);

  return (t: number) => {
    g1.rotation.z = t * 0.4;
    g2.rotation.z = -t * 0.4 * (0.9 / 0.55);
    g3.rotation.z = -t * 0.4 * (0.9 / 0.4);
    renderer.render(scene, camera);
  };
}

// ── Scene 5: Audit — DNA double helix ────────────────────────────────────
function SceneAudit(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const strandA: THREE.Mesh[] = [];
  const strandB: THREE.Mesh[] = [];
  const rungs: THREE.Line[] = [];
  const steps = 28;

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 4 - Math.PI * 2;
    const y = (i / steps) * 3.6 - 1.8;

    const posA = new THREE.Vector3(Math.cos(t) * 0.7, y, Math.sin(t) * 0.7);
    const posB = new THREE.Vector3(Math.cos(t + Math.PI) * 0.7, y, Math.sin(t + Math.PI) * 0.7);

    const geo = new THREE.SphereGeometry(0.07, 8, 8);
    const matA = new THREE.MeshPhongMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.3 });
    const matB = new THREE.MeshPhongMaterial({ color: 0xf87171, emissive: 0xf87171, emissiveIntensity: 0.3 });

    const sA = new THREE.Mesh(geo, matA); sA.position.copy(posA); scene.add(sA); strandA.push(sA);
    const sB = new THREE.Mesh(geo, matB); sB.position.copy(posB); scene.add(sB); strandB.push(sB);

    if (i % 3 === 0) {
      const rungMat = new THREE.LineBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.5 });
      const rung = new THREE.Line(new THREE.BufferGeometry().setFromPoints([posA, posB]), rungMat);
      scene.add(rung);
      rungs.push(rung);
    }
  }

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.5)));
  const pt = new THREE.PointLight(0xfbbf24, 1.5, 20); pt.position.set(3, 2, 3); scene.add(pt);

  return (t: number) => {
    scene.rotation.y = t * 0.4;
    renderer.render(scene, camera);
  };
}

// ── Scene 6: Help — Open book / pages ────────────────────────────────────
function SceneHelp(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.5, 4.5);
  camera.lookAt(0, 0, 0);

  // Book spine
  const spineGeo = new THREE.BoxGeometry(0.12, 2.2, 0.08);
  const spineMat = new THREE.MeshPhongMaterial({ color: 0x60a5fa, shininess: 80 });
  scene.add(new THREE.Mesh(spineGeo, spineMat));

  // Pages (left and right)
  const pageMat = new THREE.MeshPhongMaterial({ color: 0xf0f9ff, side: THREE.DoubleSide, shininess: 20 });
  const pages: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const geo = new THREE.PlaneGeometry(1.4, 2.0);
    const page = new THREE.Mesh(geo, pageMat);
    page.position.x = side * 0.76;
    page.rotation.y = side * -0.25;
    scene.add(page);
    pages.push(page);
  });

  // Text lines on pages
  const lineMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.6 });
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 7; row++) {
      const y = 0.7 - row * 0.22;
      const w = 0.5 + Math.random() * 0.4;
      const pts = [new THREE.Vector3(side * 0.2, y, 0.01), new THREE.Vector3(side * 0.2 + side * w, y, 0.01)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }
  });

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.6)));
  const pt = new THREE.PointLight(0x60a5fa, 1.5, 20); pt.position.set(2, 3, 3); scene.add(pt);

  return (t: number) => {
    pages[0].rotation.y = -0.25 + Math.sin(t * 0.5) * 0.12;
    pages[1].rotation.y =  0.25 - Math.sin(t * 0.5) * 0.12;
    scene.rotation.y = Math.sin(t * 0.25) * 0.3;
    renderer.render(scene, camera);
  };
}

// ── Scene 7: Scoring — Gauge / speedometer ───────────────────────────────
function SceneScoring(_canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  // Arc segments (gauge)
  const arcColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e];
  const arcCount = 4;
  for (let i = 0; i < arcCount; i++) {
    const startAngle = Math.PI + (i / arcCount) * Math.PI;
    const endAngle   = Math.PI + ((i + 1) / arcCount) * Math.PI;
    const geo = new THREE.TorusGeometry(1.4, 0.18, 8, 40, endAngle - startAngle);
    const mat = new THREE.MeshPhongMaterial({ color: arcColors[i], emissive: new THREE.Color(arcColors[i]), emissiveIntensity: 0.2, shininess: 60 });
    const arc = new THREE.Mesh(geo, mat);
    arc.rotation.z = startAngle;
    scene.add(arc);
  }

  // Needle
  const needleGeo = new THREE.ConeGeometry(0.05, 1.2, 8);
  const needleMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.y = 0.6;
  const needlePivot = new THREE.Group();
  needlePivot.add(needle);
  needlePivot.rotation.z = Math.PI * 1.5;
  scene.add(needlePivot);

  // Center cap
  const capGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const capMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });
  scene.add(new THREE.Mesh(capGeo, capMat));

  // Tick marks
  for (let i = 0; i <= 8; i++) {
    const angle = Math.PI + (i / 8) * Math.PI;
    const inner = 1.1, outer = 1.3;
    const pts = [
      new THREE.Vector3(Math.cos(angle) * inner, Math.sin(angle) * inner, 0),
      new THREE.Vector3(Math.cos(angle) * outer, Math.sin(angle) * outer, 0),
    ];
    const tickMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), tickMat));
  }

  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.5)));
  const pt = new THREE.PointLight(0xffffff, 1.5, 20); pt.position.set(3, 3, 3); scene.add(pt);

  return (t: number) => {
    // Needle sweeps back and forth
    needlePivot.rotation.z = Math.PI * 1.5 - Math.PI * 0.75 + Math.sin(t * 0.6) * Math.PI * 0.4;
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

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      tick(clock.getElapsedTime());
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [variant]);

  return <canvas ref={canvasRef} style={{ width: 180, height: 180, flexShrink: 0 }} />;
}

const CONTENT: Record<PageHeroProps['variant'], { label: string; title: string; subtitle: string; icon: string }> = {
  mygoals: {
    label: 'Goal Management',
    title: 'My Goals',
    subtitle: 'Set your yearly goals, get them approved, and log quarterly progress. Your score updates automatically.',
    icon: '🎯',
  },
  team: {
    label: 'Team Management',
    title: 'Team Goal Sheets',
    subtitle: 'Review and approve your team\'s goal sheets, add quarterly check-in comments, and track everyone\'s progress.',
    icon: '👥',
  },
  analytics: {
    label: 'Performance Insights',
    title: 'Analytics',
    subtitle: 'Quarter-on-quarter trends, completion heatmaps by thrust area, goal distribution, and escalation rule management.',
    icon: '📊',
  },
  admin: {
    label: 'Administration',
    title: 'Admin Panel',
    subtitle: 'Configure goal cycles, manage the completion dashboard, export Excel reports, and unlock approved sheets.',
    icon: '⚙️',
  },
  audit: {
    label: 'Governance & Compliance',
    title: 'Audit Trail',
    subtitle: 'Every change logged — who did what, when, and exactly what changed. Filter by entity type or ID.',
    icon: '📋',
  },
  help: {
    label: 'Documentation',
    title: 'How AtomQuest Works',
    subtitle: 'Step-by-step guide for Employees, Managers, and Admins. Understand the goal lifecycle, scoring, and your role.',
    icon: '📖',
  },
  scoring: {
    label: 'Scoring System',
    title: 'How Scoring Works',
    subtitle: 'Four scoring types — MAX, MIN, TIMELINE, ZERO. AtomQuest calculates your performance score automatically.',
    icon: '🧠',
  },
};

export default function PageHero({ variant }: PageHeroProps) {
  const { g1, g2, shadow } = META[variant];
  const { label, title, subtitle, icon } = CONTENT[variant];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
      borderRadius: '16px',
      padding: '1.75rem 2rem',
      marginBottom: '1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      flexWrap: 'wrap',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: `0 8px 32px ${shadow}`,
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 75% 50%, rgba(255,255,255,0.07) 0%, transparent 55%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {label}
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
          {icon} {title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.875rem', margin: 0, lineHeight: 1.65, maxWidth: '500px' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, opacity: 0.95, flexShrink: 0 }}>
        <ThreeScene variant={variant} />
      </div>
    </div>
  );
}
