import React, { useRef, useState } from 'react';
import { useTexture, Text, Float } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import greatVibesFont from './fonts/GreatVibes-Regular.ttf';

export default function LetterStyle({ name, description }) {
  const groupRef = useRef();
  const headerRef = useRef();
  const bodyRef = useRef(); 
  
  const startTime = useRef(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const { viewport } = useThree();

  const paperTexture = useTexture('/texture/letter_paper.jpg');
  paperTexture.wrapS = THREE.RepeatWrapping;
  paperTexture.wrapT = THREE.RepeatWrapping;
  paperTexture.repeat.set(1, 1);

  // Strip HTML and join paragraphs
  const cleanDescription = description
    .map(paragraph => paragraph.replace(/<[^>]+>/g, '').trim())
    .join('\n\n');

  // Auto-capitalize the name for the header (e.g. "prakriti" -> "Prakriti")
  const formattedName = name 
    ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() 
    : '';

  // --- STRICTER SIZING LOGIC ---
  const charLength = cleanDescription.length;
  let optimalFontSize = 0.32;
  let optimalLineHeight = 1.5;

  // Dynamically shrink text based on length so it NEVER spills off the paper
  if (charLength > 350) {
    optimalFontSize = 0.23; // Very long text (like Peace Lily)
    optimalLineHeight = 1.3;
  } else if (charLength > 250) {
    optimalFontSize = 0.26; // Medium text (like Lotus)
    optimalLineHeight = 1.4;
  } else if (charLength > 150) {
    optimalFontSize = 0.29; // Short text
    optimalLineHeight = 1.4;
  }

  // Use maximum horizontal width to save vertical space
  const optimalMaxWidth = 5.6; 

  const isMobile = viewport.width < 5;
  const responsiveScale = isMobile ? 0.55 : 0.75; 
  // Keep it shifted up slightly so it clears the button
  const responsiveY = isMobile ? 0.2 : 0.2; 

  useFrame((state) => {
    if (groupRef.current && !isMobile) {
      const targetY = state.pointer.x * 0.15;
      const targetX = -state.pointer.y * 0.15;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
    }

    if (!isInitialized) {
      startTime.current = state.clock.getElapsedTime();
      setIsInitialized(true);
    }
    const elapsed = state.clock.getElapsedTime() - startTime.current;

    if (headerRef.current) {
      headerRef.current.fillOpacity = THREE.MathUtils.clamp((elapsed - 0.5) / 2.0, 0, 1);
    }

    if (bodyRef.current) {
      bodyRef.current.fillOpacity = THREE.MathUtils.clamp((elapsed - 2.5) / 4.0, 0, 1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group position={[0, responsiveY, 0]} scale={responsiveScale} rotation={[0.02, 0, -0.04]}>
        <group ref={groupRef}>
          
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6.5, 9.5, 0.05]} /> 
            <meshStandardMaterial 
              map={paperTexture}
              bumpMap={paperTexture}
              bumpScale={0.01} 
              roughness={0.8}
              metalness={0.05}
              color="#ffffff" 
            />
          </mesh>

          {/* CALLIGRAPHY HEADER */}
          <Text
            ref={headerRef}
            fillOpacity={0}
            position={[0, 3.6, 0.03]} // Shifted up to give the body more room
            fontSize={0.8}
            color="#1a1a1a"
            font={greatVibesFont}
            anchorX="center"
            anchorY="top"
          >
            For You, {formattedName}
          </Text>

          {/* BODY TEXT */}
          <Text
            ref={bodyRef}
            fillOpacity={0}
            position={[0, 2.2, 0.03]} // Shifted up closer to the header
            fontSize={optimalFontSize}
            color="#2a2a2a"
            maxWidth={optimalMaxWidth}
            lineHeight={optimalLineHeight}
            textAlign="center"
            anchorX="center"
            anchorY="top"
          >
            {cleanDescription}
          </Text>

        </group>
      </group>
    </Float>
  );
}