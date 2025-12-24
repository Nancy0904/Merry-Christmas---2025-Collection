import React, { useState } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { TreeState, UserPhoto } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.CHAOS);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);

  const toggleState = () => {
    setTreeState((prev) => (prev === TreeState.CHAOS ? TreeState.FORMED : TreeState.CHAOS));
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setPhotos((prev) => [
          ...prev,
          { 
            id: crypto.randomUUID(), 
            url, 
            aspectRatio: img.width / img.height 
          }
        ]);
      };
      img.src = url;
    }
  };

  const handleNextPhoto = () => {
    if (!selectedPhoto || photos.length === 0) return;
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % photos.length;
    setSelectedPhoto(photos[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto || photos.length === 0) return;
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    setSelectedPhoto(photos[prevIndex]);
  };

  return (
    <div className="relative w-full h-screen font-serif text-white">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
          treeState={treeState} 
          photos={photos} 
          onPhotoClick={setSelectedPhoto}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UI 
          treeState={treeState} 
          onToggle={toggleState} 
          onAddPhoto={handleAddPhoto}
          selectedPhoto={selectedPhoto}
          onClosePhoto={() => setSelectedPhoto(null)}
          onNextPhoto={handleNextPhoto}
          onPrevPhoto={handlePrevPhoto}
        />
      </div>
    </div>
  );
};

export default App;