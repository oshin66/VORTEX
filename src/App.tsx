import { Canvas } from '@react-three/fiber';

import { Suspense } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Earth } from './components/Earth/Earth';
import { StarField } from './components/Earth/StarField';
import { CameraController } from './components/Scene/CameraController';
import { Overlay } from './components/UI/Overlay';

export default function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <Overlay />
      
      <Canvas
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]} // Limit DPR to 2 for performance
      >
        <color attach="background" args={['#000000']} />
        
        {/* We use custom shaders for lighting, but adding a subtle ambient light helps */}
        <ambientLight intensity={0.05} />
        
        <Suspense fallback={null}>
          <Earth />
          <StarField />
        </Suspense>
        
        <CameraController />
        
        <EffectComposer>
          <Bloom
            mipmapBlur
            luminanceThreshold={1.0}
            intensity={1.42}
            radius={0.8}
          />
        </EffectComposer>
      </Canvas>
      
      {/* Loading Fallback */}
      <div id="loader" className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 bg-black">
         <div className="text-white/30 text-sm font-mono tracking-widest animate-pulse">
           INITIALIZING ORBIT...
         </div>
      </div>
    </div>
  );
}
