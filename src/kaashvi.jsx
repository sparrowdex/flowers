import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// --- BACKGROUND ---
const animatedBackgroundStyle = `
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

// --- PETAL GEOMETRY GENERATOR ---
function OrchidPetal({ type = 'petal', width = 1, length = 1, colorVariation = 0, bend = 0.5 }) {
  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); 
    
    // --- SHAPE: CINCHED & FLARED ---
    if (type === 'petal') {
        shape.bezierCurveTo(width * 0.25, length * 0.3, width * 1.5, length * 0.75, 0, length); 
        shape.bezierCurveTo(-width * 1.5, length * 0.75, -width * 0.25, length * 0.3, 0, 0); 
    } else if (type === 'sepal') {
        shape.bezierCurveTo(width * 0.4, length * 0.2, width * 0.8, length * 0.7, 0, length * 1.1); 
        shape.bezierCurveTo(-width * 0.8, length * 0.7, -width * 0.4, length * 0.2, 0, 0); 
    } else {
        shape.bezierCurveTo(width, length * 0.5, width * 0.2, length, 0, length * 0.8);
        shape.bezierCurveTo(-width * 0.5, length, -width, length * 0.5, 0, 0);
    }

    const extrudeSettings = {
      depth: 0.02, 
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.02,
      bevelSegments: 5,
      curveSegments: 64
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, 0);

    // --- BENDING ---
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const ratio = Math.max(0, v3.y / length);
        
        if (type === 'petal') {
             const cup = Math.pow(ratio, 1.8) * (bend * 1.5); 
             pos.setZ(i, v3.z + cup); 
        } else if (type === 'sepal') {
             const recurve = Math.pow(ratio, 2) * (bend * 0.6);
             pos.setZ(i, v3.z - recurve);
        } else {
             pos.setZ(i, v3.z + Math.pow(ratio, 1.5) * bend);
        }
    }
    geo.computeVertexNormals();

    // --- TEXTURE: DEEP BLUE (Brightened Slightly) ---
    const canvas = document.createElement('canvas');
    canvas.width = 512; 
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(256, 100, 0, 256, 256, 550);
    
    if (type === 'lip') {
        gradient.addColorStop(0.0, `hsl(230, 90%, 20%)`); // Dark Indigo Center (Brightened from 15%)
        gradient.addColorStop(0.6, `hsl(240, 85%, 35%)`);  
        gradient.addColorStop(1.0, `hsl(250, 100%, 50%)`); 
    } else {
        // Brightened the center slightly so it doesn't look like a black hole
        gradient.addColorStop(0.0, `hsl(220, 90%, 15%)`); 
        gradient.addColorStop(0.3, `hsl(215, 95%, 30%)`);  
        gradient.addColorStop(0.7, `hsl(${210 + colorVariation}, 90%, 55%)`); 
        gradient.addColorStop(1.0, `hsl(${200 + colorVariation}, 100%, 70%)`); // Very bright tips
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Noise
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20; 
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Veins (Lighter for contrast)
    if (type !== 'lip') {
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.25)'; 
        ctx.lineWidth = 3;
        for(let i=0; i<20; i++) {
            ctx.beginPath();
            ctx.moveTo(256, 0);
            ctx.bezierCurveTo(256 + (i-10)*70, 150, 256 + (i-10)*90, 350, 256 + (i-10)*50, 512);
            ctx.stroke();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);

    // --- MATERIAL: SUBTLE GLOW RESTORED ---
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      color: '#ffffff',
      // FIX: Added a very faint deep blue emissive glow. 
      // This prevents the flower from looking "dead" or black in shadows.
      emissive: '#111133', 
      emissiveIntensity: 0.4, 
      roughness: 0.3, 
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [width, length, colorVariation, bend, type]);

  return <mesh geometry={geometry} material={material} />;
}

// --- COLUMN (WHITE CENTER) ---
function Column() {
    return (
        <group rotation={[Math.PI/2, 0, 0]} position={[0, 0.05, 0.1]}>
             {/* Base: Creamy Yellow/White */}
             <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.15, 8]} />
                <meshStandardMaterial color="#fefce8" emissive="#555555" emissiveIntensity={0.2} roughness={0.3} /> 
             </mesh>
             {/* Tip: Bright White */}
             <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#aaaaaa" emissiveIntensity={0.5} roughness={0.1} />
             </mesh>
        </group>
    );
}

function OrchidFlower({ scale, openness, hueVariation }) {
  if (openness < 0.2) {
    return (
        <group scale={scale}>
             <mesh position={[0, 0.2, 0]}>
                 <sphereGeometry args={[0.18, 12, 12]} />
                 <meshStandardMaterial color="#1e40af" roughness={0.2} />
             </mesh>
             <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.03, 0.3]} />
                <meshStandardMaterial color="#365314" />
             </mesh>
        </group>
    )
  }

  return (
    <group scale={scale}>
      <mesh position={[0, 0, -0.1]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
         <meshStandardMaterial color="#365314" roughness={0.8} />
      </mesh>

      <group rotation={[-0.2, 0, 0]}> 
          <Column />

          {/* SEPALS */}
          <group rotation={[Math.PI/2 - 0.2, 0, 0]} position={[0, 0.1, -0.05]}>
             <OrchidPetal type="sepal" width={0.4} length={0.75} colorVariation={hueVariation} bend={0.4} />
          </group>
          <group rotation={[0, 0, (2 * Math.PI) / 3 + 0.2]}> 
             <group rotation={[Math.PI/2 - 0.2, 0, 0]} position={[0, 0.1, -0.05]}>
                <OrchidPetal type="sepal" width={0.38} length={0.75} colorVariation={hueVariation} bend={0.4} />
             </group>
          </group>
          <group rotation={[0, 0, (4 * Math.PI) / 3 - 0.2]}> 
             <group rotation={[Math.PI/2 - 0.2, 0, 0]} position={[0, 0.1, -0.05]}>
                <OrchidPetal type="sepal" width={0.38} length={0.75} colorVariation={hueVariation} bend={0.4} />
             </group>
          </group>

          {/* PETALS */}
          <group rotation={[0, 0, -1.6]}> 
             <group rotation={[Math.PI/2, 0, 0]} position={[0, 0.05, 0.02]}>
                <OrchidPetal type="petal" width={0.65} length={0.8} colorVariation={hueVariation} bend={0.6} />
             </group>
          </group>
          <group rotation={[0, 0, 1.6]}> 
             <group rotation={[Math.PI/2, 0, 0]} position={[0, 0.05, 0.02]}>
                <OrchidPetal type="petal" width={0.65} length={0.8} colorVariation={hueVariation} bend={0.6} />
             </group>
          </group>

          {/* LIP */}
          <group rotation={[0, 0, Math.PI]}> 
             <group rotation={[Math.PI/2 + 0.4, 0, 0]} position={[0, 0.1, 0.25]}>
                <OrchidPetal type="lip" width={0.25} length={0.35} colorVariation={hueVariation} bend={0.9} />
             </group>
          </group>
      </group>
    </group>
  );
}

// --- STEM ---
function Stem({ curve }) {
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 128, 0.045, 16, false); 
  }, [curve]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color="#365314" roughness={0.7} />
    </mesh>
  );
}

// --- BASAL LEAVES ---
function BasalLeaf({ rotation, scale }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.6, 0.2, 0.9, 1.0, 0, 2.2); 
    s.bezierCurveTo(-0.9, 1.0, -0.6, 0.2, 0, 0);
    return s;
  }, []);

  const geometry = useMemo(() => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.02, bevelSegments: 3 });
      const pos = geo.attributes.position;
      const v3 = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const ratio = v3.y / 2.2;
        pos.setZ(i, v3.z - Math.pow(ratio, 1.8) * 1.2); 
      }
      geo.computeVertexNormals();
      return geo;
  }, [shape]);

  return (
    <group position={[0, -0.1, 0]} rotation={[0, rotation, 0]}>
        <mesh geometry={geometry} rotation={[1.1, 0, 0]} scale={scale}>
            <meshStandardMaterial color="#1a2e05" roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
    </group>
  );
}

function OrchidPlant() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.005;
    }
  });

  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 2.0, 0),    
    new THREE.Vector3(0.1, 3.5, 0),  
    new THREE.Vector3(0.5, 4.5, 0.3), 
    new THREE.Vector3(1.5, 5.0, 1.0), 
    new THREE.Vector3(2.5, 4.2, 1.5)  
  ]), []);

  const flowerPositions = useMemo(() => {
     const arr = [];
     const startPercent = 0.45; 
     const numFlowers = 6;
     
     for(let i=0; i<numFlowers; i++) {
        const t = startPercent + (i / numFlowers) * 0.53;
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        
        arr.push({
            pos: point,
            scale: 0.75 - (i * 0.04),
            openness: Math.max(0.3, 1.0 - (i * 0.1)),
            rotY: (i % 2 === 0 ? 0.6 : -0.6) 
        });
     }
     return arr;
  }, [curve]);

  return (
    <group ref={groupRef} position={[0, -2.0, 0]}>
      <Stem curve={curve} />
      
      <BasalLeaf rotation={0} scale={1} />
      <BasalLeaf rotation={2.5} scale={0.9} />
      <BasalLeaf rotation={-2.5} scale={1.1} />

      {flowerPositions.map((data, index) => {
        const hueVariation = (Math.random() - 0.5) * 10;
        return (
          <group key={index} position={[data.pos.x, data.pos.y, data.pos.z]}>
             <group rotation={[0, data.rotY, -0.4]}> 
                <group rotation={[0, Math.PI/2, 0]}> 
                    <OrchidFlower scale={data.scale} openness={data.openness} hueVariation={hueVariation} />
                </group>
             </group>
          </group>
        );
      })}
    </group>
  );
}

export default function PerfectBlueOrchid({ onBack }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className={`w-full h-screen ${isDarkMode ? 'night-gradient-bg' : 'green-gradient-bg'}`}>
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <Canvas
          camera={{ position: [1, 3, 11], fov: 35 }}
          shadows
        >
          {/* 1. BRIGHTER AMBIENT LIGHT: Lifts the overall darkness */}
          <ambientLight intensity={0.8} color="#666699" />
          
          <spotLight 
            position={[10, 8, 5]} 
            angle={0.3} 
            penumbra={0.5} 
            intensity={3} 
            castShadow 
            shadow-bias={-0.0001}
            color="#ffffff"
          />
          
          <spotLight 
            position={[-5, 5, -5]} 
            intensity={5} 
            color="#3b82f6" 
          />

          {/* 2. BRIGHTER FILL LIGHT: Illuminates the face of the flowers */}
          <pointLight position={[0, 2, 5]} intensity={1.5} color="#dbeafe" />

          <group position-y={-0.5}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                 <OrchidPlant />
            </Float>
          </group>
          
          <Sparkles count={60} scale={10} size={6} speed={0.4} opacity={0.6} color="#60a5fa" />
          
          <OrbitControls enableZoom={true} target={[0, 2, 0]} maxPolarAngle={Math.PI - 0.2} />
        </Canvas>
      </div>
    </>
  );
}