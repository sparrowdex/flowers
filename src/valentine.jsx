import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sparkles, Float, Environment, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- SHARED CONFIGURATION ---
const CONFIG = {
  mainColor: "#c2185b",    
  emissiveColor: "#4a001e", 
  sheenColor: "#ff99bb",    
  stemColor: "#1a4015",
  soulColor: "#ff4d6d",     
};

// --- 1. JELLY HEART SHAPE ---
const heartShape = new THREE.Shape();
heartShape.moveTo(0, 0);
heartShape.bezierCurveTo(0, 0.5, -0.8, 1, -0.8, 1.8);
heartShape.bezierCurveTo(-0.8, 2.5, 0, 3, 0, 1.2); 
heartShape.bezierCurveTo(0, 3, 0.8, 2.5, 0.8, 1.8);
heartShape.bezierCurveTo(0.8, 1, 0, 0.5, 0, 0);

// --- 2. SOUL HEART SYSTEM ---
function SoulHeartSystem({ isOpen }) {
  const groupRef = useRef();
  const [active, setActive] = useState(false);
  const [yPos, setYPos] = useState(0);
  const [xOffset, setXOffset] = useState(0); 

  useFrame((state) => {
    if (!active && isOpen) {
      setActive(true);
      setYPos(0); 
    }

    if (active) {
      setYPos((prev) => prev + 0.015); 
      const sway = Math.sin(yPos * 3) * 0.5; 
      setXOffset(sway);

      if (yPos > 10) {
        setActive(false);
      }
    }
    
    if (groupRef.current) {
      groupRef.current.position.x = xOffset;
      groupRef.current.position.y = 1.5 + yPos;
      groupRef.current.rotation.y += 0.02;
      const targetScale = active ? 0.2 : 0;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1));
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[0, 0, Math.PI]}> 
        <extrudeGeometry args={[heartShape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }]} />
        <meshPhysicalMaterial 
            color={CONFIG.mainColor} 
            emissive={CONFIG.soulColor} 
            emissiveIntensity={2}
            toneMapped={false} 
        />
      </mesh>
      {active && (
        <Sparkles count={10} scale={1} size={3} speed={0.2} opacity={0.5} color="#fff" position={[0, -0.2, 0]} />
      )}
    </group>
  );
}

// --- 3. STEM & LEAVES ---
function StemWithLeaves() {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -6, 0),      
      new THREE.Vector3(0.5, -3, 0.5), 
      new THREE.Vector3(0, 0, 0)
    ]);
  }, []);

  const leafPoints = useMemo(() => {
    return [
      { pos: curve.getPoint(0.3), rot: [0.5, 0.5, -1.5], scale: 0.25 },
      { pos: curve.getPoint(0.45), rot: [0.3, -0.5, 1.5], scale: 0.2 },
      { pos: curve.getPoint(0.65), rot: [0.2, 0.8, -1.2], scale: 0.18 },
      { pos: curve.getPoint(0.75), rot: [0.1, -0.4, 1.4], scale: 0.15 }
    ];
  }, [curve]);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 24, 0.05, 8, false]} />
        <meshStandardMaterial color={CONFIG.stemColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={CONFIG.stemColor} />
      </mesh>
      {leafPoints.map((leaf, i) => (
        <group key={i} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale}>
           <mesh>
            <extrudeGeometry args={[heartShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
            <meshStandardMaterial color={CONFIG.stemColor} roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// --- 4. PETAL ---
function HeartPetal({ rotationOffset, minTilt, maxTilt, yOffset, scale = 1, openProgress }) {
  const groupRef = useRef();
  
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: CONFIG.mainColor,      
    emissive: CONFIG.emissiveColor, 
    emissiveIntensity: 0.3,       
    roughness: 0.6,               
    metalness: 0.0,
    clearcoat: 0.0,               
    sheen: 1.0,                   
    sheenColor: CONFIG.sheenColor,
    sheenRoughness: 0.5,
    side: THREE.DoubleSide
  }), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const currentTilt = THREE.MathUtils.lerp(minTilt, maxTilt, openProgress);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, currentTilt, 0.05
    );
  });

  return (
    <group position={[0, yOffset, 0]} rotation={[0, rotationOffset, 0]}>
      <group ref={groupRef}>
        <mesh scale={scale} position={[0, 0, 0]}> 
          <extrudeGeometry args={[heartShape, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.02, steps: 1 }]} />
          <primitive object={material} />
        </mesh>
      </group>
    </group>
  );
}

// --- 5. FLOWER ---
function HeartBloomFlower({ openProgress }) {
  const layer1 = Array.from({ length: 4 }).map((_, i) => ({
    rot: (i / 4) * Math.PI * 2, minTilt: -0.1, maxTilt: 0.5, y: 0.1, scale: 0.25
  }));
  const layer2 = Array.from({ length: 6 }).map((_, i) => ({
    rot: (i / 6) * Math.PI * 2 + 0.5, minTilt: 0.1, maxTilt: 0.9, y: 0.05, scale: 0.35
  }));
  const layer3 = Array.from({ length: 8 }).map((_, i) => ({
    rot: (i / 8) * Math.PI * 2, minTilt: 0.2, maxTilt: 1.3, y: 0.02, scale: 0.5
  }));
  const layer4 = Array.from({ length: 12 }).map((_, i) => ({
    rot: (i / 12) * Math.PI * 2 + 0.5, minTilt: 0.3, maxTilt: 1.55, y: -0.01, scale: 0.65
  }));

  return (
    <group position={[0, 1.2, 0]}> 
      <StemWithLeaves />
      <SoulHeartSystem isOpen={openProgress > 0.9} />
      <Sparkles count={30} scale={2} size={3} speed={0.4} opacity={0.6} color="#ffe6f2" position={[0, 0.5, 0]} />
      {[...layer1, ...layer2, ...layer3, ...layer4].map((p, i) => (
        <HeartPetal 
          key={i} rotationOffset={p.rot} minTilt={p.minTilt} maxTilt={p.maxTilt}
          yOffset={p.y} scale={p.scale} openProgress={openProgress}
        />
      ))}
    </group>
  );
}

// --- 6. BACKGROUND ---
function FloatingJellyHearts({ count = 35 }) {
  const groupRef = useRef();
  const [burstHearts, setBurstHearts] = useState({});
  const messages = ["You are loved", "Stay sweet", "Bloom bright", "Magic is real", "Keep shining", "Heart of gold"];

  const hearts = useMemo(() => Array.from({ length: count }).map(() => ({
      pos: new THREE.Vector3((Math.random()-0.5)*14, (Math.random()-0.5)*12, (Math.random()-0.5)*8),
      scale: Math.random() * 0.15 + 0.1,
      speed: Math.random() * 0.5 + 0.2,
      rotation: [Math.random()*Math.PI, Math.random()*Math.PI, 0],
      msg: messages[Math.floor(Math.random() * messages.length)]
  })), [count]);

  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += 0.001; });

  return (
    <group ref={groupRef}>
      {hearts.map((h, i) => {
        const isBurst = burstHearts[i];
        return (
          <Float key={i} speed={h.speed} rotationIntensity={1} floatIntensity={1}>
            <group position={h.pos}>
              {!isBurst ? (
                <mesh 
                  rotation={h.rotation} scale={h.scale}
                  onClick={(e) => { e.stopPropagation(); setBurstHearts(prev => ({ ...prev, [i]: true })); }}
                >
                  <extrudeGeometry args={[heartShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 }]} />
                  <meshPhysicalMaterial color={CONFIG.mainColor} transmission={0.8} roughness={0} thickness={2} />
                </mesh>
              ) : (
                <Text fontSize={0.3} color="white" anchorX="center" anchorY="middle">{h.msg}</Text>
              )}
            </group>
          </Float>
        );
      })}
    </group>
  );
}

// --- 7. RESPONSIVE CAMERA ---
function ResponsiveCamera() {
  const { camera, size } = useThree();
  const isMobileRef = useRef(null);

  useEffect(() => {
    const isMobile = size.width < 600;
    if (isMobileRef.current !== isMobile) {
        camera.position.z = isMobile ? 28 : 18; 
        camera.position.y = 2; 
        camera.lookAt(0, 1.2, 0); 
        camera.updateProjectionMatrix();
        isMobileRef.current = isMobile;
    }
  }, [size.width, camera]);
  
  return null;
}

export default function VelvetRoseScene({ onBack }) {
  // START CLOSED (0) so the bloom feels earned
  const [openProgress, setOpenProgress] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isManuallyToggled, setIsManuallyToggled] = useState(false);

  // Manual toggle overrides the microphone temporarily
  const toggleBloom = (e) => {
    if (e) e.stopPropagation();
    setIsManuallyToggled(true);
    setOpenProgress(prev => (prev > 0.5 ? 0 : 1));
  };

  useEffect(() => {
    if (!micEnabled) return;

    let audioContext, analyser, dataArray, source;
    
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          // Noise Threshold: 60
          if (avg > 60) {
            setIsManuallyToggled(false); 
            setOpenProgress(prev => Math.min(prev + 0.05, 1));
          } else if (!isManuallyToggled) {
            setOpenProgress(prev => Math.max(prev - 0.005, 0));
          }
          requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error("Mic access denied", err);
      }
    };

    startMic();
    return () => audioContext?.close();
  }, [micEnabled, isManuallyToggled]);

  return (
    <div className="w-full h-screen relative" style={{ background: 'radial-gradient(circle, #1a000d 0%, #000 100%)' }}>
      <button onClick={onBack} className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">← Back</button>
      
      {/* --- INTRO SCREEN OVERLAY --- */}
      {!micEnabled && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-serif text-pink-500 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                Happy Valentine's Day
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-300 text-lg md:text-xl mb-12 max-w-md leading-relaxed">
                Blow into your microphone to make the flower bloom, or click the petals to reveal their secrets.
            </p>

            {/* Button */}
            <button 
                onClick={() => setMicEnabled(true)}
                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-pink-500/50 hover:scale-105 transition-all transform"
            >
                Start Experience ❤️
            </button>
        </div>
      )}
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault fov={45} position={[0, 2, 20]} />
        <ResponsiveCamera />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} intensity={2} color="#ffc0cb" penumbra={1} />
        <pointLight position={[0, 0, 2]} intensity={1} color="#ffffff" distance={3} />
        <Environment preset="studio" />

        <group onClick={toggleBloom}>
          <HeartBloomFlower openProgress={openProgress} />
        </group>
        <FloatingJellyHearts count={40} />
        <Sparkles count={60} scale={15} size={1} speed={0.4} opacity={0.3} color="#fff" />
        <OrbitControls makeDefault target={[0, 1.2, 0]} minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      </Canvas>
    </div>
  );
}