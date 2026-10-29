import { createOfficeAvatar } from "./office-avatar";
import type { AgentRecord } from "./shared/contracts/workspace";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export default function Office({
  agents,
  onSelect,
  compact = false,
  reduced = false,
  layout = "studio",
}: {
  agents: AgentRecord[];
  onSelect: (id: string) => void;
  compact?: boolean;
  reduced?: boolean;
  layout?: "studio" | "circle";
}) {
  const host = useRef<HTMLDivElement>(null),
    [fallback, setFallback] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    let frame = 0;
    const disposables: { dispose: () => void }[] = [];
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);
    let alive = true;
    const imported: THREE.Object3D[] = [];
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(9, 10, 12);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7a8e71, 2.6));
    const sun = new THREE.DirectionalLight(0xfff4dd, 3);
    sun.position.set(4, 9, 5);
    scene.add(sun);
    const group = new THREE.Group();
    scene.add(group);
    const targets: THREE.Group[] = [];
    function box(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      color: number,
    ) {
      const g = new THREE.BoxGeometry(w, h, d),
        m = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      disposables.push(g, m);
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    }
    box(8, 0.25, 6, 0, -0.2, 0, 0xe5e9dc);
    box(8, 0.1, 0.08, 0, 0, -3, 0xbac3af);
    box(0.08, 0.1, 6, -4, 0, 0, 0xbac3af);
    for (let i = -3; i <= 3; i++) box(0.014, 0.01, 6, i, -0.06, 0, 0xc7d0bd);
    for (let i = -2; i <= 2; i++) box(8, 0.01, 0.014, 0, -0.06, i, 0xc7d0bd);
    agents.forEach((a, i) => {
      const angle = (i * Math.PI) / 2;
      const x = layout === "circle" ? Math.cos(angle) * 2.3 : i % 2 ? 2 : -2,
        z =
          layout === "circle"
            ? Math.sin(angle) * 1.65 - 0.4
            : i < 2
              ? -1.5
              : 1.4;
      box(2.3, 0.15, 1.2, x, 0.8, z, 0xfaf8ed);
      box(0.12, 0.8, 0.12, x - 0.8, 0.35, z, 0x88917f);
      box(0.12, 0.8, 0.12, x + 0.8, 0.35, z, 0x88917f);
      box(0.85, 0.5, 0.09, x, 1.15, z - 0.25, 0x454d42);
      box(0.72, 0.35, 0.03, x, 1.16, z - 0.19, 0xc8ed9b);
      const { avatar, dispose } = createOfficeAvatar(a.id, a.color);
      avatar.position.set(x, 0, z + 0.85);
      group.add(avatar);
      targets.push(avatar);
      disposables.push({ dispose });
    });
    box(1, 0.4, 1, 0, 0.15, 0, 0xc2cdb5);
    const plant = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 1),
      new THREE.MeshStandardMaterial({ color: 0x8caa72 }),
    );
    plant.position.set(0, 0.8, 0);
    group.add(plant);
    disposables.push(plant.geometry, plant.material);
    const loader = new GLTFLoader();
    function model(
      file: string,
      x: number,
      z: number,
      height: number,
      rotation = 0,
    ) {
      loader.load(
        "/office-assets/" + file,
        (gltf) => {
          const object = gltf.scene;
          if (!alive) {
            object.traverse((n) => {
              if (!(n instanceof THREE.Mesh)) return;
              n.geometry.dispose();
              if (n.material) {
                (Array.isArray(n.material) ? n.material : [n.material]).forEach(
                  (m: THREE.Material) => {
                    Object.values(m).forEach((value) => {
                      if (value instanceof THREE.Texture) value.dispose();
                    });
                    m.dispose();
                  },
                );
              }
            });
            return;
          }
          const bounds = new THREE.Box3().setFromObject(object),
            size = bounds.getSize(new THREE.Vector3());
          const scale = height / (size.y || 1);
          object.scale.setScalar(scale);
          object.position.set(x, -bounds.min.y * scale, z);
          object.rotation.y = rotation;
          group.add(object);
          if (!document.hidden) renderer.render(scene, camera);
          imported.push(object);
        },
        undefined,
        () => {},
      );
    }
    model("pottedPlant.glb", -3.4, -2.5, 1.6);
    model("pottedPlant.glb", 3.4, 2.4, 1.2);
    model("loungeSofa.glb", 0, -2.55, 0.8);
    model("tableCoffee.glb", 0, -1.5, 0.4);
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let downX = 0,
      rotation = 0,
      drag = false;
    const down = (e: PointerEvent) => {
      downX = e.clientX;
      drag = true;
      rotation = group.rotation.y;
    };
    const move = (e: PointerEvent) => {
      if (drag) {
        group.rotation.y = rotation + (e.clientX - downX) * 0.007;
        if (reduced && !document.hidden) renderer.render(scene, camera);
      }
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      drag = false;
      if (Math.abs(e.clientX - downX) > 5) return;
      const r = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(targets, true);
      const hitId: unknown = hits[0]?.object.userData.id;
      if (typeof hitId === "string") onSelect(hitId);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    const resize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      if (!document.hidden) renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    function animate(t: number) {
      targets.forEach((avatar, i) => {
        avatar.rotation.y = reduced ? 0 : Math.sin(t * 0.0007 + i) * 0.08;
      });
      renderer.render(scene, camera);
      if (!document.hidden && !reduced) frame = requestAnimationFrame(animate);
    }
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(animate);
    };
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      alive = false;
      imported.forEach((o) =>
        o.traverse((n) => {
          if (!(n instanceof THREE.Mesh)) return;
          n.geometry.dispose();
          if (n.material)
            (Array.isArray(n.material) ? n.material : [n.material]).forEach(
              (m: THREE.Material) => {
                Object.values(m).forEach((v) => {
                  if (v instanceof THREE.Texture) v.dispose();
                });
                m.dispose();
              },
            );
        }),
      );
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [agents, onSelect, reduced, layout]);
  return (
    <div className={"office-scene " + (compact ? "compact" : "")}>
      <div
        className="scene-canvas"
        ref={host}
        aria-label="Interactive 3D office. Drag to rotate; use agent buttons below for keyboard access."
        role="img"
      />
      {fallback && (
        <div className="scene-fallback">
          3D is unavailable on this device. Your agents are available below.
        </div>
      )}
      <div className="scene-caption">
        <span className="live-dot" /> Your studio · local preview{" "}
        <span>Drag to explore</span>
      </div>
    </div>
  );
}
