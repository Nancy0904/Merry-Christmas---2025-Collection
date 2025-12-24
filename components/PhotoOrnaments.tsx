import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, UserPhoto, THEME } from '../types';

interface PhotoOrnamentsProps {
  photos: UserPhoto[];
  height: number;
  radius: number;
  chaosRadius: number;
  state: TreeState;
  onPhotoClick: (photo: UserPhoto) => void;
}

// Visual Variations
const FRAME_STYLES = {
  'gold': { color: THEME.colors.gold, metalness: 1.0, roughness: 0.15 },
  'silver': { color: THEME.colors.silver, metalness: 0.9, roughness: 0.2 },
  'antique gold': { color: '#8a6d3b', metalness: 0.6, roughness: 0.5 }, 
  'rose gold': { color: '#e6c2b8', metalness: 0.9, roughness: 0.15 },
};

type FrameStyleType = keyof typeof FRAME_STYLES;

interface PhotoFrameProps {
  photo: UserPhoto;
  height: number;
  radius: number;
  chaosRadius: number;
  state: TreeState;
  index: number;
  total: number;
  onClick: (photo: UserPhoto) => void;
  frameStyle?: FrameStyleType;
}

const PhotoFrame: React.FC<PhotoFrameProps> = ({ 
  photo, 
  height, 
  radius, 
  chaosRadius, 
  state, 
  index, 
  total, 
  onClick,
  frameStyle 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, photo.url);
  const [hovered, setHovered] = useState(false);

  // 1. Determine Position & Motion (Memoized)
  const { chaosPos, targetPos, rotationSpeed, phase } = useMemo(() => {
    // Chaos: Random Sphere distribution for the chaotic state
    const rC = chaosRadius * Math.cbrt(Math.random()) * 0.9;
    const thetaChaos = Math.random() * 2 * Math.PI;
    const phiChaos = Math.acos(2 * Math.random() - 1);
    const chaos = new THREE.Vector3(
      rC * Math.sin(phiChaos) * Math.cos(thetaChaos),
      rC * Math.sin(phiChaos) * Math.sin(thetaChaos),
      rC * Math.cos(phiChaos)
    );

    // Target: Dynamic Spiral Distribution
    // Ensures photos are spread evenly but organically across the tree surface.
    
    const minH = height * 0.18; // Start slightly above bottom branches
    const maxH = height * 0.85; // Stop before the star
    
    // Vertical Stratification
    // Distribute vertically based on index, but add jitter to allow overlap
    const layerHeight = (maxH - minH) / Math.max(total, 1);
    const baseY = minH + index * layerHeight;
    // Jitter: +/- 1.5 layers. Allows swapping order vertically for natural look.
    const randomYOffset = (Math.random() - 0.5) * layerHeight * 3.0; 
    let yT = baseY + randomYOffset;
    
    // Clamp to ensure it stays on tree
    yT = Math.max(minH, Math.min(maxH, yT));

    // Cone Radius Calculation
    const treeRadiusAtHeight = (1 - yT / height) * radius;
    // Push out slightly (0.8) plus random variance (0.4) for depth
    const depthOffset = 0.8 + Math.random() * 0.4;
    const currentRadius = treeRadiusAtHeight + depthOffset;

    // Angle: Golden Spiral + Randomness
    // Golden Angle (~2.4 rad) prevents vertical alignment
    // Jitter adds imperfection
    const angleBase = index * 2.39996;
    const angleJitter = (Math.random() - 0.5) * 0.5; // +/- ~15 degrees
    const angle = angleBase + angleJitter;

    const target = new THREE.Vector3(
      currentRadius * Math.cos(angle),
      yT,
      currentRadius * Math.sin(angle)
    );
    
    return {
      chaosPos: chaos,
      targetPos: target,
      rotationSpeed: new THREE.Vector3(Math.random() * 0.01, Math.random() * 0.01, 0),
      phase: Math.random() * Math.PI * 2
    };
  }, [chaosRadius, height, radius, index, total]);

  // 2. Determine Style & Shape (Memoized)
  const { style, shape } = useMemo(() => {
    // Select style: use prop if available, otherwise random
    const styleKeys = Object.keys(FRAME_STYLES) as FrameStyleType[];
    const selectedKey = frameStyle && FRAME_STYLES[frameStyle] ? frameStyle : styleKeys[Math.floor(Math.random() * styleKeys.length)];
    const selectedStyle = FRAME_STYLES[selectedKey];

    // Randomize shape (30% chance of oval)
    const selectedShape = Math.random() > 0.7 ? 'oval' : 'rectangular';
    return { style: selectedStyle, shape: selectedShape };
  }, [frameStyle]);

  // Animation Loop
  const currentPos = useRef(chaosPos.clone());
  
  useFrame((rootState, delta) => {
    if (!groupRef.current) return;
    
    const isFormed = state === TreeState.FORMED;
    const target = isFormed ? targetPos : chaosPos;

    // Move
    currentPos.current.lerp(target, delta * 2.5);
    
    // Float
    const floatY = Math.sin(rootState.clock.elapsedTime * 1.5 + phase) * 0.1;
    groupRef.current.position.copy(currentPos.current);
    if(isFormed) groupRef.current.position.y += floatY;

    // Scale effect on hover
    const targetScale = hovered ? 1.2 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);

    // Rotate
    if (isFormed) {
      // Look at vertical center (world axis)
      const lookAtTargetY = groupRef.current.position.y - 7;
      groupRef.current.lookAt(0, lookAtTargetY, 0);
      groupRef.current.rotateY(Math.PI); 
      groupRef.current.rotation.z += Math.sin(rootState.clock.elapsedTime + phase) * 0.05;
    } else {
      groupRef.current.rotation.x += rotationSpeed.x * 5;
      groupRef.current.rotation.y += rotationSpeed.y * 5;
    }
  });

  // Dimensions
  const frameHeight = 1.5; 
  const frameWidth = frameHeight * photo.aspectRatio;
  const border = 0.15;
  const thickness = 0.08;

  // Interaction handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHovered(true);
  };
  
  const handlePointerOut = (e: any) => {
    document.body.style.cursor = 'auto';
    setHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick(photo);
  };

  return (
    <group 
      ref={groupRef} 
      onClick={handleClick} 
      onPointerOver={handlePointerOver} 
      onPointerOut={handlePointerOut}
    >
      {shape === 'rectangular' ? (
        <>
          {/* Rectangular Frame */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[frameWidth + border, frameHeight + border, thickness]} />
            <meshStandardMaterial 
              color={style.color} 
              metalness={style.metalness} 
              roughness={style.roughness} 
              emissive={style.color}
              emissiveIntensity={hovered ? 0.3 : 0.1}
            />
          </mesh>
          {/* Photo */}
          <mesh position={[0, 0, thickness / 2 + 0.01]}>
            <planeGeometry args={[frameWidth, frameHeight]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        </>
      ) : (
        <>
          {/* Oval Frame (Cylinder rotated 90deg X) */}
          <mesh 
            rotation={[Math.PI / 2, 0, 0]} 
            scale={[frameWidth + border, thickness, frameHeight + border]} 
            castShadow 
            receiveShadow
          >
            {/* Base cylinder is diameter 1, height 1. 
                Scaled X by width, Y by thickness (depth), Z by height. */}
            <cylinderGeometry args={[0.5, 0.5, 1, 64]} />
            <meshStandardMaterial 
              color={style.color} 
              metalness={style.metalness} 
              roughness={style.roughness} 
              emissive={style.color}
              emissiveIntensity={hovered ? 0.3 : 0.1}
            />
          </mesh>
          
          {/* Oval Photo (Circle scaled) */}
          <mesh 
            position={[0, 0, thickness / 2 + 0.01]} 
            scale={[frameWidth, frameHeight, 1]}
          >
             {/* Circle radius 0.5 * scale 2 = size 1 */}
            <circleGeometry args={[0.5, 64]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        </>
      )}
    </group>
  );
};

export const PhotoOrnaments: React.FC<PhotoOrnamentsProps> = ({ photos, height, radius, chaosRadius, state, onPhotoClick }) => {
  return (
    <group>
      {photos.map((photo, index) => (
        <PhotoFrame 
          key={photo.id}
          photo={photo}
          height={height}
          radius={radius}
          chaosRadius={chaosRadius}
          state={state}
          index={index}
          total={photos.length}
          onClick={onPhotoClick}
          // frameStyle="gold" // Example: Can be passed here if desired, otherwise random
        />
      ))}
    </group>
  );
};