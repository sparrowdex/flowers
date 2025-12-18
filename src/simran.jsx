import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ---------- 1. WIDER PETAL WITH BOLD PICOTEE TIPS ----------

function Petal({ size, hueVariation, isInner, darkerTip = false }) {
  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();
    // Wide fan shape
    const width = size * 1.5;
    const height = size * 1.2;

    // Drawing from Pivot (0,0)
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(width * 0.3, height * 0.1, width * 0.5, height * 0.5);
    shape.quadraticCurveTo(width * 0.6, height * 0.9, 0, height);
    shape.quadraticCurveTo(-width * 0.6, height * 0.9, -width * 0.5, height * 0.5);
    shape.quadraticCurveTo(-width * 0.3, height * 0.1, 0, 0);

    const extrudeSettings = {
      depth: 0.005 * size,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 12
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Ruffles
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const ratio = y / height;
      if (ratio > 0.4) {
        const noise = Math.sin(y * 40 + i) * 0.07 * size * ratio;
        const wave = Math.cos(pos.getX(i) * 25) * 0.05 * size * ratio;
        pos.setX(i, pos.getX(i) + noise);
        pos.setZ(i, pos.getZ(i) + wave);
      }
    }
    geom.translate(0, 0, -0.0025 * size);
    geom.computeVertexNormals();

    // --- TEXTURE: BOLD PICOTEE FIX ---
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);

    const baseHue = 350 + hueVariation;

    if (isInner) {
      // "PICOTEE" LOOK:
      // We make the tip DARKER and WIDER so it doesn't look white.

      // 1. THE SERRATIONS (0% - 25%):
      // Vibrant Red/Pink Tip (Saturated to stand out against white)
      const tipHue = darkerTip ? baseHue - 20 : baseHue;
      gradient.addColorStop(0, `hsl(${tipHue}, 100%, 50%)`);
      // Keep color solid for a bit so the very edge is clearly colored
      gradient.addColorStop(0.15, `hsl(${tipHue}, 100%, 60%)`);

      // 2. THE BODY (25% - 60%):
      // Transition to White
      gradient.addColorStop(0.25, 'white');
      gradient.addColorStop(0.6, 'white');

      // 3. THE BASE (100%):
      // Dark red stem connection
      gradient.addColorStop(1, `hsl(${baseHue - 10}, 100%, 30%)`);
    } else {
      // Outer petals: Standard full pink/red gradient
      gradient.addColorStop(0, `hsl(${baseHue}, 90%, 85%)`); 
      gradient.addColorStop(1, `hsl(${baseHue - 10}, 100%, 35%)`); 
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    return { geometry: geom, material: mat };
  }, [size, hueVariation, isInner, darkerTip]);

  return <mesh geometry={geometry} material={material} />;
}

// ---------- 2. STEM & LEAVES (Unchanged) ----------

function Stem() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -2.5, 0),
        new THREE.Vector3(0.05, -1.0, 0.05),
        new THREE.Vector3(-0.02, 0.5, -0.02),
        new THREE.Vector3(0, 2.0, 0)
      ]),
    []
  );

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.07, 8, false);
  }, [curve]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color="#4a5a3a" roughness={0.8} />
    </mesh>
  );
}

function Leaf({ y, rot, scale = 1 }) {
  const { geometry } = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.25; 
    const l = 1.0;
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(w, l * 0.3, 0, l); 
    shape.quadraticCurveTo(-w, l * 0.3, 0, 0);

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
    geom.translate(0, 0, 0);
    const pos = geom.attributes.position;
    for(let i=0; i<pos.count; i++){
        const yVal = pos.getY(i);
        const bend = Math.pow(yVal, 1.5) * 0.3;
        pos.setZ(i, pos.getZ(i) - bend);
    }
    geom.computeVertexNormals();
    return { geometry: geom };
  }, []);

  return (
    <mesh position={[0, y, 0]} rotation={[0.6, rot, 0]} geometry={geometry} scale={scale}>
      <meshStandardMaterial color="#4a5a3a" side={THREE.DoubleSide} />
    </mesh>
  );
}

// ---------- 3. CARNATION HEAD (Selective Mix Logic) ----------

function CarnationHead({ scale, hueVariation }) {
  const totalPetals = 150;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  const calyxMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 128); // vertical gradient
    gradient.addColorStop(0, 'hsl(350, 100%, 70%)'); // bottom, brighter pink
    gradient.addColorStop(0.5, 'hsl(350, 80%, 75%)'); // middle, transition
    gradient.addColorStop(1, '#4a5a3a'); // top, lighter green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
    });
  }, []);

  const petals = useMemo(() => {
    return Array.from({ length: totalPetals }).map((_, i) => {
      const t = i / totalPetals; 
      
      // --- SELECTIVE MIXING LOGIC ---
      // We want distinct petals, not a white blob.
      // If it's near the top (t < 0.35):
      // 60% chance it is "Inner" (White with Red Tip)
      // 40% chance it is "Outer" (Solid Red/Pink)
      // This contrast makes the white petals distinct.
      const isInnerPetal = t < 0.35 && Math.random() > 0.4;

      const theta = i * goldenAngle;
      const phi = t * 2.2; 

      const radius = 0.15 * scale;
      vec.setFromSphericalCoords(radius, phi, theta);
      const x = vec.x;
      const y = vec.y + ((1 - t) * 0.15 * scale); 
      const z = vec.z;

      dummy.position.set(x, y, z);
      target.set(x * 2, 10, z * 2); 
      dummy.lookAt(target);

      const wiggle = (Math.random() - 0.5) * (isInnerPetal ? 1.2 : 0.6);

      return {
        position: [x, y, z],
        rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
        tiltBack: isInnerPetal ? (Math.random() > 0.5 ? 1 : -1) * t * 1.3 : t * 1.3,
        wiggle: wiggle,
        size: (0.2 + t * 0.25) * scale,
        hue: hueVariation + (Math.random() * 15 - 7.5),
        isInner: isInnerPetal,
        darkerTip: isInnerPetal && Math.random() > 0.5
      };
    });
  }, [scale, hueVariation, dummy, vec, target]);

  return (
    <group>
      {/* Calyx - Funnel shaped */}
      <group position-y={-0.1 * scale}>
        <mesh position-y={0.1 * scale}>
           <cylinderGeometry args={[0.12 * scale, 0.03 * scale, 0.6 * scale, 12]} />
           <primitive object={calyxMaterial} attach="material" />
        </mesh>
      </group>

      {/* Petals */}
      <group position-y={0.3 * scale}>
        {petals.map((p, k) => (
          <group key={k} position={p.position} rotation={p.rotation}>
             <group rotation-x={p.tiltBack * 2.0}>
                 <group rotation-z={p.wiggle}>
                    <Petal size={p.size} hueVariation={p.hue} isInner={p.isInner} darkerTip={p.darkerTip} />
                 </group>
             </group>
          </group>
        ))}
      </group>
    </group>
  );
}

// ---------- 4. SCENE ----------

function PinkCarnation() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Stem />
      <Leaf y={-1.2} rot={0} scale={1.2} />
      <Leaf y={-0.4} rot={2.5} scale={1.0} />
      <Leaf y={0.5} rot={4.0} scale={0.8} />
      <group position={[0, 2.0, 0]}>
        <CarnationHead scale={1.3} hueVariation={0} />
      </group>

    </group>
  );
}

function SparklesComponent() {
  return (
    <Sparkles count={40} scale={10} size={3} speed={0.4} opacity={0.4} color="#60a5fa" />
  );
}

export default function PinkCarnationScene() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <>
      <style>{`
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
        @keyframes night-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .night-gradient-bg {
          background: linear-gradient(-45deg, #020617, #0f172a, #172554);
          background-size: 400% 400%;
          animation: night-gradient 30s ease infinite;
        }
      `}</style>
      <div className={`w-full h-screen ${isDarkMode ? 'night-gradient-bg' : 'green-gradient-bg'}`}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <Canvas camera={{ position: [3, 4, 7], fov: 40 }} shadows>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 2, -5]} intensity={0.5} color="#ffd1dc" />

          <group position={[0, -1.0, 0]}>
            <PinkCarnation />
          </group>

          <SparklesComponent />
          <OrbitControls target={[0, 1.5, 0]} />
        </Canvas>
      </div>
    </>
  );
}
