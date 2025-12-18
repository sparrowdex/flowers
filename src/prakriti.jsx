import React, { useMemo, useState } from 'react';
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
  .night-gradient-bg {
    background: linear-gradient(-45deg, #020617, #0f172a, #172554);
    background-size: 400% 400%;
    animation: green-gradient 30s ease infinite;
  }
`;

// =========================================================
//  HELPER: CURVED STEMS
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
      <tubeGeometry args={[curve, 64, thickness, 12, false]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

// =========================================================
//  HELPER: TEXTURED SPADIX (Pollen Bumps)
// =========================================================
function TexturedSpadix({ height, radius, color }) {
  const group = useMemo(() => {
    const bumps = [];
    const bumpCount = 200;
    for (let i = 0; i < bumpCount; i++) {
      const y = (Math.random() - 0.5) * height;
      const angle = Math.random() * Math.PI * 2;
      bumps.push(
        <mesh key={i} position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}>
          <sphereGeometry args={[radius * 0.25, 5, 5]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      );
    }
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[radius, radius, height, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {bumps}
      </group>
    );
  }, [height, radius, color]);
  return group;
}

// =========================================================
//  HELPER: GENERATE VEINS (ROBUST BOUNDARY CHECK)
// =========================================================
function LeafVeins({ width, height, curvature }) {
  const { spineCurve, veinCurves } = useMemo(() => {
    // 1. Create Spine Points (flush against leaf surface)
    const spinePoints = [];
    const segments = 20;
    for(let i=0; i<=segments; i++) {
        const t = i/segments; 
        const y = t * height;
        const yRel = t;
        const arch = Math.pow(yRel, 2) * curvature.back;
        const z = -arch;
        const yAdjusted = y - Math.sin(arch) * (height * 0.1);
        spinePoints.push(new THREE.Vector3(0, yAdjusted, z)); 
    }
    const spineCurve = new THREE.CatmullRomCurve3(spinePoints);

    // 2. Create Lateral Veins
    const veinCurves = [];
    const veinCount = 14; 
    
    for(let i=1; i<veinCount-1; i++) {
        const t = i / veinCount;
        
        // --- BOUNDARY CHECK LOGIC ---
        // Approximate the actual leaf width at height t
        const leafWidthAtT = (t) => {
          if (t < 0.2) {
             return width * 0.6 * (t / 0.2);
          } else if (t < 0.7) {
             const progress = (t - 0.2) / 0.5;
             return width * 0.6 + (width * 0.5 - width * 0.6) * progress;
          } else {
             const progress = (t - 0.7) / 0.3;
             const remainingWidth = width * 0.5 * (1 - progress);
             return Math.max(remainingWidth, 0.02);
          }
        };

        // Safety margin: 85% of calculated width
        const maxAvailableWidth = leafWidthAtT(t) * 0.85; 

        // Start Point (Spine)
        const startPt = spineCurve.getPoint(t);
        
        // Target Length
        let targetX = maxAvailableWidth * 0.75; 
        
        // Clamp
        const xSide = Math.min(targetX, maxAvailableWidth - 0.02);
        
        const yRel = t;
        const arch = Math.pow(yRel, 2) * curvature.back;
        const cup = Math.pow(xSide, 1.8) * curvature.cup * (1 - yRel * 0.5);
        const zEdge = -arch + cup;
        
        // Flush Y-adjustment
        const yEdge = (t * height) - Math.sin(arch) * (height * 0.1); 
        
        const endPt = new THREE.Vector3(xSide, yEdge, zEdge);
        const endPtLeft = new THREE.Vector3(-xSide, yEdge, zEdge);
        
        // Control points
        const controlY = startPt.y + (height * 0.06); 
        const controlPt = new THREE.Vector3(xSide * 0.4, controlY, startPt.z - 0.01); 
        const controlPtLeft = new THREE.Vector3(-xSide * 0.4, controlY, startPt.z - 0.01);

        veinCurves.push(new THREE.QuadraticBezierCurve3(startPt, controlPt, endPt));
        veinCurves.push(new THREE.QuadraticBezierCurve3(startPt, controlPtLeft, endPtLeft));
    }

    return { spineCurve, veinCurves };
  }, [width, height, curvature]);

  return (
    <group>
        <mesh>
            <tubeGeometry args={[spineCurve, 32, 0.012, 8, false]} />
            <meshStandardMaterial color="#2d5a2d" roughness={0.8} />
        </mesh>
        {veinCurves.map((curve, i) => (
            <mesh key={i}>
                <tubeGeometry args={[curve, 16, 0.004, 6, false]} />
                <meshStandardMaterial color="#2d5a2d" roughness={0.8} />
            </mesh>
        ))}
    </group>
  );
}

// =========================================================
//  ENGINE 1: THE WIDE FLOWER (Updated Spadix Z-Position)
// =========================================================
function useOriginalFlowerGeo() {
  return useMemo(() => {
    const spatheShape = new THREE.Shape();
    spatheShape.moveTo(0, 0); 
    spatheShape.bezierCurveTo(0.45, 0.15, 0.5, 0.5, 0.42, 1.0);
    spatheShape.bezierCurveTo(0.35, 1.4, 0.15, 1.8, 0, 2.0); 
    spatheShape.bezierCurveTo(-0.15, 1.8, -0.35, 1.4, -0.42, 1.0);
    spatheShape.bezierCurveTo(-0.5, 0.5, -0.45, 0.15, 0, 0);

    const extrudeSettings = {
      depth: 0.01,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.02,
      bevelSegments: 5,
      steps: 4
    };

    const geom = new THREE.ExtrudeGeometry(spatheShape, extrudeSettings);
    const positions = geom.attributes.position;
    const petalHeight = 2.0;

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = y / petalHeight;
      const arch = Math.pow(normalizedY, 2) * 0.1; 
      const cup = Math.pow(Math.abs(positions.getX(i)), 1.5) * 0.4 * (1 - normalizedY * 0.5); 
      const tipBend = Math.pow(normalizedY, 6) * -0.05; 
      positions.setZ(i, positions.getZ(i) - arch + cup + tipBend);
    }

    geom.computeVertexNormals();
    return geom;
  }, []);
}

// =========================================================
//  ENGINE 2: SOFT ORGANIC ENGINE
// =========================================================
const createSoftOrganicGeo = ({ width, height, curvature, isBud = false }) => {
    const shape = new THREE.Shape(); 
    shape.moveTo(0,0);
    if(isBud){ 
      shape.quadraticCurveTo(-width/2, height*0.3, -width*0.05, height); 
      shape.quadraticCurveTo(width/2, height*0.3, 0,0); 
    }
    else{ 
      shape.bezierCurveTo(-width*0.6, height*0.2, -width*0.5, height*0.7, 0, height); 
      shape.bezierCurveTo(width*0.5, height*0.7, width*0.6, height*0.2, 0,0); 
    }

    const geometry = new THREE.ExtrudeGeometry(shape, { 
      steps: 32, 
      depth: 0.005, 
      bevelEnabled: true, 
      bevelThickness: 0.005, 
      bevelSize: 0.01, 
      bevelSegments: 8 
    });
    
    const pos = geometry.attributes.position; 
    const v = new THREE.Vector3(); 
    geometry.computeBoundingBox();
    const minY = geometry.boundingBox.min.y; 
    const h = geometry.boundingBox.max.y - minY;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); 
      const yRel = Math.max(0, (v.y - minY) / h);
      
      const arch = Math.pow(yRel, 2) * curvature.back; 
      v.z -= arch;
      const cup = Math.pow(Math.abs(v.x), 1.8) * curvature.cup * (1 - yRel * 0.5); 
      v.z += cup;

      if (isBud) { 
        const twist = yRel * 6.0; 
        const tx = v.x * Math.cos(twist) - (v.z+0.02) * Math.sin(twist); 
        const tz = v.x * Math.sin(twist) + (v.z+0.02) * Math.cos(twist); 
        v.x = tx; 
        v.z = tz - 0.02; 
      }
      
      v.y -= Math.sin(arch) * (h * 0.1); 
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals(); 
    return geometry;
};

// =========================================================
//  COMPONENTS
// =========================================================
function TheOriginalFlower() {
  const stemEnd = [-0.4, 1.4, 0.2];
  const geo = useOriginalFlowerGeo();

  return (
    <group>
      <OrganicStem start={[-0.1, 0, 0.1]} end={stemEnd} control={[-0.2, 0.7, 0.1]} thickness={0.022} />
      
      {/* Main Flower Pivot */}
      <group position={stemEnd} rotation={[0.15, 0, 0]}>
        
        {/* 1. SPADIX (Pollen) */}
        {/* FIX: Moved Z from 0.03 to 0.08 to prevent clipping behind the leaf */}
        <group position={[0, 0.0, 0.08]} rotation={[-0.15, 0, 0]}>
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.2, 16]} />
                <meshStandardMaterial color="#f2e8b6" roughness={0.8} />
                <TexturedSpadix height={1.2} radius={0.04} color="#f2e8b6" />
            </mesh>
        </group>

        {/* 2. SPATHE (White Leaf) */}
        {/* FIX: Moved Z from -0.03 to -0.05 to create more gap behind spadix */}
        <mesh geometry={geo} position={[0, 0, -0.05]}>
          <meshStandardMaterial color="#fdfdf8" side={THREE.DoubleSide} roughness={0.3} />
        </mesh>
        
      </group>
    </group>
  );
}

function TheCurledBud() {
  const stemEnd = [0.4, 1.6, 0.1];
  const geo = useMemo(() => createSoftOrganicGeo({
    width: 0.5, height: 1.9, curvature: { back: 0.1, cup: 3.2 }, isBud: true
  }), []);

  return (
    <group>
      <OrganicStem start={[0.2, 0, 0.05]} end={stemEnd} control={[0.35, 0.8, 0.05]} thickness={0.022} />
      <group position={stemEnd} rotation={[0.1, 0.3, 0]}>
          <mesh position={[0, 0.4, 0.02]}>
             <cylinderGeometry args={[0.02, 0.022, 0.8, 12]} />
             <meshStandardMaterial color="#0f330f" /> 
          </mesh>
          <group position={[0, 0.9, 0.04]}> 
             <TexturedSpadix height={0.8} radius={0.025} color="#f2e8b6" />
          </group>
          <mesh geometry={geo}>
             <meshPhysicalMaterial color="#d1ebd1" roughness={0.4} transmission={0.2} side={THREE.DoubleSide} />
          </mesh>
      </group>
    </group>
  );
}

function TheBackgroundLeaf() {
  const stemEnd = [0, 1.8, -0.4];
  const curvature = { back: 1.3, cup: 0.5 };
  
  const geo = useMemo(() => createSoftOrganicGeo({
    width: 1.6, height: 2.7, curvature: curvature, isBud: false
  }), []);

  return (
    <group>
       <OrganicStem start={[0, 0, -0.2]} end={stemEnd} control={[0, 0.9, -0.3]} thickness={0.03} />
       <group position={stemEnd}>
         
         <mesh geometry={geo}>
           <meshPhysicalMaterial color="#133d13" roughness={0.6} side={THREE.DoubleSide} />
         </mesh>

         <LeafVeins width={1.6} height={2.7} curvature={curvature} />

       </group>
    </group>
  );
}

// =========================================================
//  MAIN COMPOSITION
// =========================================================
function PeaceLily() {
  return (
    <group position={[0, -1.8, 0]}>
      <TheOriginalFlower />
      <TheCurledBud />
      <TheBackgroundLeaf />
      <mesh position={[0, -0.05, 0]}>
         <cylinderGeometry args={[0.25, 0.2, 0.15, 32]} />
         <meshStandardMaterial color="#1a0f05" />
      </mesh>
    </group>
  );
}

export default function PeaceLilyScene() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <>
      <style>{animatedBackgroundStyle}</style>
      <div className={`w-full h-screen ${isDarkMode ? 'night-gradient-bg' : 'green-gradient-bg'}`}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }} shadows>
          <ambientLight intensity={isDarkMode ? 0.8 : 0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-3, 2, -3]} intensity={0.5} color="#a8d5a8" />
          <group position-y={-0.2}>
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                 <PeaceLily />
            </Float>
          </group>
          <Sparkles count={30} scale={8} size={2} speed={0.3} opacity={0.3} color="#60a5fa" />
          <OrbitControls enableZoom={true} target={[0, 1.5, 0]} />
        </Canvas>
      </div>
    </>
  );
}