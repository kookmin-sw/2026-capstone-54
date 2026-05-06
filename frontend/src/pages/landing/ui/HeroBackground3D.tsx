import { useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MarchingCube, MarchingCubes } from "@react-three/drei";
import type { Group } from "three";

const BLOB_COUNT = 7;

const BLOB_AXES: Array<{
  ax: number;
  ay: number;
  az: number;
  fx: number;
  fy: number;
  fz: number;
  px: number;
  py: number;
  pz: number;
}> = [
  { ax: 0.42, ay: 0.38, az: 0.20, fx: 0.36, fy: 0.45, fz: 0.31, px: 0.0, py: 0.0, pz: 0.0 },
  { ax: 0.36, ay: 0.42, az: 0.18, fx: 0.51, fy: 0.33, fz: 0.27, px: 1.27, py: 2.4, pz: 0.9 },
  { ax: 0.40, ay: 0.34, az: 0.22, fx: 0.44, fy: 0.39, fz: 0.35, px: 2.54, py: 0.6, pz: 1.8 },
  { ax: 0.32, ay: 0.40, az: 0.24, fx: 0.29, fy: 0.55, fz: 0.40, px: 3.81, py: 3.0, pz: 0.4 },
  { ax: 0.44, ay: 0.30, az: 0.16, fx: 0.62, fy: 0.28, fz: 0.23, px: 5.08, py: 1.2, pz: 2.7 },
  { ax: 0.30, ay: 0.45, az: 0.20, fx: 0.40, fy: 0.48, fz: 0.32, px: 0.85, py: 4.2, pz: 1.5 },
  { ax: 0.38, ay: 0.32, az: 0.26, fx: 0.55, fy: 0.36, fz: 0.29, px: 4.45, py: 5.4, pz: 0.6 },
];

function CameraRig() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(0.5, 0.5, 0.5);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function Metaballs() {
  const cubeRefs = useRef<(Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < BLOB_COUNT; i++) {
      const cube = cubeRefs.current[i];
      if (!cube) continue;
      const a = BLOB_AXES[i];
      cube.position.set(
        0.5 + Math.sin(t * a.fx + a.px) * a.ax,
        0.5 + Math.cos(t * a.fy + a.py) * a.ay,
        0.5 + Math.sin(t * a.fz + a.pz) * a.az,
      );
    }
  });

  return (
    <MarchingCubes
      resolution={64}
      maxPolyCount={28000}
      enableUvs={false}
      enableColors={false}
    >
      <meshStandardMaterial
        color="#22D3EE"
        emissive="#0991B2"
        emissiveIntensity={0.45}
        roughness={0.32}
        metalness={0.18}
        transparent
        opacity={0.85}
      />
      {Array.from({ length: BLOB_COUNT }).map((_, i) => (
        <MarchingCube
          key={i}
          ref={(node) => {
            cubeRefs.current[i] = node;
          }}
          strength={0.30}
          subtract={8}
        />
      ))}
    </MarchingCubes>
  );
}

export default function HeroBackground3D() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0.5, 0.5, 2.4], fov: 48 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <CameraRig />
      <ambientLight intensity={0.7} />
      <pointLight position={[2.4, 2.4, 2.4]} intensity={1.6} color="#0991B2" />
      <pointLight position={[-2.0, -1.2, 2.0]} intensity={1.0} color="#06B6D4" />
      <pointLight position={[0.5, 0.5, -1.0]} intensity={0.5} color="#67E8F9" />
      <Metaballs />
    </Canvas>
  );
}
