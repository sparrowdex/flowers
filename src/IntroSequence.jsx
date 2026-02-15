import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sparkles } from '@react-three/drei';
import titleFont from './fonts/QuentineDEMO-Regular.otf';

const IntroSequence = ({ onFinish }) => {
  const textRef = useRef();
  const sparkleRef = useRef();
  const shimmerRef = useRef();
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
    const t = state.clock.elapsedTime;

    if (phase === 'in') {
      opacity.current = Math.min(1, opacity.current + delta * 0.8);
    } else if (phase === 'dissipate') {
      opacity.current = Math.max(0, opacity.current - delta * 1.2);
      if (sparkleRef.current) {
        sparkleRef.current.rotation.y += delta * 2;
        sparkleRef.current.scale.setScalar(sparkleRef.current.scale.x + delta * 3);
      }
    }

    // Shimmer light animation: moves a light across the text to create glints
    if (shimmerRef.current) {
      shimmerRef.current.position.x = Math.sin(t * 1.5) * 6;
    }

    if (textRef.current) {
      textRef.current.fillOpacity = opacity.current;
      if (textRef.current.material) {
        textRef.current.material.opacity = opacity.current;
      }
    }

    if (sparkleRef.current && sparkleRef.current.children[0]?.material) {
      sparkleRef.current.children[0].material.opacity = opacity.current * 0.8;
    }
  });

  return (
    <group position={[0, 1.5, 10]} key="intro-group">
      <Text
        ref={textRef}
        font={titleFont || undefined}
        fontSize={1.4}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
      >
        The Heart Bloom
        <meshStandardMaterial 
          color="white"
          emissive="#ffb3c1" 
          emissiveIntensity={2} 
          toneMapped={false} 
          transparent 
          opacity={0}
        />
      </Text>
      {/* Shimmer Light */}
      <pointLight ref={shimmerRef} position={[0, 0, 1]} intensity={5} color="#fff" distance={10} />
      
      <group ref={sparkleRef}>
        <Sparkles 
          count={phase === 'dissipate' ? 400 : 150} 
          scale={[12, 2, 1]} 
          size={6} 
          speed={1.5} 
          noise={1}
          opacity={0} 
          color="#fff" 
        />
      </group>
    </group>
  );
};

export default IntroSequence;