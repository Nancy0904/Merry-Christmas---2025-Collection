import React, { useRef, useEffect } from 'react';
import { TreeState, UserPhoto, THEME } from '../types';

interface UIProps {
  treeState: TreeState;
  onToggle: () => void;
  onAddPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedPhoto: UserPhoto | null;
  onClosePhoto: () => void;
  onNextPhoto: () => void;
  onPrevPhoto: () => void;
}

export const UI: React.FC<UIProps> = ({ 
  treeState, 
  onToggle, 
  onAddPhoto, 
  selectedPhoto, 
  onClosePhoto,
  onNextPhoto,
  onPrevPhoto
}) => {
  const isFormed = treeState === TreeState.FORMED;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNextPhoto();
      if (e.key === 'ArrowLeft') onPrevPhoto();
      if (e.key === 'Escape') onClosePhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, onNextPhoto, onPrevPhoto, onClosePhoto]);

  return (
    <>
    <div className="flex flex-col items-center justify-between w-full h-full p-8 pointer-events-none">
      
      {/* Header */}
      <header className="mt-8 text-center pointer-events-auto transition-opacity duration-1000">
        <h1 
            className="text-4xl md:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: '"Cinzel", serif' }}
        >
          MERRY CHRISTMAS
        </h1>
        <div className="h-0.5 w-32 bg-yellow-600 mx-auto mt-4 shadow-[0_0_10px_#FFD700]"></div>
        <p className="mt-2 text-yellow-100 text-sm tracking-[0.3em] opacity-80 font-serif">
          2025 COLLECTION
        </p>
      </header>

      {/* Main Controls */}
      <div className="mb-12 flex flex-col gap-4 items-center pointer-events-auto z-50">
        
        {/* Toggle State Button */}
        <button
          onClick={onToggle}
          className="group relative px-12 py-4 bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-600 rounded-sm overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(184,134,11,0.3)]"
        >
          <div className="absolute inset-0 bg-yellow-600 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
          
          <span 
            className="relative z-10 text-xl font-bold tracking-widest text-yellow-400 group-hover:text-white transition-colors duration-300"
            style={{ fontFamily: '"Cinzel", serif' }}
          >
            {isFormed ? "RELEASE CHAOS" : "ASSEMBLE MAJESTY"}
          </span>
          
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-400"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-400"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-400"></div>
        </button>

        {/* Upload Button */}
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onAddPhoto} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            onClick={triggerUpload}
            className="group px-8 py-2 bg-black/50 border border-yellow-600/50 rounded-sm hover:bg-yellow-900/30 transition-all duration-300 backdrop-blur-sm"
          >
            <span className="text-yellow-200 text-sm tracking-widest font-serif group-hover:text-white transition-colors">
              + UPLOAD MEMORY
            </span>
          </button>
        </div>

      </div>

      {/* Footer Status */}
      <div className="absolute bottom-8 left-8 text-yellow-600/60 font-serif text-xs tracking-widest">
        SYSTEM: {treeState}
      </div>
      
    </div>

    {/* Photo Lightbox / Modal */}
    {selectedPhoto && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto p-4 md:p-8"
        onClick={onClosePhoto}
      >
        {/* Navigation Buttons */}
        <button 
          onClick={(e) => { e.stopPropagation(); onPrevPhoto(); }}
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/30 hover:bg-black/60 border border-yellow-600/30 hover:border-yellow-600 text-yellow-600 hover:text-yellow-200 transition-all duration-300 z-[110] backdrop-blur-sm group shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          aria-label="Previous Photo"
        >
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:-translate-x-1 transition-transform duration-300">
             <path d="M15 19l-7-7 7-7" />
           </svg>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onNextPhoto(); }}
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/30 hover:bg-black/60 border border-yellow-600/30 hover:border-yellow-600 text-yellow-600 hover:text-yellow-200 transition-all duration-300 z-[110] backdrop-blur-sm group shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          aria-label="Next Photo"
        >
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:translate-x-1 transition-transform duration-300">
             <path d="M9 5l7 7-7 7" />
           </svg>
        </button>


        <div 
          className="relative max-w-5xl max-h-full flex flex-col items-center"
          onClick={(e) => e.stopPropagation()} 
        >
          {/* Frame Decoration */}
          <div className="absolute inset-0 -m-1 border border-yellow-600/50 rounded-lg pointer-events-none"></div>
          <div className="absolute inset-0 -m-3 border border-yellow-800/30 rounded-lg pointer-events-none"></div>

          {/* Image */}
          <img 
            key={selectedPhoto.id} // Add key to force animation reset on change
            src={selectedPhoto.url} 
            alt="Memory" 
            className="max-h-[75vh] md:max-h-[80vh] w-auto border-4 border-yellow-600 shadow-[0_0_50px_rgba(184,134,11,0.5)] rounded-sm animate-[fadeIn_0.5s_ease-out]"
          />

          {/* Close Button */}
          <button 
            onClick={onClosePhoto}
            className="mt-6 px-8 py-2 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors duration-300 font-serif tracking-widest text-sm"
          >
            CLOSE MEMORY
          </button>
        </div>
      </div>
    )}
    </>
  );
};