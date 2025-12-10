import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';


// L-System implementation
class LSystem {
  constructor(axiom, rules, iterations) {
    this.axiom = axiom;
    this.rules = rules;
    this.iterations = iterations;
  }


  generate() {
    let current = this.axiom;
    for (let i = 0; i < this.iterations; i++) {
      let next = '';
      for (let char of current) {
        next += this.rules[char] || char;
      }
      current = next;
    }
    return current;
  }
}


// Interpret L-system string into 3D positions and orientations
function interpretLSystem(lString, angleVariation = 25, segmentLength = 0.15) {
  const branches = [];
  const stack = [];
  let position = new THREE.Vector3(0, 0, 0);
  let direction = new THREE.Vector3(0, 1, 0);
  let rotation = new THREE.Euler(0, 0, 0);
 
  const angle = angleVariation * Math.PI / 180;
 
  for (let char of lString) {
    switch(char) {
      case 'F': // Move forward and draw
        const newPos = position.clone().add(
          direction.clone().multiplyScalar(segmentLength)
        );
        branches.push({
          start: position.clone(),
          end: newPos.clone(),
          rotation: rotation.clone()
        });
        position = newPos;
        break;
       
      case '+': // Turn right
        const rightQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1), angle
        );
        direction.applyQuaternion(rightQuat);
        break;
       
      case '-': // Turn left
        const leftQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1), -angle
        );
        direction.applyQuaternion(leftQuat);
        break;
       
      case '&': // Pitch down
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), angle
        );
        direction.applyQuaternion(pitchQuat);
        break;
       
      case '^': // Pitch up
        const pitchUpQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), -angle
        );
        direction.applyQuaternion(pitchUpQuat);
        break;
       
      case '\\': // Roll right
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), angle
        );
        direction.applyQuaternion(rollQuat);
        break;
       
      case '/': // Roll left
        const rollLeftQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), -angle
        );
        direction.applyQuaternion(rollLeftQuat);
        break;
       
      case '[': // Save state
        stack.push({
          position: position.clone(),
          direction: direction.clone(),
          rotation: rotation.clone()
        });
        break;
       
      case ']': // Restore state
        const state = stack.pop();
        if (state) {
          position = state.position;
          direction = state.direction;
          rotation = state.rotation;
        }
        break;
    }
  }
 
  return branches;
}


// Individual leaf
function Leaf({ position, rotation, scale }) {
  const leafRef = useRef();


  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (leafRef.current) {
      // A subtle sway animation
      leafRef.current.rotation.z += Math.sin(t * 0.5 + position.x * 10) * 0.001;
    }
  });


  const leafShape = new THREE.Shape();
  // A simple, elegant leaf shape
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.4, 0.5, 0.5, 1.2); // Right side curve
  leafShape.quadraticCurveTo(0.2, 0.8, -0.5, 1.2); // Tip and left side curve
  leafShape.quadraticCurveTo(-0.4, 0.5, 0, 0);  // Curve back to base


  const extrudeSettings = {
      steps: 1,
      depth: 0.01,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.01,
      bevelSegments: 1
  };


  const leafGeometry = new THREE.ExtrudeGeometry(leafShape, extrudeSettings);


  return (
    <group ref={leafRef} position={position} rotation={rotation} scale={scale}>
      <mesh geometry={leafGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#2f5f2a"
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}


// Bent Leaf with a stem, designed to look more natural
function BentLeaf({ position, rotation, scale }) {
  const leafRef = useRef();

  const leafHeight = 1.2; // The height of the leaf blade
  const stemHeight = 0.4; // The length of the stem
  const stemThickness = 0.02;

  // Memoize the geometry for the leaf blade to prevent re-creating it on every render
  const bentLeafGeometry = useMemo(() => {
    const leafShape = new THREE.Shape();
    // A simple, elegant leaf shape
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.4, 0.5, 0.5, 1.2); // Right side
    leafShape.quadraticCurveTo(0.2, 0.8, -0.5, 1.2); // Tip and left side
    leafShape.quadraticCurveTo(-0.4, 0.5, 0, 0);  // Curve back to base

    const extrudeSettings = {
      steps: 2,
      depth: 0.01,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.01,
      bevelSegments: 2,
    };

    const geom = new THREE.ExtrudeGeometry(leafShape, extrudeSettings);
    const positions = geom.attributes.position;

    // Deform the geometry to create a bend only at the tip
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = y / leafHeight;

      const bendThreshold = 0.5;
      if (normalizedY > bendThreshold) {
        const t = (normalizedY - bendThreshold) / (1.0 - bendThreshold);
        const bendFactor = Math.pow(t, 2) * -0.8;
        positions.setZ(i, positions.getZ(i) + bendFactor);
      }
    }
    
    geom.computeVertexNormals(); // Recalculate normals for accurate lighting
    return geom;
  }, [leafHeight]);

  return (
    <group ref={leafRef} position={position} rotation={rotation} scale={scale}>
      {/* Stem: A cylinder positioned to extend downwards from the leaf blade */}
      <mesh position={[0, -stemHeight / 2, 0]}>
        <cylinderGeometry args={[stemThickness, stemThickness, stemHeight, 6]} />
        <meshStandardMaterial color="#4a7a3a" roughness={0.6} />
      </mesh>
      
      {/* Leaf Blade: Positioned at the origin of the group, appearing to grow from the stem */}
      <mesh geometry={bentLeafGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#2f5f2a"
          side={THREE.DoubleSide}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}


// Peace Lily Flower
function PeaceLilyFlower({ position, glowIntensity }) {
  // Create a memoized geometry for the spathe, with added curvature.
  const spatheGeometry = useMemo(() => {
    // 1. Define the 2D shape of the petal
    const spatheShape = new THREE.Shape();
    spatheShape.moveTo(0, 0);
    spatheShape.bezierCurveTo(0.25, 0.2, 0.3, 0.5, 0.25, 0.8);
    spatheShape.bezierCurveTo(0.18, 0.95, 0.05, 1.0, 0, 1.05);
    spatheShape.bezierCurveTo(-0.05, 1.0, -0.18, 0.95, -0.25, 0.8);
    spatheShape.bezierCurveTo(-0.3, 0.5, -0.25, 0.2, 0, 0);

    const extrudeSettings = {
      depth: 0.02, // Reduced thickness for a more delicate look
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2
    };

    // 2. Create the base geometry
    const geom = new THREE.ExtrudeGeometry(spatheShape, extrudeSettings);
    const positions = geom.attributes.position;
    const petalHeight = 1.05; // Height is known from the shape definition

    // 3. Deform the geometry for a more organic look
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = y / petalHeight; // Normalize Y to a 0-1 range

      // Add a gentle C-curve along the petal's length (in the z-direction)
      const curve = -Math.sin(normalizedY * Math.PI) * 0.07;
      
      // Add a slight backward bend, strongest at the tip
      const tipBend = Math.pow(normalizedY, 5) * -0.12;

      // Apply the deformations to the vertex's Z position
      positions.setZ(i, positions.getZ(i) + curve + tipBend);
    }
    
    geom.computeVertexNormals(); // Recalculate normals for correct lighting
    return geom;
  }, []);

  return (
    <group position={position}>
      {/* White spathe with custom curved geometry, lowered to meet the spadix */}
      <mesh geometry={spatheGeometry} rotation={[-0.3, 0, 0]} position={[0, -0.075, 0]}>
        <meshStandardMaterial
          color="#fdfdf8"
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>

      {/* Spadix (pushed back slightly) */}
      <group position={[0, 0.15, -0.02]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.04, 0.45, 12]} />
          <meshStandardMaterial
            color="#dcd494"
            roughness={0.7}
            emissive="#f0e4a0"
            emissiveIntensity={glowIntensity}
          />
        </mesh>
       
        {/* Texture bumps */}
        {Array.from({ length: 25 }).map((_, i) => {
          const y = (i / 25) * 0.45 - 0.225;
          const angle = (i * 137.5 * Math.PI) / 180;
          const radius = 0.032;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.008, 4, 4]} />
              <meshStandardMaterial color="#c4b87a" roughness={0.9} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}


// Generates a circle of leaves facing outwards
function Leaves() {
  const leafCount = 4; // Simplified to 4 leaves as requested
  const leaves = useMemo(() => {
    return Array.from({ length: leafCount }).map((_, i) => {
      // Position them symmetrically
      const angle = (i / leafCount) * Math.PI * 2;
      const radius = 0.25; // A slightly larger, fixed radius for spacing
     
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
     
      // Orient them to face outwards
      const rotationY = angle + Math.PI / 2;
     
      return {
        position: [x, 0.1, z],
        rotation: [
          0.4, // Consistent upward pitch
          rotationY,
          0
        ],
        scale: 0.9 // Consistent scale
      };
    });
  }, []);


  return (
    <group>
      {leaves.map((props, i) => (
        <Leaf key={i} {...props} />
      ))}
    </group>
  );
}


// Generates the central flower stalks
function FlowerStalks() {
  const [glowIntensity, setGlowIntensity] = useState(0);


  // Generate 2 shorter stalks
  const stalks = useMemo(() => {
    const stalkSys1 = new LSystem('F', { 'F': 'FF' }, 2); // Reduced iterations to 2
    const stalk1String = stalkSys1.generate();
    // Shorter segment length
    const stalk1Branches = interpretLSystem(stalk1String, 5, 0.2);


    const stalkSys2 = new LSystem('F', { 'F': 'FF' }, 2); // Reduced iterations to 2
    const stalk2String = stalkSys2.generate();
    // Shorter segment length
    const stalk2Branches = interpretLSystem(stalk2String, -4, 0.22);


    return [
        { branches: stalk1Branches, position: [0.05, 0, -0.05] },
        { branches: stalk2Branches, position: [-0.05, 0, 0.05] }
    ];
  }, []);


  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    setGlowIntensity(0.4 + Math.sin(t * 1.2) * 0.2);
  });


  return (
    <group>
      {stalks.map((stalk, stalkIndex) => (
        <group key={stalkIndex} position={stalk.position}>
          {stalk.branches.map((branch, i) => {
            const direction = new THREE.Vector3().subVectors(branch.end, branch.start);
            const length = direction.length();
            const orientation = new THREE.Quaternion();
            const upVector = new THREE.Vector3(0, 1, 0);
            if (direction.length() > 0 && !direction.clone().normalize().equals(upVector)) {
                const axis = new THREE.Vector3().crossVectors(upVector, direction).normalize();
                const angle = Math.acos(upVector.dot(direction.clone().normalize()));
                orientation.setFromAxisAngle(axis, angle);
            }
            const thickness = 0.02;
           
            return (
              <mesh key={i} position={branch.start.clone().lerp(branch.end, 0.5)} quaternion={orientation}>
                <cylinderGeometry args={[thickness, thickness, length, 6]} />
                <meshStandardMaterial color="#4a7a3a" roughness={0.6} />
              </mesh>
            );
          })}
          {/* Add flower at the end of the last branch */}
          <PeaceLilyFlower
            position={stalk.branches[stalk.branches.length - 1].end}
            glowIntensity={glowIntensity}
          />
        </group>
      ))}
    </group>
  );
}


// Main plant with pot
function PeaceLily() {
  return (
    <group position={[0, -0.5, 0]} scale={0.8}>
      {/* Pot */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.2, 20]} />
        <meshStandardMaterial color="#3d2d1f" roughness={0.9} />
      </mesh>
     
      {/* Assemble the plant from its new parts */}
      <Leaves />
      <FlowerStalks />
    </group>
  );
}


// Particles
function Particles() {
  const ref = useRef();
  const count = 25;
  const positions = new Float32Array(count * 3);
 
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 1] = Math.random() * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }


  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });


  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#e8ddb5"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}


import FunFacts from './FunFacts';
import BirthdayMessage from './BirthdayMessage';

// Main App
export default function App() {
  const [stage, setStage] = useState('input');
  const [name, setName] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [showBirthdayMessage, setShowBirthdayMessage] = useState(true);


  const handleSubmit = () => {
    if (name.trim().toLowerCase() === 'prakriti') {
      setStage('message');
      setTimeout(() => setFadeIn(true), 100);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };


  const showAnimation = () => {
    setStage('animation');
  };


  return (
    <div className="animated-gradient w-full h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <audio src="/audio/soft_melody.m4a" autoPlay loop hidden />
      {stage === 'input' && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-8 p-8">
            <h1 className="text-5xl font-light text-white mb-4">
              Discover Your Plant Identity
            </h1>
            <p className="text-xl text-green-200 mb-8">
              A special birthday gift awaits...
            </p>
            <div className="space-y-4 flex flex-col items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your name"
                className="px-6 py-4 text-2xl bg-white/10 border-2 border-green-300/50 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-300 w-80"
              />
              <button
                onClick={handleSubmit}
                className="w-80 px-6 py-4 text-xl bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/50"
              >
                Reveal
              </button>
            </div>
          </div>
        </div>
      )}


      {stage === 'message' && (
        <div className={`flex items-center justify-center h-full transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-2xl p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-green-300/30 shadow-2xl">
            <h2 className="text-4xl font-light text-white mb-6 text-center">
              Happy Birthday, Prakriti! 🌸
            </h2>
            <div className="space-y-4 text-green-100 text-lg leading-relaxed mb-8">
              <p>
                Your plant identity is the <span className="text-white font-medium">Peace Lily</span>.
              </p>
              <p>
                Like the Peace Lily, you carry a quiet elegance—a presence that doesn't demand attention but commands it naturally. Beneath your calm exterior burns a constant flame of determination and drive.
              </p>
              <p>
                The Peace Lily thrives in gentle light, yet its white bloom glows with an inner luminescence, just as you radiate strength and purpose even in moments of stillness.
              </p>
              <p className="text-white italic">
                Resilient. Graceful. Quietly powerful.
              </p>
            </div>
            <button
              onClick={showAnimation}
              className="w-full px-8 py-4 text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/50"
            >
              See Your Peace Lily Bloom ✨
            </button>
          </div>
        </div>
      )}


      {stage === 'animation' && (
        <div className="relative w-full h-full">
          {showBirthdayMessage && <BirthdayMessage />}
          <Canvas camera={{ position: [2, 1.5, 2.5], fov: 50 }}>
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
            <PeaceLily />
            <Particles />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={1.5}
              maxDistance={5}
              maxPolarAngle={Math.PI / 2.1}
            />
          </Canvas>
          <FunFacts />
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
            <h3 className="text-3xl font-light text-white mb-2">Your Peace Lily</h3>
            <p className="text-green-200">Drag to rotate • Scroll to zoom</p>
          </div>
        </div>
      )}
    </div>
  );
}