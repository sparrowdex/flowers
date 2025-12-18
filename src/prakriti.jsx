import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
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

// =========================================================
//  HELPER: CURVED STEMS (TubeGeometry)
// =========================================================
function OrganicStem({ start, end, control, thickness, color = "#0f330f" }) {
  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control),
      new THREE.Vector3(...end)
    );
  }, [start, end, control]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 32, thickness, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

// =========================================================
//  HELPER: TEXTURED SPADIX (For the curled bud)
// =========================================================
function TexturedSpadix({ height, radius, color }) {
  const meshRef = useMemo(() => {
    const baseGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
    const bumpCount = 200;
    return (
      <group>
        <mesh geometry={baseGeo}>
           <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {Array.from({ length: bumpCount }).map((_, i) => {
           const y = (Math.random() - 0.5) * height;
           const angle = Math.random() * Math.PI * 2;
           const r = radius; 
           return (
             <mesh key={i} position={[Math.cos(angle)*r, y, Math.sin(angle)*r]}>
                <sphereGeometry args={[radius * 0.25, 4, 4]} />
                <meshStandardMaterial color={color} />
             </mesh>
           )
        })}
      </group>
    )
  }, [height, radius, color]);
  return meshRef;
}

// =========================================================
//  ENGINE 1: THE "ORIGINAL" FLOWER GEOMETRY
//  (Ported exactly from your first code snippet)
// =========================================================
function useOriginalFlowerGeo() {
  return useMemo(() => {
    // 1. Define the 2D shape of the petal
    const spatheShape = new THREE.Shape();
    spatheShape.moveTo(0, 0);
    spatheShape.bezierCurveTo(0.25, 0.2, 0.3, 0.5, 0.25, 0.8);
    spatheShape.bezierCurveTo(0.18, 0.95, 0.05, 1.0, 0, 1.05);
    spatheShape.bezierCurveTo(-0.05, 1.0, -0.18, 0.95, -0.25, 0.8);
    spatheShape.bezierCurveTo(-0.3, 0.5, -0.25, 0.2, 0, 0);

    const extrudeSettings = {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2
    };

    // 2. Create base geometry
    const geom = new THREE.ExtrudeGeometry(spatheShape, extrudeSettings);
    const positions = geom.attributes.position;
    const petalHeight = 1.05;

    // 3. Deform the geometry
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = y / petalHeight;
      // Add a gentle C-curve along the petal's length
      const curve = -Math.sin(normalizedY * Math.PI) * 0.07;
      // Add a slight backward bend, strongest at the tip
      const tipBend = Math.pow(normalizedY, 5) * -0.12;
      positions.setZ(i, positions.getZ(i) + curve + tipBend);
    }

    geom.computeVertexNormals();
    // Center pivot to bottom
    geom.translate(0, -petalHeight/2, 0);
    geom.translate(0, petalHeight/2, 0);
    return geom;
  }, []);
}

// =========================================================
//  ENGINE 2: SOFT ORGANIC ENGINE (For Bud & Green Leaf)
// =========================================================
const createSoftOrganicGeo = ({ width, height, curvature, isBud = false, isRibbed = false }) => {
    const shape = new THREE.Shape(); shape.moveTo(0,0);
    if(isBud){ shape.quadraticCurveTo(-width/2, height*0.3, -width*0.1, height); shape.quadraticCurveTo(width/2, height*0.3, 0,0); }
    else{ shape.bezierCurveTo(-width*0.6, height*0.2, -width*0.5, height*0.7, 0, height); shape.bezierCurveTo(width*0.5, height*0.7, width*0.6, height*0.2, 0,0); }

    const geometry = new THREE.ExtrudeGeometry(shape, { steps: 24, depth: 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.01, bevelSegments: 3 });
    geometry.translate(0, -height / 2, 0); geometry.translate(0, height / 2, 0);
    const pos = geometry.attributes.position; const v = new THREE.Vector3(); geometry.computeBoundingBox();
    const minY = geometry.boundingBox.min.y; const h = geometry.boundingBox.max.y - minY;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); const yRel = Math.max(0, (v.y - minY) / h);
      
      // --- IMPROVED VEIN MATH ---
      if (isRibbed && !isBud) { 
        // Central midrib depression
        const midribFalloff = Math.pow(Math.abs(v.x / (width/2.2)), 0.5);
        v.z -= (1.0 - midribFalloff) * 0.03 * yRel;
        
        // Lateral veins angling outwards
        const veinFreq = 25.0;
        const veinAngle = 2.5;
        const veinWave = Math.cos((v.y * veinFreq) - (Math.abs(v.x) * veinAngle));
        v.z += veinWave * 0.007 * yRel * (1.0 - midribFalloff);
      }

      const arch = Math.pow(yRel, 2) * curvature.back; v.z -= arch;
      const cup = Math.pow(Math.abs(v.x), 1.8) * curvature.cup * (1 - yRel * 0.5); v.z += cup;
      if (isBud) { const twist = yRel * 7.0; const tx = v.x * Math.cos(twist) - (v.z+0.05) * Math.sin(twist); const tz = v.x * Math.sin(twist) + (v.z+0.05) * Math.cos(twist); v.x = tx; v.z = tz - 0.05; }
      v.y -= Math.sin(arch) * (h * 0.15); pos.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals(); return geometry;
  };


// =========================================================
//  COMPONENT 1: THE "ORIGINAL" WIDE FLOWER (Left)
// =========================================================
function TheOriginalFlower() {
  const stemStart = [-0.1, 0, 0.1];
  const stemEnd = [-0.3, 1.3, 0.2];
  
  // Use the ported geometry
  const geo = useOriginalFlowerGeo();

  return (
    <group>
      <OrganicStem start={stemStart} end={stemEnd} control={[-0.15, 0.6, 0.1]} thickness={0.022} />
      
      {/* Place the geo at the end of the stem */}
      <group position={stemEnd} rotation={[0.3, 0, 0]}>
        <mesh geometry={geo} scale={[1.3, 1.3, 1.3]}> {/* Scaled up slightly */}
          <meshStandardMaterial color="#fdfdf8" side={THREE.DoubleSide} roughness={0.3} metalness={0.05} />
        </mesh>

        {/* The simple cylinder spadix from the original code style */}
        <mesh position={[0, 0.5, 0.02]} rotation={[0.1, 0, 0]}>
           <cylinderGeometry args={[0.035, 0.04, 0.7, 16]} />
           <meshStandardMaterial color="#f2e8b6" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// =========================================================
//  COMPONENT 2: THE CURLED BUD (Right)
// =========================================================
function TheCurledBud() {
  const stemStart = [0.2, 0, 0.05];
  const stemEnd = [0.35, 1.5, 0.1];

  // Use soft engine for the curl
  const geo = useMemo(() => createSoftOrganicGeo({
    width: 0.45, height: 1.8, curvature: { back: 0.1, cup: 3.5 }, isBud: true
  }), []);

  return (
    <group>
      <OrganicStem start={stemStart} end={stemEnd} control={[0.3, 0.7, 0.05]} thickness={0.022} />
      
      <group position={stemEnd} rotation={[0.1, 0.3, 0]}>
          
          {/* --- FIX: SEAMLESS STEM CONNECTION --- */}
          {/* Internal stem is now green to match, creating a continuous look */}
          <mesh position={[0, 0.4, 0.02]}>
             <cylinderGeometry args={[0.02, 0.022, 0.8, 8]} />
             <meshStandardMaterial color="#0f330f" roughness={0.7} /> 
          </mesh>

          {/* TEXTURED SPADIX sitting perfectly on the green internal stem */}
          <group position={[0, 0.8, 0.04]}> 
             <TexturedSpadix height={0.8} radius={0.025} color="#f2e8b6" />
          </group>

          {/* The Bract */}
          <mesh geometry={geo}>
             <meshPhysicalMaterial color="#d1ebd1" roughness={0.4} transmission={0.15} side={THREE.DoubleSide} />
          </mesh>
      </group>
    </group>
  );
}

// =========================================================
//  COMPONENT 3: THE BIG GREEN LEAF (Behind)
// =========================================================
function TheBackgroundLeaf() {
  const stemStart = [0, 0, -0.2]; // Starts further back
  const stemEnd = [0, 1.6, -0.4]; // Ends further back and high

  // Use soft engine with IMPROVED VEINS
  const geo = useMemo(() => createSoftOrganicGeo({
    width: 1.5, height: 2.5, 
    curvature: { back: 1.2, cup: 0.4 }, 
    isRibbed: true
  }), []);

  return (
    <group>
       <OrganicStem start={stemStart} end={stemEnd} control={[0, 0.8, -0.3]} thickness={0.03} />
       
       <group position={stemEnd} rotation={[0, 0, 0]}>
         <mesh geometry={geo}>
           <meshPhysicalMaterial color="#133d13" roughness={0.6} side={THREE.DoubleSide} />
         </mesh>
         
         {/* --- ADDED PHYSICAL MIDRIB --- */}
         <mesh position={[0, 1.25, 0.03]} rotation={[0,0,0]}>
            <cylinderGeometry args={[0.008, 0.012, 2.5, 8]} />
            <meshStandardMaterial color="#0a2a0a" roughness={0.8} />
         </mesh>
       </group>
    </group>
  );
}


// =========================================================
//  MAIN COMPOSITION
// =========================================================
function PeaceLily() {
  return (
    // --- FIX: LOWERED WHOLE STRUCTURE ---
    // Moved from -1 to -1.6 to lower it on screen
    <group position={[0, -1.6, 0]}>
      {/* 1. The "Perfect" Wide Flower on the Left */}
      <TheOriginalFlower />
      
      {/* 2. The Curled Bud on the Right (with seamless spadix) */}
      <TheCurledBud />
      
      {/* 3. The Big Green Leaf Behind them (with veins) */}
      <TheBackgroundLeaf />
      
      {/* --- FIX: REDUCED POT VISIBILITY --- */}
      {/* Base is now much lower and slightly thinner */}
      <mesh position={[0, -0.05, 0]}>
         <cylinderGeometry args={[0.3, 0.2, 0.1, 32]} />
         <meshStandardMaterial color="#1a0f05" roughness={1} />
      </mesh>
    </group>
  );
}

export default function PeaceLilyScene() {
  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className="w-full h-screen green-gradient-bg">
        <Canvas
          camera={{ position: [2, 2, 5], fov: 50 }}
          shadows
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-3, 2, -3]} intensity={0.5} color="#a8d5a8" />
          <spotLight
            position={[0, 4, 0]}
            angle={0.5}
            penumbra={1}
            intensity={1}
            color="#fff8e7"
          />
          <group position-y={-0.5}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                 <PeaceLily />
            </Float>
          </group>
          <Sparkles count={40} scale={10} size={3} speed={0.4} opacity={0.4} color="#60a5fa" />
          <OrbitControls enableZoom={true} target={[0, 1, 0]} />
        </Canvas>
      </div>
    </>
  );
}
