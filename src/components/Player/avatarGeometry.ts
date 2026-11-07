import * as THREE from "three";

export type Point3 = [number, number, number];

/** Low-resolution elliptical sweeps give each lock real thickness and a curled tip. */
export function hairLock(points: Point3[], width: number, depth: number) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const segments = 28,
    sides = 12;
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    // Keep the main lock broad; taper only the curled tip, not the full length.
    const taper =
      t < 0.12
        ? 0.15 + 0.85 * Math.sin(((t / 0.12) * Math.PI) / 2)
        : t < 0.72
          ? 0.82 + 0.18 * Math.sin((t / 0.72) * Math.PI)
          : Math.max(
              0.02,
              Math.cos((((t - 0.72) / 0.28) * Math.PI) / 2) ** 0.8,
            );
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const vertex = center
        .clone()
        .addScaledVector(frames.normals[i], Math.cos(a) * width * taper)
        .addScaledVector(frames.binormals[i], Math.sin(a) * depth * taper);
      positions.push(vertex.x, vertex.y, vertex.z);
      if (i < segments && j < sides) {
        const k = i * (sides + 1) + j;
        indices.push(
          k,
          k + 1,
          k + sides + 1,
          k + 1,
          k + sides + 2,
          k + sides + 1,
        );
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function line(points: Point3[], radius = 0.008) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    16,
    radius,
    6,
    false,
  );
}
export function star(radius = 1) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? radius * 0.46 : radius;
    if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSize: 0.004,
    bevelThickness: 0.003,
    bevelSegments: 1,
    steps: 1,
  });
  geometry.computeVertexNormals();
  return geometry;
}

// Constructed once and shared between expressions/accessories and avatar instances.
export const starGeometry = star();
export const smileGeometry = line(
  [
    [-0.066, -0.012, 0],
    [0, -0.04, 0.005],
    [0.066, -0.012, 0],
  ],
  0.008,
);
export const squintGeometry = line(
  [
    [-0.035, -0.025, 0],
    [0, 0.014, 0.003],
    [0.035, -0.025, 0],
  ],
  0.009,
);
export const crossGeometry = [
  line(
    [
      [-0.032, -0.035, 0],
      [0.032, 0.035, 0],
    ],
    0.009,
  ),
  line(
    [
      [-0.032, 0.035, 0],
      [0.032, -0.035, 0],
    ],
    0.009,
  ),
];
/** Ellipsoid-based head with full cheeks and a tiny integrated nose contour. */
export const roundedHeadGeometry = (() => {
  const geometry = new THREE.SphereGeometry(1, 32, 24);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const unitX = positions.getX(i),
      unitY = positions.getY(i),
      unitZ = positions.getZ(i);
    const y = unitY * 0.42;
    const cheek = 1 + 0.025 * Math.exp(-(((y + 0.1) / 0.16) ** 2));
    const x = unitX * 0.415 * cheek;
    let z = unitZ * 0.415 - 0.05;
    if (unitZ > 0) {
      z +=
        0.019 *
        Math.exp(-((x / 0.065) ** 2) - ((y + 0.045) / 0.055) ** 2) *
        unitZ;
      z +=
        0.006 *
        Math.exp(
          -(((Math.abs(x) - 0.18) / 0.11) ** 2) - ((y + 0.09) / 0.12) ** 2,
        ) *
        unitZ;
    }
    positions.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
})();
export const headbandGeometry = line(
  Array.from({ length: 29 }, (_, i) => {
    const a = (i / 28) * Math.PI;
    return [Math.cos(a) * 0.535, 0.03 + Math.sin(a) * 0.465, -0.045] as Point3;
  }),
  0.032,
);

/** One closed, thick mantle connects all layers into a full back silhouette. */
function hairMantle() {
  const rows = 28,
    columns = 36,
    positions: number[] = [],
    indices: number[] = [];
  const ringSize = columns + 1,
    surfaceSize = (rows + 1) * ringSize;
  for (let inner = 0; inner < 2; inner++)
    for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      const dome = Math.sin((Math.min(1, t / 0.35) * Math.PI) / 2);
      const width = 0.065 + 0.405 * dome - 0.018 * t;
      const depth = 0.055 + 0.28 * dome + 0.02 * Math.sin(t * Math.PI);
      for (let j = 0; j <= columns; j++) {
        const a = (j / columns) * Math.PI;
        const ripple = inner
          ? 0
          : 0.012 * Math.cos(a * 8 + t * 2) * Math.sin(Math.PI * t);
        const x = Math.cos(a) * Math.max(0.025, width - inner * 0.095 + ripple);
        const z =
          -0.065 - Math.sin(a) * Math.max(0.025, depth - inner * 0.09 + ripple);
        const y = 0.5 - t * 1.075 + Math.pow(t, 5) * 0.035 * Math.cos(a * 8);
        positions.push(x, y, z);
        if (i < rows && j < columns) {
          const k = inner * surfaceSize + i * ringSize + j;
          if (inner)
            indices.push(
              k,
              k + 1,
              k + ringSize,
              k + 1,
              k + ringSize + 1,
              k + ringSize,
            );
          else
            indices.push(
              k,
              k + ringSize,
              k + 1,
              k + 1,
              k + ringSize,
              k + ringSize + 1,
            );
        }
      }
    }
  // Close both sides and the crown/ends. No open strips or paper-thin edges.
  for (let i = 0; i < rows; i++)
    for (const j of [0, columns]) {
      const a = i * ringSize + j,
        b = a + ringSize,
        c = a + surfaceSize,
        d = b + surfaceSize;
      if (j === 0) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  for (const i of [0, rows])
    for (let j = 0; j < columns; j++) {
      const a = i * ringSize + j,
        b = a + 1,
        c = a + surfaceSize,
        d = b + surfaceSize;
      if (i === 0) indices.push(a, b, c, b, d, c);
      else indices.push(a, c, b, b, c, d);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
export const hairMantleGeometry = hairMantle();

// Close-fitting layers follow the skull before softly turning out at the ends.
export const frontHair = [-1, 1].flatMap((side) =>
  [0, 1].map((layer) => ({
    side,
    layer,
    geometry: hairLock(
      [
        [side * 0.012, 0.4 - layer * 0.025, 0.025 - layer * 0.04],
        [side * 0.12, 0.385 - layer * 0.035, 0.21 - layer * 0.035],
        [side * 0.23, 0.28 - layer * 0.04, 0.3 - layer * 0.035],
        [side * 0.33, 0.12 - layer * 0.04, 0.32 - layer * 0.035],
        [side * 0.42, 0.035 - layer * 0.04, 0.28 - layer * 0.03],
        [side * 0.49, 0.075 - layer * 0.04, 0.2 - layer * 0.03],
      ],
      0.105 - layer * 0.02,
      0.065 - layer * 0.01,
    ),
  })),
);
export const backHair = Array.from({ length: 5 }, (_, i) => {
  const x = (i - 2) * 0.15;
  return hairLock(
    [
      [x * 0.35, 0.3, -0.22],
      [x * 0.88, 0.07, -0.375],
      [x, -0.2, -0.4],
      [x * 1.08, -0.42 - Math.cos(i * 1.7) * 0.025, -0.35],
      [x * 1.25, -0.5 - Math.cos(i * 1.7) * 0.025, -0.28],
      [x * 1.3, -0.47 - Math.cos(i * 1.7) * 0.025, -0.22],
    ],
    0.11,
    0.055,
  );
});
export const backLayers = [-1, 1].map((side) =>
  hairLock(
    [
      [side * 0.33, 0.1, -0.18],
      [side * 0.425, -0.2, -0.24],
      [side * 0.455, -0.4, -0.16],
      [side * 0.53, -0.49, -0.075],
      [side * 0.56, -0.44, -0.015],
    ],
    0.085,
    0.065,
  ),
);
export const sideHair = [-1, 1].map((side) =>
  hairLock(
    [
      [side * 0.35, 0.2, 0.015],
      [side * 0.415, 0.01, -0.02],
      [side * 0.425, -0.24, -0.03],
      [side * 0.4, -0.43, 0.035],
      [side * 0.34, -0.46, 0.1],
    ],
    0.09,
    0.075,
  ),
);
