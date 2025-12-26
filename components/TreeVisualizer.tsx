import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Sparkles, Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { THEME_CONFIG } from '../constants';
import { InstancedTree } from './InstancedTree';
import { TreeTopStar } from './Decorations';
import { GachaCard } from './GachaCard';
import { HandRotation, PinchData } from '../types';

const SnowParticles = () => {
  const count = 1500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 60 - 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null!);

  useFrame((state, delta) => {
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.08;
      if (positions[i * 3 + 1] < -20) positions[i * 3 + 1] = 40;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={THEME_CONFIG.snow} transparent opacity={0.6} />
    </points>
  );
};

const UnifiedTreeGroup = ({ treeState, handRotation }: { treeState: 'CONE' | 'EXPLODE', handRotation: HandRotation }) => {
  const masterGroupRef = useRef<THREE.Group>(null!);
  const isCone = treeState === 'CONE';

  useFrame((state, delta) => {
    if (!masterGroupRef.current) return;
    if (isCone) {
      masterGroupRef.current.rotation.x = THREE.MathUtils.lerp(masterGroupRef.current.rotation.x, 0, 0.1);
      masterGroupRef.current.rotation.y = THREE.MathUtils.lerp(masterGroupRef.current.rotation.y, 0, 0.1);
      masterGroupRef.current.rotation.z = THREE.MathUtils.lerp(masterGroupRef.current.rotation.z, 0, 0.1);
    } else {
      masterGroupRef.current.rotation.x = THREE.MathUtils.lerp(masterGroupRef.current.rotation.x, handRotation.x, 0.15);
      masterGroupRef.current.rotation.y = THREE.MathUtils.lerp(masterGroupRef.current.rotation.y, handRotation.y, 0.15);
    }
  });

  return (
    <group ref={masterGroupRef}>
      <InstancedTree state={treeState} />
      <TreeTopStar visible={isCone} />
    </group>
  );
};

interface VisualizerProps {
  treeState: 'CONE' | 'EXPLODE';
  handRotation: HandRotation;
  pinchData: PinchData;
}

export const TreeVisualizer: React.FC<VisualizerProps> = ({ treeState, handRotation, pinchData }) => {
  const isCone = treeState === 'CONE';

  return (
    <div className="w-full h-full">
      <Canvas shadows gl={{ antialias: false }}>
        <PerspectiveCamera makeDefault position={[0, 5, 25]} fov={50} />
        <color attach="background" args={[THEME_CONFIG.bg]} />
        <fog attach="fog" args={[THEME_CONFIG.bg, 15, 60]} />
        
        <Environment preset="night" />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={2} color={THEME_CONFIG.leafPrimary} />
        
        <UnifiedTreeGroup treeState={treeState} handRotation={handRotation} />
        
        {/* Pinch/Gacha Interaction */}
        <GachaCard 
          active={pinchData.active} 
          position={pinchData.position} 
          content={pinchData.content}
          treeState={treeState}
        />
        
        <SnowParticles />
        <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={1.5} />
        <Sparkles count={80} scale={[25, 25, 25]} size={3} speed={0.8} color={THEME_CONFIG.leafSecondary} />

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={THEME_CONFIG.bloomIntensity} radius={0.4} />
        </EffectComposer>

        <OrbitControls 
          enablePan={false} 
          minDistance={10} 
          maxDistance={50} 
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={isCone && handRotation.x === 0 && handRotation.y === 0}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};