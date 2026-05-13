import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { useReducedMotion } from "@/shared/lib/animation";

interface NodeMeta {
  position: [number, number, number];
  size: [number, number, number];
  delay: number;
}

const NODES: NodeMeta[] = [
  { position: [-1.6, 0.6, 0], size: [0.7, 0.45, 0.18], delay: 0 },
  { position: [0, 0, 0.1], size: [0.85, 0.55, 0.22], delay: 0.4 },
  { position: [1.6, -0.6, 0], size: [0.7, 0.45, 0.18], delay: 0.8 },
];

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function Node({
  position,
  size,
  index,
}: NodeMeta & { index: number }) {
  const meshRef = useRef<Mesh | null>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * 1.6 + index * 1.4) * 0.08 + 1;
    mesh.scale.set(pulse, pulse, pulse);
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.4}>
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.08}
        smoothness={4}
        position={position}
      >
        <meshStandardMaterial
          color="#0A0A0A"
          emissive={index === 1 ? "#0991B2" : "#06B6D4"}
          emissiveIntensity={index === 1 ? 0.45 : 0.28}
          roughness={0.32}
          metalness={0.55}
        />
      </RoundedBox>
    </Float>
  );
}

function ConnectionLine({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const groupRef = useRef<Group | null>(null);

  const segments = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => i / (count - 1));
  }, []);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.children.forEach((child, i) => {
      const phase = (t * 0.6 + i / segments.length) % 1;
      const mat = (child as Mesh).material as { opacity: number };
      mat.opacity = 0.15 + Math.max(0, 0.7 - phase * 1.4);
    });
  });

  return (
    <group ref={groupRef}>
      {segments.map((tParam, i) => {
        const x = from[0] + (to[0] - from[0]) * tParam;
        const y = from[1] + (to[1] - from[1]) * tParam;
        const z = from[2] + (to[2] - from[2]) * tParam;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={0.7}
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function HowToScene3D() {
  const reduced = useReducedMotion();

  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0.2, 3.6], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      frameloop={reduced ? "demand" : "always"}
    >
      <CameraRig />
      <ambientLight intensity={0.6} />
      <pointLight position={[2.4, 2.4, 2.4]} intensity={1.4} color="#0991B2" />
      <pointLight position={[-2.0, -1.5, 2.0]} intensity={0.9} color="#06B6D4" />
      <pointLight position={[0, 0, -1.5]} intensity={0.5} color="#22D3EE" />

      {NODES.map((node, i) => (
        <Node key={i} index={i} {...node} />
      ))}

      <ConnectionLine from={NODES[0].position} to={NODES[1].position} />
      <ConnectionLine from={NODES[1].position} to={NODES[2].position} />
    </Canvas>
  );
}
