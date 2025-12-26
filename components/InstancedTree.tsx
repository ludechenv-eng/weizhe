import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { THEME_CONFIG } from '../constants';

const LEAF_COUNT = 3200;
const DECO_COUNT = 1300;

export const InstancedTree = ({ state }: { state: 'CONE' | 'EXPLODE' }) => {
  const leafRef = useRef<THREE.InstancedMesh>(null!);
  const decoRef = useRef<THREE.InstancedMesh>(null!);

  const leafData = useMemo(() => {
    const data = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const height = Math.random() * 15;
      const radius = (1 - height / 15) * 5 * (0.8 + Math.random() * 0.4);
      const angle = Math.random() * Math.PI * 2;
      
      const conePos = new THREE.Vector3(
        Math.cos(angle) * radius,
        height - 7,
        Math.sin(angle) * radius
      );

      const explodePos = new THREE.Vector3().setFromSphericalCoords(
        15 + Math.random() * 15,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );

      data.push({
        conePos,
        explodePos,
        currentPos: conePos.clone(),
        scale: 0.04 + Math.random() * 0.08,
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      });
    }
    return data;
  }, []);

  const decoData = useMemo(() => {
    const data = [];
    for (let i = 0; i < DECO_COUNT; i++) {
      const height = Math.random() * 13;
      const radius = (1 - height / 15) * 4.5;
      const angle = Math.random() * Math.PI * 2;
      
      const conePos = new THREE.Vector3(
        Math.cos(angle) * radius,
        height - 7,
        Math.sin(angle) * radius
      );

      const explodePos = new THREE.Vector3().setFromSphericalCoords(
        10 + Math.random() * 10,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );

      data.push({
        conePos,
        explodePos,
        currentPos: conePos.clone(),
        scale: 0.12 + Math.random() * 0.08,
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((clockState) => {
    const t = clockState.clock.getElapsedTime();
    const lerpSpeed = 0.06;

    if (leafRef.current) {
      for (let i = 0; i < LEAF_COUNT; i++) {
        const d = leafData[i];
        const target = state === 'CONE' ? d.conePos : d.explodePos;
        d.currentPos.lerp(target, lerpSpeed);
        
        dummy.position.copy(d.currentPos);
        dummy.rotation.copy(d.rot);
        dummy.rotation.y += t * 0.1;
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        leafRef.current.setMatrixAt(i, dummy.matrix);
      }
      leafRef.current.instanceMatrix.needsUpdate = true;
    }

    if (decoRef.current) {
      for (let i = 0; i < DECO_COUNT; i++) {
        const d = decoData[i];
        const target = state === 'CONE' ? d.conePos : d.explodePos;
        d.currentPos.lerp(target, lerpSpeed);
        
        dummy.position.copy(d.currentPos);
        dummy.position.y += Math.sin(t * 2 + i) * 0.02;
        dummy.rotation.copy(d.rot);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        decoRef.current.setMatrixAt(i, dummy.matrix);
      }
      decoRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const leafMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: THEME_CONFIG.leafPrimary,
    emissive: THEME_CONFIG.leafPrimary,
    emissiveIntensity: 2.5,
    roughness: 0.1,
    metalness: 0.8
  }), []);

  const gemMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: THEME_CONFIG.decoration,
    transmission: 0.8,
    roughness: 0.02,
    metalness: 0.3,
    thickness: 2,
    ior: 2.2,
    attenuationColor: new THREE.Color(THEME_CONFIG.decoration),
    attenuationDistance: 0.5,
  }), []);

  return (
    <group>
      <instancedMesh ref={leafRef} args={[new THREE.OctahedronGeometry(1, 0), leafMaterial, LEAF_COUNT]} castShadow />
      <instancedMesh ref={decoRef} args={[new THREE.IcosahedronGeometry(1, 0), gemMaterial, DECO_COUNT]} castShadow />
      
      {/* Base Trunk - only visible in CONE state */}
      <mesh position={[0, -5.5, 0]} visible={state === 'CONE'}>
        <cylinderGeometry args={[0.4, 0.7, 4, 12]} />
        <meshStandardMaterial color="#0a0305" roughness={1} />
      </mesh>
    </group>
  );
};