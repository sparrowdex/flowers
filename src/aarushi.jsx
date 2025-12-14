import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Custom animated background
const animatedBackgroundStyle = `
  @keyframes green-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .green-gradient-bg {
    background: linear-gradient(-45deg, #0f172a, #166534, #0f172a);
    background-size: 400% 400%;
    animation: green-gradient 30s ease infinite;
  }
`;

function Petal({ size, hueVariation }) {
  const { geometry, material } = useMemo(() => {
    // --- Petal Shape & Geometry ---
    const shape = new THREE.Shape();
    const halfWidth = size * 0.45;

    shape.moveTo(0, 0);
    shape.bezierCurveTo(
        -size * 0.05, size * 0.2,
        -halfWidth * 0.8, size * 0.6,
        -size * 0.05, size * 1.0
    );
    shape.bezierCurveTo(
        halfWidth * 0.8, size * 0.6,
        size * 0.05, size * 0.2,
        0, 0
    );

    const extrudeSettings = {
      depth: 0.02 * size,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
      curveSegments: 12
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // --- Petal Texture & Color Blending ---
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    
    gradient.addColorStop(0, `hsl(${20 + hueVariation}, 85%, 75%)`);
    gradient.addColorStop(0.6, `hsl(${16 + hueVariation}, 90%, 65%)`);
    gradient.addColorStop(0.8, `hsl(${12 + hueVariation}, 95%, 55%)`);
    gradient.addColorStop(1, `hsl(${10 + hueVariation + 5}, 70%, 40%)`); 
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    return { geometry: geom, material: mat };
  }, [size, hueVariation]);

  return <mesh geometry={geometry} material={material} />;
}

function Floret({ scale, openness, hueVariation }) {
  const petalCount = 5 + Math.floor(Math.random() * 2);

  // **START ANGULAR SPREAD LOGIC (288 degrees scoop)**
  const angularSpread = Math.PI * 1.6; 
  const angularStartOffset = -Math.PI * 0.8; 
  // **END ANGULAR SPREAD LOGIC**

  return (
    <group>
      {/* --- Central Base/Ovary (Small and dark green) --- */}
      <mesh position-y={0.0 * scale}> 
        <cylinderGeometry args={[0.05 * scale, 0.04 * scale, 0.08 * scale, 8]} /> 
        <meshStandardMaterial color={0x4a5a3a} roughness={0.7} metalness={0.05} /> 
      </mesh>

      {/* --- Petals --- */}
      {Array.from({ length: petalCount }).map((_, i) => {
        // **USE LIMITED ANGULAR SPREAD**
        const angle = (i / petalCount) * angularSpread + angularStartOffset;
        
        // **REVISED BASE TILT (Slightly cupped)**
        const baseTilt = Math.PI * (0.05 + (1 - openness) * 0.35); 
        
        return (
          <group
            key={i}
            // Petal position lifted Y (0.06)
            position={[Math.cos(angle) * 0.04 * scale, 0.06 * scale, Math.sin(angle) * 0.04 * scale]} 
            
            rotation={[
              baseTilt + (Math.random() - 0.5) * 0.08, 
              // Set yaw rotation
              angle + Math.PI / 2, 
              (Math.random() - 0.5) * 0.04
            ]}
          >
            {/* Rotate petal mesh by -90 degrees around X to make it stand up from the XY plane */}
            <group rotation={[-Math.PI / 2 + Math.sin(angle * 3) * 0.1, 0, 0]}>
              <Petal size={0.5 * scale} hueVariation={hueVariation} />
            </group>
          </group>
        );
      })}

      {/* --- Stamens --- */}
      {openness > 0.4 && Array.from({ length: 3 }).map((_, i) => {
        // **NEW STAMEN POSITIONING (Anchored and spread)**
        const stamenX = (i / 3 - 0.5) * 0.03 * scale; // Spread slightly left and right (X-axis)
        const stamenZ = 0.05 * scale; // Push forward (Z-axis)

        return (
          <group key={i}>
            <mesh
              // Fixed position relative to the floret, anchored forward
              position={[stamenX, 0.12 * scale, stamenZ]}
              rotation={[Math.PI / 2 + (Math.random() - 0.5) * 0.2 + Math.PI * 0.15, 0, 0]} 
            >
              <cylinderGeometry args={[0.008, 0.008, 0.2 * scale, 6]} />
              <meshStandardMaterial color={0xf4e4c1} roughness={0.5} />
              {/* Raised anther sphere slightly */}
              <mesh position-y={0.12 * scale}>
                <sphereGeometry args={[0.02 * scale, 8, 8]} />
                <meshStandardMaterial color={0xd4a356} roughness={0.4} />
              </mesh>
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Stem() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, 1.2, 0.02),
    new THREE.Vector3(-0.03, 2.5, -0.01),
    new THREE.Vector3(0.02, 3.8, 0.03),
    new THREE.Vector3(0, 5, 0)
  ]), []);

  const tubeGeometry = useMemo(() => {
    const tubePath = new THREE.CatmullRomCurve3(curve.getPoints(50));
    const geom = new THREE.TubeGeometry(tubePath, 50, 0.08, 12, false);
    return geom;
  }, [curve]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color={0x6b7a5c} roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

function Leaf({ length, width, angle, rotation }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(width * 0.4, length * 0.2, width * 0.5, length * 0.4);
    s.quadraticCurveTo(width * 0.45, length * 0.7, width * 0.2, length * 0.9);
    s.lineTo(0, length);
    s.lineTo(-width * 0.2, length * 0.9);
    s.quadraticCurveTo(-width * 0.45, length * 0.7, -width * 0.5, length * 0.4);
    s.quadraticCurveTo(-width * 0.4, length * 0.2, 0, 0);
    return s;
  }, [length, width]);

  const extrudeSettings = useMemo(() => ({
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2
  }), []);

  return (
    <mesh
      position={[Math.cos(rotation) * 0.1, 0.3 + Math.random() * 0.3, Math.sin(rotation) * 0.1]}
      rotation={[Math.sin(rotation) * 0.1, rotation, -angle]}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={0x6b7a5c} roughness={0.7} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Particles() {
  const ref = useRef();
  const count = 150;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#ffab73" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Gladiolus() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.02;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.7) * 0.01;
    }
  });

  const leaves = useMemo(() => [
    { length: 2.5, width: 0.15, angle: 0.3, rotation: 0 },
    { length: 2.8, width: 0.16, angle: 0.25, rotation: 2.1 },
    { length: 2.3, width: 0.14, angle: 0.35, rotation: 4.0 },
    { length: 2.0, width: 0.13, angle: 0.4, rotation: 1.2 },
    { length: 1.5, width: 0.11, angle: 0.3, rotation: 3.5 }
  ], []);
  
  const floretPositions = useMemo(() => [
    { y: 2.3, row: 0, scale: 1.1, openness: 1.0 },
    { y: 2.65, row: 1, scale: 1.05, openness: 0.95 },
    { y: 3.0, row: 0, scale: 1.0, openness: 0.9 },
    { y: 3.3, row: 1, scale: 0.95, openness: 0.85 },
    { y: 3.6, row: 0, scale: 0.88, openness: 0.75 },
    { y: 3.85, row: 1, scale: 0.82, openness: 0.65 },
    { y: 4.1, row: 0, scale: 0.75, openness: 0.5 },
    { y: 4.3, row: 1, scale: 0.68, openness: 0.35 },
    { y: 4.5, row: 0, scale: 0.6, openness: 0.2 },
    { y: 4.65, row: 1, scale: 0.5, openness: 0.1 },
    { y: 4.8, row: 0, scale: 0.4, openness: 0.05 },
    // **BUDS TO CLOSE THE TOP OF THE SPIKE**
    { y: 4.95, row: 1, scale: 0.3, openness: 0.01 }, 
    { y: 5.05, row: 0, scale: 0.2, openness: 0.01 }  
  ], []);

  return (
    <group ref={groupRef}>
      <Stem />
      {leaves.map((leaf, i) => <Leaf key={i} {...leaf} />)}
      {floretPositions.map((pos, index) => {
        const hueVariation = (Math.random() - 0.5) * 6;
        const stemRadius = 0.05;
        
        // **SECUND PLACEMENT LOGIC**
        const lateralOffset = (pos.row === 0 ? 1 : -1) * stemRadius * 1.5; 
        const forwardOffset = stemRadius * 0.8; 

        return (
          <group
            key={index}
            // Position restricted to the front, alternating left/right
            position={[lateralOffset, pos.y, forwardOffset]}
            rotation={[
                (Math.random() - 0.5) * 0.2, 
                // Rotate left or right slightly to emerge gracefully from the side
                (pos.row === 0 ? -Math.PI * 0.1 : Math.PI * 0.1) + (Math.random() - 0.5) * 0.3, 
                (Math.random() - 0.5) * 0.15
            ]}
          >
            <Floret scale={pos.scale} openness={pos.openness} hueVariation={hueVariation} />
          </group>
        );
      })}
    </group>
  );
}

export default function OrangeGladiolus() {
  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className="w-full h-screen green-gradient-bg">
        <Canvas
          camera={{ position: [3, 3, 6], fov: 45 }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 8, 4]}
            intensity={0.8}
            castShadow
          />
          <directionalLight position={[-3, 4, -3]} intensity={0.3} color={0xffa366} />
          <directionalLight position={[-2, 2, 4]} intensity={0.2} color={0xb3d9ff} />
          <group position-y={-2.5}>
            <Gladiolus />
          </group>
          <Particles />
          <OrbitControls />
        </Canvas>
      </div>
    </>
  );
}