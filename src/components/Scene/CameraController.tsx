import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';

// Default cinematic position: Earth slightly off-center, close
const DEFAULT_POS  = new THREE.Vector3(0, 0, 2.0);
// Explore position: angled slightly below, close — reveals curved limb like photo
const EXPLORE_POS  = new THREE.Vector3(0.3, -0.6, 1.65);

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isExploring = useSimulationStore((s) => s.isExploring);

  // Track current animated target so we can lerp smoothly
  const targetPos = useRef(DEFAULT_POS.clone());

  useEffect(() => {
    // Initial cinematic camera position
    const initCamera = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50;
        camera.position.copy(DEFAULT_POS);
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

  // When explore mode changes, set the target we want to lerp toward
  useEffect(() => {
    targetPos.current = isExploring ? EXPLORE_POS.clone() : DEFAULT_POS.clone();
  }, [isExploring]);

  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    // Smoothly lerp camera position toward the target
    const lerpSpeed = 0.04; // lower = smoother / slower
    camera.position.lerp(targetPos.current, lerpSpeed);
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.1}
      autoRotate={false}
      minDistance={1.4}
      maxDistance={6.0}
      target={new THREE.Vector3(0, 0, 0)}
    />
  );
}
