import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ChristmasTree } from './ChristmasTree';
import { TreeState, UserPhoto } from '../types';

interface SceneProps {
  treeState: TreeState;
  photos: UserPhoto[];
  onPhotoClick: (photo: UserPhoto) => void;
}

export const Scene: React.FC<SceneProps> = ({ treeState, photos, onPhotoClick }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMappingExposure: 1.5 }}
    >
      <PerspectiveCamera makeDefault position={[0, 2, 24]} fov={45} />
      
      <color attach="background" args={['#050a05']} />
      
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={500} castShadow color="#fffae0" />
      <pointLight position={[-10, -10, -10]} intensity={200} color="#gold" />

      <Suspense fallback={null}>
        <Environment preset="lobby" />
        
        {/* Centered the tree vertically. Height is 14, so -7 places center at 0 */}
        <group position={[0, -7, 0]}>
            <ChristmasTree 
              treeState={treeState} 
              photos={photos} 
              onPhotoClick={onPhotoClick}
            />
        </group>

        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.8} 
            luminanceSmoothing={0.1} 
            intensity={1.2} 
            mipmapBlur 
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={40}
        autoRotate={treeState === TreeState.FORMED}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
};