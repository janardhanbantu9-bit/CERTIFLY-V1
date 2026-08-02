"use client";
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function Particles({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 1400;
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#a855f7"),
      new THREE.Color("#ec4899"),
      new THREE.Color("#3b82f6"),
      new THREE.Color("#c084fc"),
    ];
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.04;
    ref.current.rotation.x += dt * 0.01;
    const target = mouse.current;
    ref.current.rotation.y += (target.x * 0.3 - ref.current.rotation.y * 0) * 0.02;
    ref.current.rotation.x += (target.y * 0.2 - ref.current.rotation.x * 0) * 0.02;
    const t = state.clock.elapsedTime;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    // subtle breathing
    ref.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.03);
    void arr;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingCert({
  position,
  color,
  rotation,
}: {
  position: [number, number, number];
  color: string;
  rotation: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.3;
    ref.current.rotation.x = rotation[0] + Math.cos(t * 0.4) * 0.15;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={ref} position={position} rotation={rotation} castShadow>
        <boxGeometry args={[3, 2.1, 0.06]} />
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.25}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

function Medal({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <mesh position={position}>
        <torusGeometry args={[0.7, 0.22, 32, 64]} />
        <meshStandardMaterial color="#e0b45c" metalness={1} roughness={0.15} emissive="#e0b45c" emissiveIntensity={0.2} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onPointerMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }}
    >
      <Canvas dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={55} />
        <ambientLight intensity={0.5} />
        <pointLight position={[6, 6, 6]} intensity={1.4} color="#c084fc" />
        <pointLight position={[-6, -3, 4]} intensity={1.2} color="#ec4899" />
        <pointLight position={[0, -5, 3]} intensity={0.8} color="#3b82f6" />
        <Suspense fallback={null}>
          <Particles mouse={mouse} />
          <FloatingCert position={[-2.6, 0.8, -1]} rotation={[0.15, 0.4, -0.1]} color="#7c3aed" />
          <FloatingCert position={[2.6, -0.5, -1.5]} rotation={[-0.1, -0.5, 0.08]} color="#ec4899" />
          <FloatingCert position={[0, 1.5, -3]} rotation={[0.05, 0.1, 0]} color="#3b82f6" />
          <Medal position={[0, -1.4, 1]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
