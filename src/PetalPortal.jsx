import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import plantData from './plantData';

const PetalPortal = ({ name, isRevealing, onBurstComplete }) => {
  const meshRef = useRef();
  const { viewport, size } = useThree();
  const isMobile = size.width < 600;
  const count = isMobile ? 80 : 150;

  // 1. REVERTED: Simple teardrop with SOFT curvature (no more boats!)
  const petalShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.4, 0.1, 0.8, 0.6, 0, 1.2);
    s.bezierCurveTo(-0.8, 0.6, -0.4, 0.1, 0, 0);
    return s;
  }, []);

  const petalGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(petalShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.02,
      bevelSegments: 3
    });

    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const yRel = v.y / 1.2;
      const cup = v.x * v.x * 0.4; // Soft cup
      const bend = yRel * yRel * 0.2; // Soft bend
      pos.setZ(i, v.z + cup - bend);
    }
    geo.computeVertexNormals();
    return geo;
  }, [petalShape]);

  // 2. REVERTED: Original independent drift factors
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      t: Math.random() * 100,
      factor: 20 + Math.random() * 100,
      speed: 0.005 + Math.random() / 400,
      xFactor: -5 + Math.random() * 10,
      yFactor: -5 + Math.random() * 10,
      zFactor: -5 + Math.random() * 10,
      scale: 0.6 + Math.random() * 1.0, // Keeping them large enough to see
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color());

  const targetColor = useMemo(() => {
    const userInput = name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (userInput === 'valentine') return '#ff2d75';

    // First, try to match by the friend's name (the key in plantData)
    let plant = plantData[userInput];

    if (!plant) {
      // If no match by name, try to match by the flower's name
      const plantKey = Object.keys(plantData).find(key =>
        plantData[key].plantName && plantData[key].plantName.toLowerCase() === userInput
      );
      if (plantKey) {
        plant = plantData[plantKey];
      }
    }
    if (plant) {
      const colorMap = {
        'Peace Lily': '#ffffff', 'Gladiolus': '#ff8c00', 'Pink Carnation': '#ffb7c5',
        'Blue Orchid': '#3b82f6', 'Sweet Pea': '#ff69b4', 'Lotus': '#ffb6c1'
      };
      return colorMap[plant.plantName] || '#0f330f';
    }
    return '#1a4015'; // Slightly lighter forest green to avoid "dust" look
  }, [name]);

  useEffect(() => {
    if (isRevealing && meshRef.current) {
      const tl = gsap.timeline({ onComplete: onBurstComplete });
      tl.to(meshRef.current.scale, { x: 12, y: 12, z: 12, duration: 2.5, ease: "power2.inOut" });
      tl.to(meshRef.current.position, { z: 20, duration: 2.5, ease: "power2.inOut" }, 0);
    }
  }, [isRevealing, onBurstComplete]);

  useFrame((state) => {
    color.set(targetColor);
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t = t + (isRevealing ? speed * 8 : speed * 0.4);
      const s = Math.cos(t);
      
      // 3. REVERTED: Original full-screen independent positioning
      dummy.position.set(
        (viewport.width / 2) * xFactor + (Math.cos(t) * factor) / 10,
        (viewport.height / 2) * yFactor + (Math.sin(t) * factor) / 10,
        (viewport.width / 2) * zFactor + (Math.cos(t) * factor) / 10
      );
      
      dummy.rotation.set(s * 3, s * 3, s * 3);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.rotation.y += isRevealing ? 0.02 : 0.0003;
  });

  return (
    <instancedMesh ref={meshRef} args={[petalGeometry, null, count]}>
      <meshPhysicalMaterial 
        color={targetColor}
        emissive={targetColor}
        emissiveIntensity={0.5} // Key fix: keeps them from looking like dark dust
        transmission={0.4} 
        roughness={0.2} 
        thickness={1.5} 
        sheen={1}
        sheenColor="#fff"
        transparent 
      />
    </instancedMesh>
  );
};

export default PetalPortal;