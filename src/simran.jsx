import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// ---------- 1. REUSABLE PETAL GEOMETRY ----------
function createPetalGeometry(size) {
  const shape = new THREE.Shape();
  const width = size * 1.5;
  const height = size * 1.2;

  shape.moveTo(0, 0);
  shape.quadraticCurveTo(width * 0.3, height * 0.1, width * 0.5, height * 0.5);
  shape.quadraticCurveTo(width * 0.6, height * 0.9, 0, height);
  shape.quadraticCurveTo(-width * 0.6, height * 0.9, -width * 0.5, height * 0.5);
  shape.quadraticCurveTo(-width * 0.3, height * 0.1, 0, 0);

  const extrudeSettings = { depth: 0.005 * size, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 12 };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

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
  return geom;
}

function Petal({ size, material }) {
  const geometry = useMemo(() => createPetalGeometry(size), [size]);
  return <mesh geometry={geometry} material={material} />;
}

// ---------- 2. STEM & LEAVES ----------

function Stem() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -2.5, 0),
    new THREE.Vector3(0.05, -1.0, 0.05),
    new THREE.Vector3(-0.02, 0.5, -0.02),
    new THREE.Vector3(0, 2.0, 0)
  ]), []);
  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.07, 8, false), [curve]);
  return <mesh geometry={tubeGeometry}><meshStandardMaterial color="#4a5a3a" roughness={0.8} /></mesh>;
}

function Leaf({ y, rot, scale = 1 }) {
  const { geometry } = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.25, 0.3, 0, 1.0); 
    shape.quadraticCurveTo(-0.25, 0.3, 0, 0);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
    const pos = geom.attributes.position;
    for(let i=0; i<pos.count; i++) pos.setZ(i, pos.getZ(i) - Math.pow(pos.getY(i), 1.5) * 0.3);
    geom.computeVertexNormals();
    return { geometry: geom };
  }, []);
  return <mesh position={[0, y, 0]} rotation={[0.6, rot, 0]} geometry={geometry} scale={scale}><meshStandardMaterial color="#4a5a3a" side={THREE.DoubleSide} /></mesh>;
}

// ---------- 3. CARNATION HEAD ----------

function CarnationHead({ scale, materials, onClick }) {
  const totalPetals = 150; 
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  const petals = useMemo(() => {
    return Array.from({ length: totalPetals }).map((_, i) => {
      const t = i / totalPetals; 
      const isInnerPetal = t < 0.35 && Math.random() > 0.4;
      const theta = i * goldenAngle;
      const phi = t * 2.2; 
      
      const radius = 0.15 * scale;
      vec.setFromSphericalCoords(radius, phi, theta);
      dummy.position.set(vec.x, vec.y + ((1 - t) * 0.15 * scale), vec.z);
      target.set(vec.x * 2, 10, vec.z * 2); 
      dummy.lookAt(target);

      return {
        position: [dummy.position.x, dummy.position.y, dummy.position.z],
        rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
        tiltBack: isInnerPetal ? (Math.random() > 0.5 ? 1 : -1) * t * 1.3 : t * 1.3,
        wiggle: (Math.random() - 0.5) * (isInnerPetal ? 1.2 : 0.6),
        size: (0.2 + t * 0.25) * scale,
        isInner: isInnerPetal
      };
    });
  }, [scale, dummy, vec, target]);

  return (
    <group onClick={onClick}>
      <group position-y={-0.1 * scale}>
        <mesh position-y={0.1 * scale}>
           <cylinderGeometry args={[0.12 * scale, 0.03 * scale, 0.6 * scale, 12]} />
           <primitive object={materials.calyxMat} attach="material" />
        </mesh>
      </group>
      <group position-y={0.3 * scale}>
        {petals.map((p, k) => (
          <group key={k} position={p.position} rotation={p.rotation}>
             <group rotation-x={p.tiltBack * 2.0}>
                 <group rotation-z={p.wiggle}>
                    <Petal size={p.size} material={p.isInner ? materials.innerMat : materials.outerMat} />
                 </group>
             </group>
          </group>
        ))}
      </group>
    </group>
  );
}

// ---------- 4. SLOW & GRACEFUL SPIRAL WIND ----------

function SwirlAndBoomEffect({ isActive, material }) {
  const count = 90;
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Use the exact same ruffled geometry
  const flyingPetalGeom = useMemo(() => createPetalGeometry(0.25), []);

  const anim = useRef({ swoop: 0, orbit: 0, burst: 0 });

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const startRadius = 12 + Math.random() * 8; // Start further out
      const startTheta = Math.random() * Math.PI * 2;
      const startPhi = Math.acos(2 * Math.random() - 1);

      const endRadius = 1.2 + Math.random() * 1.0;
      // More rotations for a slower, more dramatic spiral
      const endTheta = startTheta + Math.PI * (4 + Math.random() * 4); 
      const endPhi = Math.acos(2 * Math.random() - 1);

      return {
        startRadius, startTheta, startPhi,
        endRadius, endTheta, endPhi,
        scale: 0.6 + Math.random() * 0.5,
        flutterSpeed: 1 + Math.random() * 2, // Slower flutter
        flutterOffset: Math.random() * Math.PI * 2
      };
    });
  }, [count]);

  useEffect(() => {
    if (isActive) {
      anim.current = { swoop: 0, orbit: 0, burst: 0 };
      const tl = gsap.timeline();
      
      // MUCH SLOWER TIMINGS
      // 1. Very slow, graceful swoop in (5 seconds)
      tl.to(anim.current, { swoop: 1, duration: 5.0, ease: 'power2.inOut' }, 0);
      
      // 2. Long, slow orbit around the flower (3 seconds)
      tl.to(anim.current, { orbit: 1, duration: 3.0, ease: 'linear' }, 4.5);
      
      // 3. Slow, majestic burst outward (3 seconds)
      tl.to(anim.current, { burst: 1, duration: 3.0, ease: 'power2.in' }, 7.5);
    }
  }, [isActive]);

  useFrame((state) => {
    if (!meshRef.current || !isActive) return;
    const { swoop, orbit, burst } = anim.current;
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Radius shrinks during swoop, stays tight during orbit, explodes during burst
      const r = p.startRadius + (p.endRadius - p.startRadius) * swoop + (25 * burst);
      
      // Theta increases to create the spiral vortex
      // Added more rotation during the burst phase for a wider exit spiral
      const t = p.startTheta + (p.endTheta - p.startTheta) * swoop + (Math.PI * 2) * orbit + (Math.PI * 2) * burst;
      
      const phi = p.startPhi + (p.endPhi - p.startPhi) * swoop;

      const x = r * Math.sin(phi) * Math.cos(t);
      const z = r * Math.sin(phi) * Math.sin(t);
      const y = (r * Math.cos(phi)) + 2.0;

      dummy.position.set(x, y, z);
      dummy.lookAt(0, 2.0, 0); // Always face center
      dummy.rotateX(Math.PI / 2.5); // Tilt into wind
      dummy.rotateY(Math.sin(time * p.flutterSpeed + p.flutterOffset) * 0.2); // Gentle flutter

      // Fade out and shrink slowly during burst
      const currentScale = p.scale * (1 - burst);
      dummy.scale.setScalar(currentScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isActive) return null;

  return (
    <instancedMesh ref={meshRef} args={[flyingPetalGeom, material, count]}>
        {/* Added transparency for a softer look as they fade */}
       <meshStandardMaterial {...material} transparent opacity={1} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ---------- 5. SCENE MANAGER ----------

function SceneInner() {
  const [isAnimating, setIsAnimating] = useState(false);
  const flowerGroupRef = useRef();

  // Generate textures ONE TIME safely
  const materials = useMemo(() => {
    const createMat = (type) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 128);
      const baseHue = 350;

      if (type === 'calyx') {
        gradient.addColorStop(0, 'hsl(350, 100%, 70%)');
        gradient.addColorStop(0.5, 'hsl(350, 80%, 75%)');
        gradient.addColorStop(1, '#4a5a3a');
      } else if (type === 'inner') {
        gradient.addColorStop(0, `hsl(${baseHue}, 100%, 50%)`);
        gradient.addColorStop(0.15, `hsl(${baseHue}, 100%, 60%)`);
        gradient.addColorStop(0.25, 'white');
        gradient.addColorStop(0.6, 'white');
        gradient.addColorStop(1, `hsl(${baseHue - 10}, 100%, 30%)`);
      } else {
        gradient.addColorStop(0, `hsl(${baseHue}, 90%, 85%)`); 
        gradient.addColorStop(1, `hsl(${baseHue - 10}, 100%, 35%)`); 
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.toJSON = () => ({}); // Prevent React crash

      // Return just the texture config properties, not the material itself yet
      return { map: texture, roughness: 0.6, side: THREE.DoubleSide };
    };
    // Create actual materials here
    return { 
        calyxMat: new THREE.MeshStandardMaterial(createMat('calyx')), 
        innerMat: new THREE.MeshStandardMaterial(createMat('inner')), 
        outerMat: new THREE.MeshStandardMaterial(createMat('outer')),
        // Keep raw config for the instanced mesh material props
        outerMatConfig: createMat('outer')
    };
  }, []);

  const handleFlowerClick = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (flowerGroupRef.current) {
        // Slow, long spin matching the new animation duration (~10s total)
        gsap.to(flowerGroupRef.current.rotation, { 
            y: "+=" + Math.PI * 8, 
            duration: 10.0, 
            ease: "power2.inOut", 
            delay: 0.5, 
            onComplete: () => setIsAnimating(false) 
        });
    }
  }, [isAnimating]);

  useFrame((state) => {
    if (!isAnimating && flowerGroupRef.current) {
      flowerGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 2, -5]} intensity={0.5} color="#ffd1dc" />

      <group ref={flowerGroupRef} position={[0, -1.0, 0]}>
        <Stem />
        <Leaf y={-1.2} rot={0} scale={1.2} />
        <Leaf y={-0.4} rot={2.5} scale={1.0} />
        <Leaf y={0.5} rot={4.0} scale={0.8} />
        <group position={[0, 2.0, 0]}>
          <CarnationHead scale={1.3} materials={materials} onClick={handleFlowerClick} />
        </group>
      </group>

      {/* Pass the raw material config so InstancedMesh can spread it */}
      <SwirlAndBoomEffect isActive={isAnimating} material={materials.outerMatConfig} />
      
      <Sparkles count={60} scale={10} size={2} speed={0.4} opacity={0.6} color="#60a5fa" />
      <OrbitControls target={[0, 1.5, 0]} />
    </>
  );
}

// ---------- 6. EXPORT ----------

export default function PinkCarnationScene({ onBack }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        <button onClick={onBack} className="absolute top-4 left-4 z-10 bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">
          ← Back
        </button>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 right-4 z-10 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        <Canvas camera={{ position: [3, 4, 7], fov: 40 }} shadows>
          <SceneInner />
        </Canvas>
      </div>
    </>
  );
}