import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { THEME_CONFIG } from '../constants';
import { Sparkles } from '@react-three/drei';

export const TreeTopStar = ({ visible }: { visible: boolean }) => {
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.8;
    const innerRadius = 0.35;
    const points = 5;
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    beveled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 3
  };

  const starRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!visible || !starRef.current) return;
    const t = state.clock.getElapsedTime();
    starRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    starRef.current.position.y = 8.2 + Math.sin(t * 2) * 0.1;
  });

  return (
    <group ref={starRef} visible={visible} position={[0, 8.2, 0]}>
      <mesh rotation={[0, 0, Math.PI / 10]}>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial 
          color={THEME_CONFIG.star} 
          emissive={THEME_CONFIG.star} 
          emissiveIntensity={15} 
        />
      </mesh>
      
      {/* Intense glow point light */}
      <pointLight color={THEME_CONFIG.star} intensity={12} distance={8} decay={2} />
      
      {/* Dynamic sparkles around the star */}
      <Sparkles 
        count={40} 
        scale={1.5} 
        size={4} 
        speed={1.2} 
        color={THEME_CONFIG.star} 
        noise={1}
      />
    </group>
  );
};