import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- BACKGROUND STYLES (Kept from example) ---
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
`;

// --- SWEET PEA PETAL GEOMETRY & TEXTURE ---
// types: 'banner' (back), 'wing' (side), 'keel' (center boat)
function SweetPeaPetal({ type = 'banner', colorVariation = 0 }) {
  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();

    // 1. Define shapes based on petal type
    if (type === 'banner') {
      // Wide, heart-like top, narrow base
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.1, 0.2, 0.6, 0.5, 0.5, 1.0); // Right side up
      shape.bezierCurveTo(0.2, 1.15, -0.2, 1.15, -0.5, 1.0); // Top notch curve
      shape.bezierCurveTo(-0.6, 0.5, -0.1, 0.2, 0, 0); // Left side down
    } else if (type === 'wing') {
      // Asymmetric oval/kidney shape
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.1, 0.1, 0.4, 0.3, 0.35, 0.8);
      shape.bezierCurveTo(0.2, 1.0, -0.2, 0.9, -0.3, 0.6);
      shape.bezierCurveTo(-0.35, 0.3, -0.1, 0.05, 0, 0);
    } else { // keel
      // Sharper, boat-like shape
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.2, 0.4, 0.1, 0.8);
      shape.quadraticCurveTo(0, 0.9, -0.1, 0.8);
      shape.quadraticCurveTo(-0.2, 0.4, 0, 0);
    }

    const extrudeSettings = {
      depth: 0.005,
      bevelEnabled: false,
      curveSegments: 24
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, 0);

    // 2. Vertex Manipulation for 3D Form
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const ratio = Math.max(0, v3.y); // Normalize roughly 0 to 1 based on shape height

        let bendZ = 0;
        let bendX = 0;

        if (type === 'banner') {
            // Strong backward bend at the top
            bendZ = -Math.pow(ratio, 2) * 0.4;
             // Slight undulation
            bendZ += Math.sin(v3.x * 5) * 0.02 * ratio;
        } else if (type === 'wing') {
            // Gentle outward curve
             bendZ = Math.pow(ratio, 1.5) * 0.15;
             // Slight twist
             bendX = Math.sin(ratio * Math.PI) * 0.05 * (v3.x > 0 ? 1 : -1);
        } else if (type === 'keel') {
            // Deep cup/boat shape. Bends inwards strongly.
             bendZ = Math.pow(ratio, 0.8) * 0.25;
             // Pull sides in to form the boat "prow"
             bendX = (1.0 - ratio) * 0.1 * (v3.x > 0 ? -1 : 1);
        }

        pos.setZ(i, v3.z + bendZ);
        pos.setX(i, v3.x + bendX);
    }
    geo.computeVertexNormals();

    // 3. Magenta/Pink Gradient Texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Radial gradient for the characteristic lighter center/darker edges
    const gradient = ctx.createRadialGradient(128, 200, 20, 128, 128, 160);
    // Center base (lighter pink/whitish)
    gradient.addColorStop(0.0, `hsl(${320 + colorVariation}, 40%, 85%)`);
    // Mid-petal (vibrant pink)
    gradient.addColorStop(0.6, `hsl(${310 + colorVariation}, 70%, 60%)`);
    // Edges (deeper magenta/purple)
    gradient.addColorStop(1.0, `hsl(${300 + colorVariation}, 80%, 40%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle Veins
    ctx.strokeStyle = 'rgba(180, 60, 120, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<7; i++) {
       // Fan out from base
       const endX = 20 + i * 35;
       ctx.moveTo(128, 240);
       ctx.quadraticCurveTo(endX, 128, endX + (endX-128)*0.2, 10);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.center.set(0.5, 0.5);
    texture.rotation = type === 'banner' ? 0 : Math.PI; // Flip texture for wings/keel so base is bottom

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      color: '#ffffff',
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: true, // Helps with slight overlaps
    });

    return { geometry: geo, material: mat };
  }, [type, colorVariation]);

  return <mesh geometry={geometry} material={material} />;
}

// --- ASSEMBLED SWEET PEA FLOWER ---
function SweetPeaFlower({ scale = 1, hueVariation = 0 }) {
  return (
    <group scale={scale}>
      {/* Calyx (Green base cup) */}
      <mesh position={[0, 0.05, -0.02]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.05, 0.03, 0.1, 5, 1, true]} />
         <meshStandardMaterial color="#6b8c42" side={THREE.DoubleSide} />
      </mesh>
      {/* Sepal teeth */}
      {[0,1,2,3,4].map(i => (
          <mesh key={i} position={[0, 0.08, -0.02]} rotation={[0.3, i * Math.PI*0.4, 0]}>
             <coneGeometry args={[0.015, 0.1, 3]} />
             <meshStandardMaterial color="#6b8c42" />
          </mesh>
      ))}

      {/* --- Petals --- */}
      <group rotation={[-0.1, 0, 0]} position={[0, 0.1, 0]}>
        {/* 1. The Banner (Back, upright) */}
        <group position={[0, 0, 0.0]} rotation={[0.1, 0, 0]}>
           <SweetPeaPetal type="banner" colorVariation={hueVariation} />
        </group>

        {/* 2. The Wings (Sides, enclosing keel) */}
        <group position={[0.06, 0.05, 0.1]} rotation={[0.2, -0.4, 0.1]} scale={0.9}>
           <SweetPeaPetal type="wing" colorVariation={hueVariation} />
        </group>
        <group position={[-0.06, 0.05, 0.1]} rotation={[0.2, 0.4, -0.1]} scale={[-0.9, 0.9, 0.9]}>
           <SweetPeaPetal type="wing" colorVariation={hueVariation} />
        </group>

        {/* 3. The Keel (Center boat, fused) */}
        {/* We simulate the fused keel by placing two halves very close, rotated to face each other */}
        <group position={[0.01, 0.02, 0.15]} rotation={[0.3, -Math.PI/2 + 0.2, 0]} scale={0.7}>
             <SweetPeaPetal type="keel" colorVariation={hueVariation - 5} />
        </group>
        <group position={[-0.01, 0.02, 0.15]} rotation={[0.3, Math.PI/2 - 0.2, 0]} scale={0.7}>
             <SweetPeaPetal type="keel" colorVariation={hueVariation - 5} />
        </group>
      </group>
    </group>
  );
}

// --- STEMS & TENDRILS ---
function WiryStem({ points, thickness = 0.02 }) {
    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
    const geo = useMemo(() => new THREE.TubeGeometry(curve, 32, thickness, 8, false), [curve, thickness]);
    return (
        <mesh geometry={geo}>
            <meshStandardMaterial color="#557a46" roughness={0.8} />
        </mesh>
    );
}

function Tendril() {
    const points = useMemo(() => {
        const pts = [];
        // Start straight
        pts.push(new THREE.Vector3(0, 0, 0));
        pts.push(new THREE.Vector3(0.1, 0.2, 0));
        // Spiral section
        for(let i=0; i<15; i++) {
            const t = i/14;
            const angle = t * Math.PI * 6; // 3 full turns
            const radius = 0.05 + t * 0.02;
            pts.push(new THREE.Vector3(
                Math.cos(angle) * radius + 0.1,
                0.2 + t * 0.8,
                Math.sin(angle) * radius
            ));
        }
        // End hook
        pts.push(new THREE.Vector3(0.2, 1.1, 0.1));
        return pts;
    }, []);

    return <WiryStem points={points} thickness={0.008} />;
}

// --- LEAFLETS ---
function Leaflet() {
  const geometry = useMemo(() => {
      const shape = new THREE.Shape();
      // Elliptical shape
      shape.moveTo(0,0);
      shape.bezierCurveTo(0.2, 0.1, 0.3, 0.4, 0, 0.8);
      shape.bezierCurveTo(-0.3, 0.4, -0.2, 0.1, 0, 0);

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
      // Slight fold along the midrib
      const pos = geo.attributes.position;
      const v3 = new THREE.Vector3();
      for(let i=0; i<pos.count; i++){
         v3.fromBufferAttribute(pos, i);
         pos.setZ(i, v3.z + Math.abs(v3.x) * 0.1);
      }
      geo.computeVertexNormals();
      return geo;
  }, []);

  return (
      <mesh geometry={geometry}>
          <meshStandardMaterial color="#4a6e3a" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
  )
}

// --- COMPOUND LEAF SYSTEM (2 Leaflets + Tendril) ---
function SweetPeaLeafSystem({ position, rotation }) {
    return (
        <group position={position} rotation={rotation}>
            {/* Main petiole connecting to stem */}
            <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(0.2, 0.1, 0.1)]} thickness={0.015} />

            <group position={[0.2, 0.1, 0.1]}>
                {/* Leaflet 1 */}
                <group rotation={[0.2, 0.5, 0]} position={[0.05, 0, 0]}>
                   <Leaflet />
                   {/* Tiny stem for leaflet */}
                   <mesh position={[0, -0.05, 0]} rotation={[0,0,0.2]}>
                      <cylinderGeometry args={[0.008, 0.008, 0.1]} />
                      <meshStandardMaterial color="#557a46" />
                   </mesh>
                </group>
                {/* Leaflet 2 */}
                 <group rotation={[0.2, -0.5, 0]} position={[-0.05, 0, 0]} scale={[-1,1,1]}>
                   <Leaflet />
                    <mesh position={[0, -0.05, 0]} rotation={[0,0,-0.2]}>
                      <cylinderGeometry args={[0.008, 0.008, 0.1]} />
                      <meshStandardMaterial color="#557a46" />
                   </mesh>
                </group>
                {/* Terminal Tendril */}
                <group position={[0, 0.05, 0.05]} rotation={[-0.2, 0, 0]}>
                    <Tendril />
                </group>
            </group>
        </group>
    )
}


// --- MAIN PLANT STRUCTURE ---
function SweetPeaPlant() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle swaying
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 0.015;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.5) * 0.01;
    }
  });

  // Main stem path - wiry and slightly crooked
  const mainStemPoints = useMemo(() => [
    new THREE.Vector3(0, -2.5, 0),
    new THREE.Vector3(0.05, -1.0, 0.05),
    new THREE.Vector3(-0.05, 0.5, -0.05),
    new THREE.Vector3(0.02, 2.0, 0),
    new THREE.Vector3(-0.03, 3.5, 0.05),
    new THREE.Vector3(0, 4.2, 0)
  ], []);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <WiryStem points={mainStemPoints} thickness={0.03} />

      {/* --- Leaves at Nodes --- */}
      <SweetPeaLeafSystem position={[0.05, -1.0, 0.05]} rotation={[0, 0.5, 0.2]} />
      <SweetPeaLeafSystem position={[-0.05, 0.5, -0.05]} rotation={[0, -0.8, 0.1]} />
      <SweetPeaLeafSystem position={[0.02, 2.0, 0]} rotation={[0, 1.2, 0.3]} />

      {/* --- Flower Clusters (Peduncles) branching off main stem --- */}

      {/* Cluster 1 (Lower) */}
      <group position={[-0.05, 0.6, -0.05]} rotation={[0, -0.3, 0.4]}>
          {/* Peduncle stem */}
          <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(-0.3, 0.8, 0.2)]} thickness={0.015} />

          {/* Flowers on pedicels */}
          <group position={[-0.3, 0.8, 0.2]}>
               {/* Flower A */}
               <group position={[0.05, 0.1, 0]} rotation={[0.2, 0.5, 0]}>
                   <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(0, -0.2, 0)]} thickness={0.01} />
                   <SweetPeaFlower scale={1.2} hueVariation={-5} />
               </group>
                {/* Flower B */}
               <group position={[-0.1, -0.05, 0.1]} rotation={[0.1, -0.2, 0.1]}>
                    <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(0, -0.15, -0.05)]} thickness={0.01} />
                   <SweetPeaFlower scale={1.1} hueVariation={0} />
               </group>
          </group>
      </group>

      {/* Cluster 2 (Higher) */}
       <group position={[0.02, 2.1, 0]} rotation={[0, 0.8, 0.3]}>
          <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(0.4, 1.2, -0.3)]} thickness={0.015} />
          <group position={[0.4, 1.2, -0.3]}>
               <group position={[0, 0, 0]} rotation={[0.3, 0.1, 0]}>
                   <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(-0.05, -0.2, 0)]} thickness={0.01} />
                   <SweetPeaFlower scale={1.1} hueVariation={2} />
               </group>
               <group position={[0.15, -0.15, 0.05]} rotation={[0.1, 0.6, 0]}>
                    <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(0, -0.15, 0)]} thickness={0.01} />
                   <SweetPeaFlower scale={1.0} hueVariation={5} />
               </group>
                <group position={[-0.1, -0.3, -0.1]} rotation={[0.2, -0.4, 0.1]}>
                    <WiryStem points={[new THREE.Vector3(0,0,0), new THREE.Vector3(0.05, -0.15, 0)]} thickness={0.01} />
                   <SweetPeaFlower scale={0.9} hueVariation={8} />
               </group>
          </group>
      </group>

    </group>
  );
}

// --- MAIN APP COMPONENT ---
export default function SweetPeaApp({ onBack }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className={`w-full h-screen ${isDarkMode ? 'night-gradient-bg' : 'green-gradient-bg'}`} style={{position: 'relative', width: '100%', height: '100vh'}}>
        {/* UI Buttons (Optional based on your setup) */}
        {onBack && (
             <button
             onClick={onBack}
             style={{position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer'}}
           >
             ← Back
           </button>
        )}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer'}}
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        <Canvas
          camera={{ position: [0, 2, 8], fov: 45 }}
          shadows
        >
          <fog attach="fog" args={[isDarkMode ? '#020617' : '#0f172a', 10, 25]} />
          <ambientLight intensity={isDarkMode ? 0.4 : 0.6} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={isDarkMode ? 1.2 : 1.0}
            castShadow
            shadow-mapSize={[1024, 1024]}
            color="#ffe0d0"
          />
           <spotLight
                position={[-2, 5, 2]}
                angle={0.5}
                penumbra={1}
                intensity={isDarkMode ? 2 : 1.5}
                color="#ffaddf" // Pinkish fill light
                castShadow
            />
          {isDarkMode && <pointLight position={[0, 1, 3]} intensity={1} color="#eebbff" />}

          <Environment preset={isDarkMode ? "night" : "park"} blur={0.8} background={false} />

          <group position-y={-1}>
            <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3} floatingRange={[-0.1, 0.1]}>
                 <SweetPeaPlant />
            </Float>
          </group>

          <Sparkles count={80} scale={8} size={4} speed={0.3} opacity={0.5} color={isDarkMode ? "#ffaaee" : "#ffeeff"} />
          <Sparkles count={80} scale={8} size={1.5} speed={0.3} opacity={0.5} color={isDarkMode ? "#ffaaee" : "#ffeeff"} />
          <OrbitControls enableZoom={true} target={[0, 1.5, 0]} maxPolarAngle={Math.PI - 0.1} minDistance={3} maxDistance={15} />
        </Canvas>
      </div>
    </>
  );
}