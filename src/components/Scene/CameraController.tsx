import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';

// Default wide cinematic view
const DEFAULT_POS    = new THREE.Vector3(0, 0, 2.0);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

// Explore mode target geometry: 
// Distance ~1.57x sphere radius (R = 1.0), angled looking upwards at Y = +0.52
// so the curved horizon has comfortable breathing room below top UI controls
// and subtle black space margins on left and right sides.
const EXPLORE_TARGET_Y = -0.38;
const EXPLORE_RADIUS_XZ = 1.52; // dist to center = sqrt(0.38^2 + 1.52^2) = 1.567 R
const EXPLORE_LOOKAT    = new THREE.Vector3(0, 0.52, 0);

// Cubic easing curve for weighty, cinematic motion
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const isExploring = useSimulationStore((s) => s.isExploring);
  const setIsAnimating = useSimulationStore((s) => s.setIsAnimating);

  // Animation state refs
  const isAnimatingRef = useRef(false);
  const animTimeRef = useRef(0);
  const ANIM_DURATION = 2.2; // total seconds for full transition

  // Animation start/end parameters
  const startPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const startAngleRef = useRef(0);
  const targetAngleRef = useRef(0);
  const targetRadiusXZRef = useRef(EXPLORE_RADIUS_XZ);
  const targetYRef = useRef(0);
  const targetLookAtRef = useRef(new THREE.Vector3());

  // Track initial mount so we don't trigger an animation on first page load
  const isInitialMountRef = useRef(true);
  const tempTargetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    // Initial camera setup
    const initCamera = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50;
        camera.position.copy(DEFAULT_POS);
        camera.lookAt(DEFAULT_TARGET);
        camera.updateProjectionMatrix();
        if (controlsRef.current) {
          controlsRef.current.target.copy(DEFAULT_TARGET);
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }
    };

    initCamera();

    const handleReset = () => {
      initCamera();
    };

    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, [camera, setIsAnimating]);

  // Trigger animation whenever isExploring changes
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    // Skip animation on initial component mount if not exploring
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (!isExploring) return;
    }

    // Capture current start state
    startPosRef.current.copy(camera.position);
    if (controlsRef.current) {
      startTargetRef.current.copy(controlsRef.current.target);
    } else {
      startTargetRef.current.copy(DEFAULT_TARGET);
    }

    const currentAngle = Math.atan2(camera.position.x, camera.position.z);
    startAngleRef.current = currentAngle;

    if (isExploring) {
      // Transitioning to Explore Mode
      targetAngleRef.current = currentAngle + Math.PI * 0.35; // orbital spin angle
      targetYRef.current = EXPLORE_TARGET_Y;
      targetRadiusXZRef.current = EXPLORE_RADIUS_XZ;
      targetLookAtRef.current.copy(EXPLORE_LOOKAT);
    } else {
      // Transitioning back to Default Mode
      targetAngleRef.current = currentAngle - Math.PI * 0.35;
      targetYRef.current = DEFAULT_POS.y;
      targetRadiusXZRef.current = Math.sqrt(DEFAULT_POS.x * DEFAULT_POS.x + DEFAULT_POS.z * DEFAULT_POS.z);
      targetLookAtRef.current.copy(DEFAULT_TARGET);
    }

    // Lock OrbitControls during transition
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    animTimeRef.current = 0;
    isAnimatingRef.current = true;
    setIsAnimating(true);
  }, [isExploring, camera, setIsAnimating]);

  useFrame((_, delta) => {
    if (!isAnimatingRef.current || !(camera instanceof THREE.PerspectiveCamera)) return;

    animTimeRef.current += delta;
    const rawProgress = Math.min(animTimeRef.current / ANIM_DURATION, 1.0);

    // Two-stage motion curve:
    // 1. Rotation phase leads slightly (completes in first 80% of progress)
    const rotateProgress = easeInOutCubic(Math.min(rawProgress / 0.80, 1.0));
    // 2. Zoom/descend phase spans the full duration smoothly
    const descendProgress = easeInOutCubic(rawProgress);

    // Interpolate spherical orbit coordinates
    const startRadiusXZ = Math.sqrt(
      startPosRef.current.x * startPosRef.current.x + startPosRef.current.z * startPosRef.current.z
    );
    const currentAngle = THREE.MathUtils.lerp(startAngleRef.current, targetAngleRef.current, rotateProgress);
    const currentRadiusXZ = THREE.MathUtils.lerp(startRadiusXZ, targetRadiusXZRef.current, descendProgress);
    const currentY = THREE.MathUtils.lerp(startPosRef.current.y, targetYRef.current, descendProgress);

    // Update camera position
    camera.position.set(
      currentRadiusXZ * Math.sin(currentAngle),
      currentY,
      currentRadiusXZ * Math.cos(currentAngle)
    );

    // Interpolate look-at target into persistent Vector3 ref to prevent GC allocations
    tempTargetRef.current.lerpVectors(
      startTargetRef.current,
      targetLookAtRef.current,
      descendProgress
    );

    camera.lookAt(tempTargetRef.current);

    if (controlsRef.current) {
      controlsRef.current.target.copy(tempTargetRef.current);
      controlsRef.current.update();
    }

    // Check completion
    if (rawProgress >= 1.0) {
      isAnimatingRef.current = false;
      setIsAnimating(false);

      if (controlsRef.current) {
        controlsRef.current.enabled = true; // Re-enable OrbitControls for free viewing!
        controlsRef.current.target.copy(targetLookAtRef.current);
        controlsRef.current.minDistance = 1.2;
        controlsRef.current.maxDistance = 6.0;
        controlsRef.current.update();
      }
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
      minDistance={1.2}
      maxDistance={6.0}
      target={DEFAULT_TARGET}
    />
  );
}
