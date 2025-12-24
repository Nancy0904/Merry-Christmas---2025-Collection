import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TreeState, THEME, UserPhoto } from '../types';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { PhotoOrnaments } from './PhotoOrnaments';
import * as THREE from 'three';

interface ChristmasTreeProps {
  treeState: TreeState;
  photos: UserPhoto[];
  onPhotoClick: (photo: UserPhoto) => void;
}

export const ChristmasTree: React.FC<ChristmasTreeProps> = ({ treeState, photos, onPhotoClick }) => {
  // Tree Geometry Parameters
  const HEIGHT = 14;
  const RADIUS = 5;
  const CHAOS_RADIUS = 15;

  const starRef = useRef<THREE.Mesh>(null);

  const { shape, settings } = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.0;
    const innerRadius = 0.4;
    const numPoints = 5;
    
    for (let i = 0; i < numPoints * 2; i++) {
      // Start at top (-PI/2)
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const settings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    };

    return { shape, settings };
  }, []);

  useFrame((state, delta) => {
    if (starRef.current && treeState === TreeState.FORMED) {
       starRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group>
      {/* 1. The Green Needles (Shader based for high particle count) */}
      <Foliage 
        count={15000} 
        height={HEIGHT} 
        radius={RADIUS} 
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
      />

      {/* 2. Heavy Ornaments: Gifts (Boxes) */}
      <Ornaments
        count={40}
        type="box"
        height={HEIGHT}
        radius={RADIUS}
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        color={THEME.colors.gold}
        scale={0.6}
        weight={0.02} // Heavy, moves slow
      />
      
      <Ornaments
        count={30}
        type="box"
        height={HEIGHT}
        radius={RADIUS}
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        color={THEME.colors.burgundy}
        scale={0.5}
        weight={0.025}
      />

      {/* 3. Light Ornaments: Balls (Spheres) */}
      <Ornaments
        count={150}
        type="sphere"
        height={HEIGHT}
        radius={RADIUS}
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        color={THEME.colors.gold}
        scale={0.3}
        weight={0.05} // Lighter, moves faster
      />

      <Ornaments
        count={100}
        type="sphere"
        height={HEIGHT}
        radius={RADIUS}
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        color={THEME.colors.silver}
        scale={0.25}
        weight={0.06}
      />

       <Ornaments
        count={80}
        type="sphere"
        height={HEIGHT}
        radius={RADIUS}
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        color={THEME.colors.burgundy}
        scale={0.35}
        weight={0.04}
      />

      {/* 4. Lights (Very light, glowing) */}
      <Ornaments
        count={300}
        type="sphere"
        height={HEIGHT}
        radius={RADIUS + 0.2} // Slightly outside
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        color={THEME.colors.whiteWarm}
        scale={0.1}
        weight={0.08} // Fastest
        emissive={true}
      />

      {/* 5. User Photos */}
      <PhotoOrnaments 
        photos={photos}
        height={HEIGHT}
        radius={RADIUS}
        chaosRadius={CHAOS_RADIUS}
        state={treeState}
        onPhotoClick={onPhotoClick}
      />
      
      {/* 6. The Star */}
      <mesh 
        ref={starRef}
        position={[0, HEIGHT + 0.5, 0]} 
        scale={treeState === TreeState.FORMED ? 1 : 0}
      >
         <extrudeGeometry 
          args={[shape, settings]} 
          onUpdate={(geo) => geo.center()} 
         />
         <meshStandardMaterial 
            color={THEME.colors.gold} 
            emissive={THEME.colors.gold}
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={1}
          />
      </mesh>
    </group>
  );
};