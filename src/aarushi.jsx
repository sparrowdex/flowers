import React, { useRef, useMemo } from 'react';
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
`;

// --- PETAL GEOMETRY (With Tip Bend) ---
function Petal({ width = 1, length = 1, colorVariation = 0, bend = 0.5 }) {
  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();
    
    shape.moveTo(0, 0); 
    shape.bezierCurveTo(width * 0.4, length * 0.2, width * 1.1, length * 0.6, 0, length); 
    shape.bezierCurveTo(-width * 1.1, length * 0.6, -width * 0.4, length * 0.2, 0, 0); 

    const extrudeSettings = {
      depth: 0.005, 
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.01,
      bevelSegments: 3,
      curveSegments: 16
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, 0);

    // --- VERTEX MANIPULATION FOR BENDING ---
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const ratio = Math.max(0, v3.y / length);
        const curl = Math.pow(ratio, 2.5) * bend; 
        pos.setZ(i, v3.z - curl);
        pos.setY(i, v3.y - (curl * 0.3)); 
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
    
    ctx.strokeStyle = 'rgba(120, 20, 0, 0.3)';
    ctx.lineWidth = 1;
    for(let i=0; i<10; i++) {
        ctx.beginPath();
        ctx.moveTo(128, 0);
        ctx.quadraticCurveTo(128 + (i-5)*40, 128, 128 + (i-5)*15, 256);
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

function Floret({ scale, openness, hueVariation }) {
  if (openness < 0.1) {
    // Bud
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
          {/* Stamens */}
          <group position={[0, 0, 0]}>
             <StamenCluster isOpen={openness} />
          </group>

          {/* Petals */}
          {[0, 1, 2].map((i) => (
            <group key={`inner-${i}`} rotation={[0, 0, (i / 3) * Math.PI * 2]}>
                <group rotation={[Math.PI/2 - (0.2 + 0.3 * openness), 0, 0]}> 
                   <group position={[0, 0.05, 0]}>
                      <Petal width={0.4} length={0.8} colorVariation={hueVariation} bend={0.3 * openness} />
                   </group>
                </group>
            </group>
          ))}

          {[0, 1, 2].map((i) => (
             <group key={`outer-${i}`} rotation={[0, 0, ((i / 3) * Math.PI * 2) + Math.PI/3]}>
                <group rotation={[Math.PI/2 - (0.3 + 0.4 * openness), 0, 0]}>
                   <group position={[0, 0.05, 0.01]}>
                      <Petal width={0.5} length={0.9} colorVariation={hueVariation} bend={0.4 * openness} />
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
    new THREE.Vector3(0, -3.0, 0), // Started lower for leaves
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, 2.5, 0.05),
    // FIX: Shortened the top of the stem significantly (was 5.0)
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

// --- IMPROVED LEAF COMPONENT (Softer, curved shape) ---
function Leaf({ length, width, angle, rotation, yPos }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Sword shape with gentle curves
    s.moveTo(0, 0);
    s.bezierCurveTo(width * 0.2, length * 0.3, width * 0.5, length * 0.7, 0, length);
    s.bezierCurveTo(-width * 0.5, length * 0.7, -width * 0.2, length * 0.3, 0, 0);
    return s;
  }, [length, width]);

  const geometry = useMemo(() => {
      // Added bevel for softer edges
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
            // Pushed further out to avoid clipping stem
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

  // --- LEAF DATA (Lower positions to avoid clipping flowers) ---
  const leaves = useMemo(() => [
    { length: 3.5, width: 0.4, angle: 0.4, rotation: 0.2, yPos: -2.8 },
    { length: 3.0, width: 0.35, angle: 0.35, rotation: Math.PI + 0.4, yPos: -2.2 },
    { length: 2.5, width: 0.3, angle: 0.4, rotation: -0.8, yPos: -1.5 },
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
    // Base position of the whole spike
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

function SparklesComponent() {
  return <Sparkles count={40} scale={10} size={3} speed={0.4} opacity={0.4} color="#ffddaa" />;
}

export default function OrangeGladiolus() {
  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className="w-full h-screen green-gradient-bg">
        <Canvas
          // CAMERA ADJUSTMENT: Closer Z (10), higher Y (4) to look down slightly
          camera={{ position: [0, 4, 10], fov: 35 }}
          shadows
        >
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 8, 5]} 
            intensity={1.2} 
            castShadow 
            color="#fff0dd"
          />
          <directionalLight position={[-5, 5, 2]} intensity={0.5} color="#ffdcb3" />
          <pointLight position={[0, 2, 4]} intensity={0.3} color="#ffeebb" />
          
          {/* POSITION ADJUSTMENT: Raised to prevent top from being cut off */}
          <group position-y={-1.5}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                 <Gladiolus />
            </Float>
          </group>
          
          <Particles />
          {/* TARGET ADJUSTMENT: Look at the middle-top of the flower spike */}
          <OrbitControls enableZoom={true} target={[0, 1, 0]} />
        </Canvas>
      </div>
    </>
  );
}