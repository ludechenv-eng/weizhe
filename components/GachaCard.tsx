import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { THEME_CONFIG } from '../constants';

interface GachaCardProps {
  active: boolean;
  position: [number, number, number];
  content: string;
  treeState: 'CONE' | 'EXPLODE';
}

const PARTICLE_COUNT = 40;

export const GachaCard: React.FC<GachaCardProps> = ({ active, position, content, treeState }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const shatterRef = useRef<THREE.InstancedMesh>(null!);
  
  const [isShattering, setIsShattering] = useState(false);
  const opacityRef = useRef(0);
  const scaleRef = useRef(0);
  const shatterProgressRef = useRef(0);

  // Initialize random particle data for shatter effect
  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        origin: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2.2, 0),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, Math.random() * 0.1),
        size: 0.05 + Math.random() * 0.08
      });
    }
    return data;
  }, []);

  // Detect transition from active to inactive specifically during CONE change
  useEffect(() => {
    if (!active && treeState === 'CONE' && opacityRef.current > 0.1) {
      setIsShattering(true);
      shatterProgressRef.current = 0;
      // Reset shattering after animation finishes
      const timer = setTimeout(() => setIsShattering(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [active, treeState]);

  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity: 0,
      color: '#ffffff',
      metalness: 0,
      roughness: 0.15,
      transmission: 0.95,
      thickness: 1,
      ior: 1.5,
      attenuationColor: new THREE.Color(THEME_CONFIG.leafPrimary),
      attenuationDistance: 0.5,
    });
  }, []);

  const shatterMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: THEME_CONFIG.leafPrimary,
      emissive: THEME_CONFIG.leafPrimary,
      emissiveIntensity: 5,
      transparent: true
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    // 1. Core Card Visibility & Positioning
    const targetOpacity = active ? 0.8 : 0;
    const targetScale = active ? 1 : (isShattering ? 1.2 : 0.8);
    
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.15);
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.15);

    if (meshRef.current) {
      meshRef.current.material.opacity = opacityRef.current;
      meshRef.current.scale.setScalar(scaleRef.current);
      // If shattering, fade out faster
      if (isShattering) meshRef.current.material.opacity *= 0.5;
    }
    
    if (groupRef.current) {
      // Only follow hand if active, else stay put or gather
      if (active) {
        groupRef.current.position.lerp(new THREE.Vector3(...position), 0.2);
      }
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }

    // 2. Shatter Animation Logic
    if (shatterRef.current) {
      shatterProgressRef.current = THREE.MathUtils.lerp(shatterProgressRef.current, isShattering ? 1 : 0, 0.08);
      const progress = shatterProgressRef.current;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particleData[i];
        
        if (progress > 0.01) {
          // World position of the card center
          const groupPos = groupRef.current.position;
          
          // Target is the world center (the tree trunk)
          // We calculate the vector from the particle's local card position to the world center
          const localToWorldTarget = new THREE.Vector3().copy(groupPos).add(p.origin).negate();
          
          // Add some spiral/chaos to the "gathering"
          localToWorldTarget.y += Math.sin(state.clock.elapsedTime * 5 + i) * 2;

          const currentPos = p.origin.clone().lerp(localToWorldTarget, progress);
          
          dummy.position.copy(currentPos);
          dummy.scale.setScalar(p.size * (1 - progress * 0.5));
          dummy.updateMatrix();
          shatterRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          // Default: hide or keep at origin
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          shatterRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      shatterRef.current.instanceMatrix.needsUpdate = true;
      shatterRef.current.material.opacity = progress > 0 ? (1 - progress) : 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Frosted Card */}
      <mesh ref={meshRef} visible={opacityRef.current > 0.01}>
        <planeGeometry args={[4, 2.2]} />
        <primitive object={glassMaterial} attach="material" />
        
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.35}
          color={THEME_CONFIG.leafPrimary}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          fillOpacity={opacityRef.current}
        >
          {content}
          <meshStandardMaterial 
            emissive={THEME_CONFIG.leafPrimary} 
            emissiveIntensity={10} 
            transparent
            opacity={opacityRef.current}
            attach="material" 
          />
        </Text>
      </mesh>

      {/* Shatter Particles */}
      <instancedMesh ref={shatterRef} args={[new THREE.SphereGeometry(1, 4, 4), shatterMaterial, PARTICLE_COUNT]} />

      {/* Edge Glow Overlay */}
      <mesh position={[0, 0, -0.01]} scale={[1.1, 1.1, 1]} visible={active}>
        <planeGeometry args={[4, 2.2]} />
        <meshBasicMaterial 
          color={THEME_CONFIG.leafPrimary} 
          transparent 
          opacity={opacityRef.current * 0.15} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};