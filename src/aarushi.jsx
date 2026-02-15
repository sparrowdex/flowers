
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// --- BACKGROUND ---
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

// --- NEW RUFFLED PETAL GEOMETRY (From Wireframe Design) ---
function Petal({ width = 1, length = 1, colorVariation = 0, bend = 0.5 }) {
  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Wider, Fan-like shape for the "Full Flower" look
    shape.moveTo(0, 0); 
    // Much wider curve to ensure overlap and volume
    shape.bezierCurveTo(width * 0.5, length * 0.2, width * 1.5, length * 0.6, 0, length); 
    shape.bezierCurveTo(-width * 1.5, length * 0.6, -width * 0.5, length * 0.2, 0, 0); 

    const extrudeSettings = {
      depth: 0.005, 
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.01,
      bevelSegments: 3,
      curveSegments: 32 // High res for smooth ruffles
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, 0);

    // --- VERTEX MANIPULATION: RUFFLES & BEND ---
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        
        // Ratio: 0 at base, 1 at tip
        const ratio = Math.max(0, v3.y / length);
        
        // 1. BACKWARD CURL (Trumpet shape)
        const curve = Math.pow(ratio, 2.2) * bend; 
        
        // 2. RUFFLES (Sine wave along the X-axis)
        // Amplitude increases towards the tip
        const ruffle = Math.sin(v3.x * 8) * 0.08 * ratio;

        // Apply transformations
        pos.setZ(i, v3.z - curve + ruffle);
        // Compress Y slightly to account for curl
        pos.setY(i, v3.y - (curve * 0.3)); 
    }
    geo.computeVertexNormals();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    // Darker Orange Gradient
    gradient.addColorStop(0.0, `hsl(${5 + colorVariation}, 100%, 35%)`);  
    gradient.addColorStop(0.5, `hsl(${20 + colorVariation}, 100%, 50%)`); 
    gradient.addColorStop(1.0, `hsl(${35 + colorVariation}, 100%, 75%)`); 
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Soft Veins
    ctx.strokeStyle = 'rgba(120, 20, 0, 0.2)';
    ctx.lineWidth = 1;
    for(let i=0; i<12; i++) {
        ctx.beginPath();
        ctx.moveTo(128, 0);
        ctx.quadraticCurveTo(128 + (i-6)*40, 128, 128 + (i-6)*15, 256);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      color: '#ffefe0', 
      roughness: 0.6, 
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [width, length, colorVariation, bend]);

  return <mesh geometry={geometry} material={material} />;
}

// --- STAMEN CLUSTER (Z-Axis Aligned) ---
function StamenCluster({ isOpen }) {
    if (isOpen < 0.2) return null;

    return (
        <group>
             {[-1, 0, 1].map(k => (
                 <group key={k} rotation={[0, 0, k * 0.25]}>
                     <group rotation={[Math.PI / 2 + 0.2, 0, 0]}>
                        <mesh position={[0, 0.25, 0]}>
                            <cylinderGeometry args={[0.004, 0.004, 0.5, 5]} />
                            <meshStandardMaterial color="#fffdd0" />
                        </mesh>
                        <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
                            <capsuleGeometry args={[0.015, 0.12, 4, 8]} />
                            <meshStandardMaterial color="#eebb44" roughness={1} />
                        </mesh>
                     </group>
                 </group>
             ))}
             {/* Style */}
             <group rotation={[Math.PI / 2 + 0.1, 0, 0]}>
                <mesh position={[0, 0.35, 0]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.7, 5]} />
                    <meshStandardMaterial color="#ffeebb" />
                </mesh>
                <mesh position={[0, 0.7, 0]}>
                    <sphereGeometry args={[0.025, 6, 6]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
             </group>
        </group>
    );
}

// --- RUFFLED FLORET STRUCTURE ---
function Floret({ scale, openness, hueVariation }) {
  if (openness < 0.1) {
    return (
        <group scale={scale} rotation={[Math.PI/2, 0, 0]}>
             <mesh position={[0, 0.2, 0]}>
                 <cylinderGeometry args={[0.0, 0.08, 0.5, 8]} />
                 <meshStandardMaterial color="#8da365" roughness={0.8} />
             </mesh>
             <mesh position={[0, 0.45, 0]}>
                 <sphereGeometry args={[0.04, 8, 8]} />
                 <meshStandardMaterial color="#cc5500" />
             </mesh>
        </group>
    )
  }

  return (
    <group scale={scale}>
      {/* Base (Calyx) */}
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.04, 0.03, 0.15, 8]} />
         <meshStandardMaterial color="#6b8c42" />
      </mesh>

      {/* FLOWER HEAD */}
      <group rotation={[-0.2, 0, 0]}>
          <group position={[0, 0, 0]}>
             <StamenCluster isOpen={openness} />
          </group>

          {/* Petals - Wider and Ruffled */}
          {[0, 1, 2].map((i) => (
            <group key={`inner-${i}`} rotation={[0, 0, (i / 3) * Math.PI * 2]}>
                <group rotation={[Math.PI/2 - (0.2 + 0.3 * openness), 0, 0]}> 
                   <group position={[0, 0.05, 0]}>
                      <Petal 
                        width={0.45} // Wider
                        length={0.85} 
                        colorVariation={hueVariation} 
                        bend={0.3 * openness} 
                      />
                   </group>
                </group>
            </group>
          ))}

          {[0, 1, 2].map((i) => (
             <group key={`outer-${i}`} rotation={[0, 0, ((i / 3) * Math.PI * 2) + Math.PI/3]}>
                <group rotation={[Math.PI/2 - (0.3 + 0.4 * openness), 0, 0]}>
                   <group position={[0, 0.05, 0.01]}>
                      <Petal 
                        width={0.55} // Wider
                        length={0.95} 
                        colorVariation={hueVariation} 
                        bend={0.4 * openness} 
                      />
                   </group>
                </group>
             </group>
          ))}
      </group>
    </group>
  );
}

function Stem() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -3.0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, 2.5, 0.05),
    new THREE.Vector3(-0.02, 4.2, -0.02) 
  ]), []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.06, 12, false);
  }, [curve]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color="#557a46" roughness={0.8} />
    </mesh>
  );
}

// --- LEAF COMPONENT ---
function Leaf({ length, width, angle, rotation, yPos }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(width * 0.2, length * 0.3, width * 0.5, length * 0.7, 0, length);
    s.bezierCurveTo(-width * 0.5, length * 0.7, -width * 0.2, length * 0.3, 0, 0);
    return s;
  }, [length, width]);

  const geometry = useMemo(() => {
      const geo = new THREE.ExtrudeGeometry(shape, { 
        depth: 0.03, 
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.02,
        bevelSegments: 2
      });
      return geo;
  }, [shape]);

  return (
    <group position={[0, yPos, 0]} rotation={[0, rotation, 0]}>
        <mesh 
            geometry={geometry} 
            rotation={[angle, 0, 0]} 
            position={[0, 0, 0.07]} 
        >
            <meshStandardMaterial color="#4a6e3a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
    </group>
  );
}

function Gladiolus() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  // --- LEAF DATA ---
  // Lowered positions to prevent clipping through flowers
  const leaves = useMemo(() => [
    { length: 3.5, width: 0.4, angle: 0.4, rotation: 0.2, yPos: -3.0 }, // Lowered
    { length: 3.0, width: 0.35, angle: 0.35, rotation: Math.PI + 0.4, yPos: -2.4 }, // Lowered
    { length: 2.5, width: 0.3, angle: 0.4, rotation: -0.8, yPos: -1.8 }, // Lowered
  ], []);
  
  const floretPositions = useMemo(() => {
      const arr = [];
      const startY = 0.0; 
      const count = 14; 
      
      for(let i=0; i<count; i++) {
          const t = i / (count - 1);
          const side = i % 2 === 0 ? 1 : -1;
          arr.push({
              y: startY + i * 0.3, 
              side: side,
              scale: 1.1 - (t * 0.6), 
              openness: Math.max(0, 1.0 - (t * 1.1)) 
          });
      }
      return arr;
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Stem />
      
      {/* RENDER LEAVES */}
      {leaves.map((leaf, i) => <Leaf key={`leaf-${i}`} {...leaf} />)}

      {floretPositions.map((pos, index) => {
        const hueVariation = (Math.random() - 0.5) * 5; 
        const angle = pos.side * 0.6; 

        return (
          <group
            key={index}
            position={[
                Math.sin(angle) * 0.1,  
                pos.y,                  
                Math.cos(angle) * 0.1 + 0.05 
            ]}
            rotation={[0, angle, 0]}
          >
             <Floret scale={pos.scale} openness={pos.openness} hueVariation={hueVariation} />
          </group>
        );
      })}
    </group>
  );
}

export default function OrangeGladiolus({ onBack }) {
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
          camera={{ position: [0, 4, 10], fov: 35 }}
          shadows
        >
          <ambientLight intensity={isDarkMode ? 0.8 : 0.6} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={isDarkMode ? 1.5 : 1.2}
            castShadow
            color="#fff0dd"
          />
          <directionalLight position={[-5, 5, 2]} intensity={isDarkMode ? 0.8 : 0.5} color="#ffdcb3" />
          <pointLight position={[0, 2, 4]} intensity={isDarkMode ? 0.5 : 0.3} color="#ffeebb" />
          {isDarkMode && (
            <>
              <spotLight
                position={[10, 8, 5]}
                angle={0.3}
                penumbra={0.5}
                intensity={2}
                castShadow
                color="#ffffff"
              />
              <spotLight
                position={[-5, 5, -5]}
                intensity={3}
                color="#ffaa88"
              />
            </>
          )}
          
          {/* POSITION ADJUSTMENT: Lowered to -3 to center the tall spike on screen */}
          <group position-y={-1}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                 <Gladiolus />
            </Float>
          </group>

          <Sparkles count={60} scale={10} size={6} speed={0.4} opacity={0.6} color="#60a5fa" />
          <Sparkles count={60} scale={10} size={2} speed={0.4} opacity={0.6} color="#60a5fa" />
          <OrbitControls enableZoom={true} target={[0, 1, 0]} />
        </Canvas>
      </div>
    </>
  );
}