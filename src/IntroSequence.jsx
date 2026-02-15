import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sparkles } from '@react-three/drei';
import titleFont from './fonts/QuentineDEMO-Regular.otf';

const IntroSequence = ({ onFinish }) => {
  const textRef = useRef();
  const sparkleRef = useRef();
  const [opacity, setOpacity] = useState(0);
  const [phase, setPhase] = useState('in'); // 'in', 'stay', 'dissipate'

  useEffect(() => {
    console.log("IntroSequence: Mounted. Phase:", phase);
    
    const t1 = setTimeout(() => {
      setPhase('stay');
    }, 1500);
    
    const t2 = setTimeout(() => {
      setPhase('dissipate');
    }, 3500);
    
    const t3 = setTimeout(() => {
      console.log("IntroSequence: Sequence complete");
      onFinish();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  useFrame((state, delta) => {
    if (phase === 'in') {
      setOpacity(prev => Math.min(1, prev + delta * 0.8));
    } else if (phase === 'dissipate') {
      setOpacity(prev => Math.max(0, prev - delta * 1.2));
      if (sparkleRef.current) {
        sparkleRef.current.rotation.y += delta * 2;
        sparkleRef.current.scale.setScalar(sparkleRef.current.scale.x + delta * 3);
      }
    }
  });

  return (
    <group position={[0, 1.2, 0]} key="intro-group">
      {/* Debug Cube: If you see this pink box, the 3D engine is working! */}
      {phase === 'in' && (
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="pink" />
        </mesh>
      )}

      <Text
        ref={textRef}
        font={titleFont || undefined} // Fallback to default if font fails
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        The Heart Bloom
      </Text>
      <group ref={sparkleRef}>
        <Sparkles 
          count={phase === 'dissipate' ? 200 : 80} 
          scale={phase === 'dissipate' ? 12 : 4} 
          size={phase === 'dissipate' ? 6 : 2} 
          speed={phase === 'dissipate' ? 3 : 0.6} 
          opacity={opacity * 0.8} 
          color="#ffb3c1" 
        />
      </group>
    </group>
  );
};

export default IntroSequence;