import * as THREE from "three";

/** Locally rendered characters: no remote avatars, scripts or personal data requests. */
export function createOfficeAvatar(id: string, color: string) {
  const avatar = new THREE.Group();
  let seed = 0;
  for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const skin = [0xf0c6a3, 0xc58e65, 0x895b40, 0xdba883][seed % 4] ?? 0xf0c6a3;
  const hair = [0x272320, 0x513425, 0x9a7042][seed % 3] ?? 0x272320;
  const resources: { dispose(): void }[] = [];
  const materials = new Map<
    THREE.ColorRepresentation,
    THREE.MeshStandardMaterial
  >();
  function part(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    tint: THREE.ColorRepresentation,
  ) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    let material = materials.get(tint);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: tint,
        roughness: 0.85,
      });
      materials.set(tint, material);
      resources.push(material);
    }
    resources.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData.id = id;
    avatar.add(mesh);
    return mesh;
  }
  // Standing figures face the viewer; colors and hair remain stable for each agent ID.
  for (const side of [-1, 1]) {
    part(0.16, 0.44, 0.18, side * 0.12, 0.3, 0, 0x354052);
    part(0.18, 0.12, 0.28, side * 0.12, 0.06, 0.04, 0x202631);
    part(0.14, 0.4, 0.18, side * 0.32, 0.7, 0, color);
    part(0.13, 0.14, 0.15, side * 0.32, 0.44, 0, skin);
  }
  part(0.46, 0.5, 0.26, 0, 0.75, 0, color);
  part(0.14, 0.12, 0.14, 0, 1.04, 0, skin);
  part(0.38, 0.38, 0.34, 0, 1.27, 0, skin);
  part(0.4, 0.12, 0.36, 0, 1.48, -0.01, hair);
  part(0.4, 0.24, 0.09, 0, 1.33, -0.16, hair);
  if (seed % 2) part(0.17, 0.09, 0.28, -0.09, 1.57, -0.03, hair);
  for (const side of [-1, 1]) {
    part(0.065, 0.07, 0.02, side * 0.09, 1.29, 0.178, 0x202631);
    part(0.055, 0.14, 0.12, side * 0.22, 1.3, 0, 0x354052);
  }
  part(0.1, 0.025, 0.02, 0, 1.17, 0.178, 0x8b4c42);
  part(0.44, 0.045, 0.08, 0, 1.55, 0, 0x354052);
  part(0.05, 0.04, 0.2, 0.22, 1.19, 0.13, 0x354052);
  avatar.userData.id = id;
  return {
    avatar,
    dispose: () => resources.forEach((resource) => resource.dispose()),
  };
}
