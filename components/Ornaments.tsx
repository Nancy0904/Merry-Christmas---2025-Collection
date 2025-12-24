import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface OrnamentsProps {
  count: number;
  type: 'box' | 'sphere';
  color: string;
  height: number;
  radius: number;
  chaosRadius: number;
  state: TreeState;
  scale: number;
  weight: number;
  emissive?: boolean;
}

export const Ornaments: React.FC<OrnamentsProps> = ({
  count,
  type,
  color,
  height,
  radius,
  chaosRadius,
  state,
  scale,
  weight,
  emissive = false
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Data storage
  const data = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Chaos: Random Sphere
      const r = chaosRadius * Math.cbrt(Math.random()) * 1.2; // Slightly larger spread than leaves
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const chaosPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      // Target: Surface of Cone (Ornaments sit ON the tree, not inside)
      const yT = Math.random() * (height - 1); // Avoid very top
      const currentRadius = ((1 - yT / height) * radius) + 0.2; // +0.2 to sit on tips
      const angle = Math.random() * Math.PI * 2;
      
      const targetPos = new THREE.Vector3(
        currentRadius * Math.cos(angle),
        yT,
        currentRadius * Math.sin(angle)
      );

      return {
        chaosPos,
        targetPos,
        currentPos: chaosPos.clone(),
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.02, 
          Math.random() * 0.02, 
          Math.random() * 0.02
        ),
        randomScale: scale * (0.8 + Math.random() * 0.4), // Variance
        phase: Math.random() * Math.PI * 2 // Animation offset
      };
    });
  }, [count, chaosRadius, height, radius, scale]);

  useLayoutEffect(() => {
      // Set initial positions to chaos
      if(meshRef.current) {
          data.forEach((d, i) => {
              dummy.position.copy(d.chaosPos);
              dummy.scale.setScalar(d.randomScale);
              dummy.updateMatrix();
              meshRef.current!.setMatrixAt(i, dummy.matrix);
          });
          meshRef.current.instanceMatrix.needsUpdate = true;
      }
  }, [dummy, data]);

  useFrame((stateRoot, delta) => {
    if (!meshRef.current) return;

    const isFormed = state === TreeState.FORMED;

    data.forEach((d, i) => {
      // 1. Interpolate Position
      const target = isFormed ? d.targetPos : d.chaosPos;
      
      // Use weight to determine speed. Heavier = Slower lerp factor.
      // But actually, visually, lighter things fly faster.
      // Basic lerp: current + (target - current) * alpha
      const speed = isFormed ? weight * 2 : weight; // Disperse slower?
      d.currentPos.lerp(target, speed);

      // 2. Add Floating Motion
      const time = stateRoot.clock.elapsedTime;
      const floatY = Math.sin(time * 2 + d.phase) * 0.05;
      
      dummy.position.copy(d.currentPos);
      if (isFormed) dummy.position.y += floatY;

      // 3. Rotation
      // Spin faster when in Chaos mode
      dummy.rotation.x += d.rotationSpeed.x * (isFormed ? 1 : 5);
      dummy.rotation.y += d.rotationSpeed.y * (isFormed ? 1 : 5);
      dummy.rotation.z += d.rotationSpeed.z * (isFormed ? 1 : 5);

      dummy.scale.setScalar(d.randomScale);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {type === 'box' ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : (
        <sphereGeometry args={[1, 16, 16]} />
      )}
      <meshStandardMaterial
        color={color}
        roughness={emissive ? 0.1 : 0.3}
        metalness={emissive ? 0.2 : 0.8}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? 2 : 0}
      />
    </instancedMesh>
  );
};