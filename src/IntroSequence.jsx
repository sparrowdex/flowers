import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sparkles } from '@react-three/drei';
import titleFont from './fonts/QuentineDEMO-Regular.otf';

const IntroSequence = ({ onFinish }) => {
  const textRef = useRef();
  const sparkleRef = useRef();
  const [phase, setPhase] = useState('in'); // 'in', 'stay', 'dissipate'
  const opacity = useRef(0);

  useEffect(() => {
    console.log("IntroSequence: Started");
    
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
      opacity.current = Math.min(1, opacity.current + delta * 0.8);
    } else if (phase === 'dissipate') {
      opacity.current = Math.max(0, opacity.current - delta * 1.2);
      if (sparkleRef.current) {
        sparkleRef.current.rotation.y += delta * 2;
        sparkleRef.current.scale.setScalar(sparkleRef.current.scale.x + delta * 3);
        // Manually update the sparkles' material opacity for a smooth fade-out
        if (sparkleRef.current.children[0]?.material) {
          sparkleRef.current.children[0].material.opacity = opacity.current * 0.8;
        }
      }
    }

    if (textRef.current) {
      textRef.current.fillOpacity = opacity.current;
    }
  });

  return (
    <group position={[0, 1.5, 10]} key="intro-group">
      <Text
        ref={textRef}
        font={titleFont || undefined}
        fontSize={1.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
      >
        The Heart Bloom
      </Text>
      <group ref={sparkleRef}>
        <Sparkles 
          count={phase === 'dissipate' ? 200 : 80} 
          scale={phase === 'dissipate' ? 12 : 4} 
          size={phase === 'dissipate' ? 6 : 2} 
          speed={phase === 'dissipate' ? 3 : 0.6} 
          opacity={opacity.current * 0.8} 
          color="#ffb3c1" 
        />
      </group>
    </group>
  );
};

export default IntroSequence;