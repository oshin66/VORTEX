import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    // Initial cinematic camera position
    // We want the Earth to appear partially off-center, with a prominent curved limb.
    // Setting narrow FOV (long lens effect)
    const initCamera = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50;
        
        // Bring camera close so globe fills ~85-90% of viewport height
        camera.position.set(0, 0, 2.0);
        camera.lookAt(new THREE.Vector3(0, 0, 0)); 
        
        camera.updateProjectionMatrix();
        
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    };
    
    initCamera();
    
    const handleReset = () => {
      initCamera();
    };
    
    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, [camera]);
  
  // Add an extremely subtle continuous rotation to the camera itself for a floating feel
  useFrame(() => {
    // Very subtle floating/orbiting effect
    // We only apply this if the user hasn't heavily interacted, 
    // but a tiny automated drift is nice. Let's stick to user controls for now
    // as OrbitControls with damping handles smooth movement well.
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.03} // Slow, heavy damping for cinematic feel
      autoRotate={true}
      autoRotateSpeed={2.8} // ~1 full orbit every 75 seconds
      minDistance={1.4} // Prevent clipping into Earth at close FOV
      maxDistance={6.0} // Prevent zooming too far out
      // Optional: limit polar angles to prevent looking from exact top/bottom 
      // if it breaks the composition, but space is omnidirectional.
      target={new THREE.Vector3(0, 0, 0)} // Center the orbit target
    />
  );
}
