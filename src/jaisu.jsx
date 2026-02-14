import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Float, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- 1. THE JELLY HEART SHAPE ---
const heartShape = new THREE.Shape();
heartShape.moveTo(0, 0);
heartShape.bezierCurveTo(0, 0.5, -1, 1, -1, 2);
heartShape.bezierCurveTo(-1, 3, 0, 3.5, 0, 1.5); 
heartShape.bezierCurveTo(0, 3.5, 1, 3, 1, 2);
heartShape.bezierCurveTo(1, 1, 0, 0.5, 0, 0);

// --- 2. RUFFLED ROSE PETAL (2D Shape + Vertex Manipulation) ---
function RosePetal({ index, total, size = 1 }) {
  const meshRef = useRef();

  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();
    // A rounded, "teardrop" base for a classic rose petal
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.6, 0.1, 1.2, 0.8, 0, 1.8);
    shape.bezierCurveTo(-1.2, 0.8, -0.6, 0.1, 0, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.01,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.02,
      bevelSegments: 3
    });

    // --- VERTEX MANIPULATION (The Secret Sauce) ---
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    const bendFactor = (index / total) * 1.5; // Outer petals bend more

    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const ratio = v3.y / 1.8;
      
      // 1. CUPPING: Curve the petal inward along the X-axis
      const cup = Math.pow(Math.abs(v3.x), 2) * 0.4;
      
      // 2. BENDING: Curl the tip outward/backward
      const bend = Math.pow(ratio, 2.5) * bendFactor;
      
      // 3. RUFFLES: Edge noise based on a sine wave
      const ruffle = Math.sin(v3.x * 10) * 0.05 * ratio;

      pos.setZ(i, v3.z + cup - bend + ruffle);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color: "#fff5f7", // Light pinkish base
      emissive: "#ffb6c1",
      emissiveIntensity: 0.2,
      roughness: 0.2,
      clearcoat: 1,
      sheen: 1,
      sheenColor: "#ffffff",
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [index, total]);

  // Distribution: Fibonacci Spiral (Phyllotaxis)
  const phi = index * 137.5 * (Math.PI / 180);
  const radius = Math.sqrt(index) * 0.12;
  const yPos = index * 0.04;
  const tilt = (index / total) * 1.6;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[Math.cos(phi) * radius, yPos, Math.sin(phi) * radius]}
      rotation={[tilt, -phi, 0]}
      scale={size}
    />
  );
}

// --- 3. FLOATING JELLY HEARTS ---
function JellyHearts({ count = 18 }) {
  const hearts = useMemo(() => Array.from({ length: count }).map(() => ({
    position: [Math.random() * 12 - 6, Math.random() * 10 - 2, Math.random() * 10 - 12],
    scale: Math.random() * 0.2 + 0.15,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
  })), [count]);

  return (
    <group>
      {hearts.map((h, i) => (
        <Float key={i} speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
          <mesh position={h.position} rotation={h.rotation} scale={h.scale}>
            <extrudeGeometry args={[heartShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2 }]} />
            <meshPhysicalMaterial
              color="#ff4d6d"
              transmission={1} 
              thickness={2.5}    
              roughness={0.02}    
              ior={1.4}        
              clearcoat={1}
              emissive="#ff85a1"
              emissiveIntensity={0.2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function HeartBloomScene() {
  const totalPetals = 50;

  return (
    <div 
      className="w-full h-screen" 
      style={{ background: 'radial-gradient(circle, #4a0e1c 0%, #120407 100%)' }}
    >
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 14]} fov={35} />
        
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 20, 10]} intensity={2.5} color="#fff" />
        <pointLight position={[-10, 5, 10]} intensity={1.5} color="#ffb6c1" />
        
        <Environment preset="studio" />

        <group position={[0, -2.5, 0]}>
          {/* Stem */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 5, 12]} />
            <meshStandardMaterial color="#1a2e12" roughness={0.9} />
          </mesh>

          {/* Rose Head */}
          <group position={[0, 4, 0]}>
            {[...Array(totalPetals)].map((_, i) => (
              <RosePetal key={i} index={i} total={totalPetals} size={0.8 + (i/totalPetals) * 0.5} />
            ))}
          </group>
        </group>

        <JellyHearts />
        
        {/* Sparkles boosted for dark background */}
        <Sparkles count={100} scale={15} size={4} speed={0.4} color="#fff" />
        
        <OrbitControls makeDefault target={[0, 2, 0]} />
      </Canvas>
    </div>
  );
}