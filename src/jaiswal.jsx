import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// --- BACKGROUND ---
const animatedBackgroundStyle = `
  @keyframes deep-water {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .deep-water-bg {
    background: linear-gradient(-45deg, #001e1d, #0f3d3e, #001e1d);
    background-size: 400% 400%;
    animation: deep-water 20s ease infinite;
  }
  @keyframes night-water {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .night-water-bg {
    background: linear-gradient(-45deg, #020617, #0f172a, #001e1d);
    background-size: 400% 400%;
    animation: night-water 20s ease infinite;
  }
`;

// --- PROCEDURAL TEXTURE GENERATORS (For Realism) ---

// Generates a texture with fine vertical striations (veins) for petals
function usePetalTexture(colorHsl) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Base Gradient (White base -> Pink tip)
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0.0, '#fffdfa'); // Creamy white base
    gradient.addColorStop(0.3, `hsl(${colorHsl[0]}, ${colorHsl[1]}%, 92%)`);
    gradient.addColorStop(0.6, `hsl(${colorHsl[0]}, ${colorHsl[1]}%, 65%)`);
    gradient.addColorStop(1.0, `hsl(${colorHsl[0]}, ${colorHsl[1]}%, 45%)`); // Deep tip

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Vertical Striations (Veins)
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = `hsla(${colorHsl[0]}, 90%, 30%, 0.15)`;
    
    for (let i = 0; i < 60; i++) {
      ctx.lineWidth = Math.random() * 2 + 0.5;
      const x = Math.random() * 512;
      ctx.beginPath();
      // Curve the veins slightly to match petal shape
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(256 + (x-256)*0.5, 256, x, 512);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [colorHsl]);
}

// Generates a radial vein texture for the pads
function usePadTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Green
    ctx.fillStyle = '#2e5c33'; // Darker, realistic green
    ctx.fillRect(0, 0, 512, 512);

    // Radial Veins
    ctx.strokeStyle = '#3e7a43'; // Lighter green veins
    ctx.lineWidth = 2;
    const cx = 256;
    const cy = 256;

    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const endX = cx + Math.cos(angle) * 300;
        const endY = cy + Math.sin(angle) * 300;
        // Wavy veins
        ctx.bezierCurveTo(
            cx + Math.cos(angle) * 100, cy + Math.sin(angle) * 100,
            cx + Math.cos(angle + 0.1) * 200, cy + Math.sin(angle + 0.1) * 200,
            endX, endY
        );
        ctx.stroke();
    }

    // Noise/Texture speckles
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for(let i=0; i<1000; i++) {
        ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);
}

// --- WATER DROPLETS COMPONENT ---
function WaterDroplets({ count = 15, spread = 1 }) {
    const meshRef = useRef();
    // Create random positions for droplets
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const r = Math.random() * spread; // radius distance
            const theta = Math.random() * Math.PI * 2;
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            const size = Math.random() * 0.03 + 0.01;
            temp.push({ x, y, size });
        }
        return temp;
    }, [count, spread]);

    return (
        <group rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}> {/* Sit on top of leaf */}
            {particles.map((p, i) => (
                <mesh key={i} position={[p.x, p.y, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <sphereGeometry args={[p.size, 8, 8]} />
                    <meshPhysicalMaterial 
                        color="white"
                        transmission={1} // Glass-like
                        opacity={1}
                        metalness={0}
                        roughness={0}
                        ior={1.5}
                        thickness={0.1}
                    />
                </mesh>
            ))}
        </group>
    )
}

// --- LOTUS PETAL (Updated with Physical Material) ---
function LotusPetal({ width = 1, length = 1, targetAngle = 0, targetRotation = 0, colorHsl = [340, 100, 50], position = [0, 0, 0] }) {
  const texture = usePetalTexture(colorHsl);
  const groupRef = useRef();
  const meshRef = useRef();

  // Smoothly animate the petal's opening/closing
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation, 0.05);
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetAngle, 0.05);
    }
  });

  const { geometry } = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // More elegant spoon curve
    shape.bezierCurveTo(width * 0.5, length * 0.15, width * 1.3, length * 0.6, 0, length);
    shape.bezierCurveTo(-width * 1.3, length * 0.6, -width * 0.5, length * 0.15, 0, 0);

    const extrudeSettings = { depth: 0.005, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.01, bevelSegments: 3, curveSegments: 24 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Cup the geometry
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const ratio = Math.max(0, v3.y / length);
        const xDist = Math.abs(v3.x);
        // Deep cup shape
        const bend = Math.pow(ratio, 1.8) * (length * 0.5);
        const cup = Math.pow(xDist, 2.2) * 2.5;
        pos.setZ(i, v3.z + bend + cup);
    }
    geo.computeVertexNormals();
    geo.rotateX(-0.15); // Natural lean
    return { geometry: geo };
  }, [width, length]);

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef} geometry={geometry}>
          {/* Physical Material for Wax/Subsurface look */}
          <meshPhysicalMaterial 
              map={texture}
              color="white"
              roughness={0.35}
              metalness={0.0}
              transmission={0.1} // Slight light passing through
              thickness={0.2} // For SSS
              sheen={1}
              sheenColor="#ffcce0"
              side={THREE.DoubleSide}
          />
      </mesh>
    </group>
  );
}

// --- PAD STEM (Bezier Curve) ---
function PadStem({ startPos = [0,0,0], endOffset = [0.5, -4, 0.5] }) {
    const curve = useMemo(() => {
        // Curve starts at pad center and wanders down irregularly
        const p1 = new THREE.Vector3(0, 0, 0);
        const p2 = new THREE.Vector3(endOffset[0] * 0.3, -1, endOffset[2] * 0.3);
        const p3 = new THREE.Vector3(endOffset[0], endOffset[1], endOffset[2]);
        return new THREE.CatmullRomCurve3([p1, p2, p3]);
    }, [endOffset]);

    const geometry = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.03, 8, false), [curve]);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#3e6b35" roughness={0.8} />
        </mesh>
    );
}

// --- REALISTIC LILY PAD ---
function LotusPad({ size = 2, stemEnd = [1, -4, 1] }) {
    const texture = usePadTexture();

    const { geometry } = useMemo(() => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, size, 0.2, Math.PI * 2 - 0.2, false);
        shape.lineTo(0, 0);
        
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.01, segments: 1 });
        geo.rotateX(-Math.PI / 2);
        
        // Add subtle wave to the leaf surface
        const pos = geo.attributes.position;
        const v3 = new THREE.Vector3();
        for(let i=0; i<pos.count; i++){
             v3.fromBufferAttribute(pos, i);
             // Sine wave ripples
             const wave = Math.sin(v3.x * 3) * Math.cos(v3.z * 3) * 0.05;
             // Dip in the center
             const centerDip = Math.max(0, 1 - Math.sqrt(v3.x*v3.x + v3.z*v3.z)/size) * -0.1;
             pos.setY(i, v3.y + wave + centerDip);
        }
        geo.computeVertexNormals();
        return { geometry: geo };
    }, [size]);

    return (
        <group>
            {/* The Pad */}
            <mesh geometry={geometry} receiveShadow>
                <meshStandardMaterial 
                    map={texture}
                    color="#ffffff" 
                    roughness={0.4}
                    metalness={0.1}
                    bumpMap={texture}
                    bumpScale={0.05}
                />
            </mesh>
            {/* The Stem */}
            <PadStem endOffset={stemEnd} />
            {/* The Dew Drops */}
            <WaterDroplets count={12} spread={size * 0.8} />
        </group>
    );
}

// --- FLOWER POD ---
function LotusPod() {
    return (
        <group>
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.2, 0.1, 0.4, 16]} />
                <meshStandardMaterial color="#c0ca33" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.601, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[0, 0.2, 16]} />
                <meshStandardMaterial color="#fdd835" />
            </mesh>
            {/* Stamens */}
            {Array.from({ length: 16 }).map((_, i) => (
                <mesh key={i} position={[Math.sin(i)*0.22, 0.45, Math.cos(i)*0.22]} rotation={[0.2, 0, i]}>
                    <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
                    <meshStandardMaterial color="#fff59d" />
                </mesh>
            ))}
        </group>
    )
}

// --- FLOWER STEM ---
function FlowerStem() {
    const curve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.1, -2, 0.1),
        new THREE.Vector3(-0.1, -4, -0.1)
    ]), []);
    const geo = useMemo(() => new THREE.TubeGeometry(curve, 24, 0.06, 8, false), [curve]);
    return <mesh geometry={geo}><meshStandardMaterial color="#4a7a40" /></mesh>;
}

// --- LOTUS FLOWER ASSEMBLY ---
function LotusFlower({ position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) {
    const groupRef = useRef();
    const [isOpen, setIsOpen] = useState(true);
    const openProgress = isOpen ? 1 : 0;

    useFrame((state) => {
        if (groupRef.current && rotation) { // Ensure rotation is defined before accessing
            // Gentle organic movement
            groupRef.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
        }
    });

    return (
        <group 
            ref={groupRef} 
            position={position} 
            scale={scale} 
            rotation={rotation}
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}
        >
            <FlowerStem />
            <LotusPod />
            {/* Tight Inner Layer */}
            {[...Array(5)].map((_, i) => (
                <group key={`l1-${i}`} rotation={[0, (i/5)*Math.PI*2, 0]}>
                    <LotusPetal 
                        width={0.35} 
                        length={0.8} 
                        position={[0, 0.1, 0.15]}
                        targetRotation={0.25 + (1 - openProgress) * 0.2}
                        targetAngle={-0.1 + (1 - openProgress) * 0.1} 
                        colorHsl={[330, 80, 50]} 
                    />
                </group>
            ))}
            {/* Middle Layer */}
            {[...Array(6)].map((_, i) => (
                <group key={`l2-${i}`} rotation={[0, ((i+0.5)/6)*Math.PI*2, 0]}>
                    <LotusPetal 
                        width={0.45} 
                        length={1.1} 
                        position={[0, 0.1, 0.25]}
                        targetRotation={0.65 + (1 - openProgress) * 0.4}
                        targetAngle={-0.4 + (1 - openProgress) * 0.2} 
                        colorHsl={[340, 90, 60]} 
                    />
                </group>
            ))}
            {/* Open Outer Layer */}
            {[...Array(8)].map((_, i) => (
                <group key={`l3-${i}`} rotation={[0, (i/8)*Math.PI*2, 0]}>
                    <LotusPetal 
                        width={0.55} 
                        length={1.3} 
                        position={[0, 0.05, 0.35]}
                        targetRotation={1.1 + (1 - openProgress) * 0.6}
                        targetAngle={-0.7 + (1 - openProgress) * 0.3} 
                        colorHsl={[345, 100, 70]} 
                    />
                </group>
            ))}
        </group>
    );
}

export default function LotusScene({ onBack }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className={`w-full h-screen ${isDarkMode ? 'night-water-bg' : 'deep-water-bg'}`}>
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md text-white/90 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
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
          camera={{ position: [0, 2, 8], fov: 40 }}
          shadows
          dpr={[1, 2]} // High DPI for crisp edges
        >
          {/* Environment for reflections on water drops and petals */}
          <Environment preset={isDarkMode ? "night" : "sunset"} />

          <ambientLight intensity={isDarkMode ? 0.8 : 0.4} />
          <spotLight
            position={[10, 10, 5]}
            angle={0.15}
            penumbra={1}
            intensity={isDarkMode ? 3 : 2}
            castShadow
            color={isDarkMode ? "#ffffff" : "#fff0f5"}
          />
          <pointLight position={[-5, 2, -5]} intensity={isDarkMode ? 1 : 0.5} color={isDarkMode ? "#eebbff" : "#4fd4d6"} />
          {isDarkMode && (
            <>
              <spotLight
                position={[-10, 8, 5]}
                angle={0.3}
                penumbra={0.5}
                intensity={2}
                castShadow
                color="#ffaa88"
              />
              <pointLight position={[5, 3, 3]} intensity={0.8} color="#ffeebb" />
            </>
          )}
          
          <group position={[0, -0.5, 0]}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
                
                {/* 1. Main High Flower */}
                <LotusFlower position={[0.5, 0.5, 0]} scale={1.1} rotation={[0.1, 0, 0.1]} />
                
                {/* 2. Lower Secondary Flower (Like the image) */}
                <LotusFlower position={[-0.5, -1.2, 0.8]} scale={0.8} rotation={[0, 0.5, -0.1]} />

                {/* 3. Lily Pads with Stems */}
                <group position={[0, -0.5, 0]}>
                    {/* Left Pad */}
                    <group position={[-2.5, 0.2, 0]} rotation={[0.1, 0.5, 0.1]}>
                         <LotusPad size={1.6} stemEnd={[0.5, -4, 0]} />
                    </group>
                    {/* Right Pad */}
                    <group position={[2.2, 0, -0.5]} rotation={[0, -0.5, -0.1]}>
                         <LotusPad size={1.4} stemEnd={[-0.5, -4, 0.5]} />
                    </group>
                    {/* Front Low Pad */}
                    <group position={[0.5, -0.8, 1.5]} rotation={[-0.2, 0, 0]}>
                         <LotusPad size={1.3} stemEnd={[0, -3, -1]} />
                    </group>
                    {/* Back Shadow Pad */}
                    <group position={[-1, 0.5, -2]} rotation={[0, 2, 0]}>
                         <LotusPad size={1.2} stemEnd={[0, -4, 0]} />
                    </group>
                </group>

            </Float>
          </group>

          <ContactShadows opacity={0.6} scale={10} blur={2.5} far={4} />
          <Sparkles count={80} scale={10} size={3} speed={0.4} opacity={0.4} color={isDarkMode ? "#ffaaee" : "#fff"} />
          <OrbitControls
            enableZoom={true} 
            target={[0, 0, 0]} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2 + 0.2} 
          />
        </Canvas>
      </div>
    </>
  );
}