import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useSimulationStore } from '../../store/useSimulationStore';
import { EARTH_TILT } from '../../utils/astronomy';
import { earthVertexShader, earthFragmentShader } from './shaders';

// Fixed sun direction in WORLD space — the Earth rotates, the sun stays put.
// Points from lower-left to simulate a natural lighting angle.
const FIXED_SUN_DIRECTION = new THREE.Vector3(5, 2, 3).normalize();

export function Earth() {
  const earthRef      = useRef<THREE.Mesh>(null);
  const earthMatRef   = useRef<THREE.ShaderMaterial>(null);
  const isPaused = useSimulationStore((state) => state.isPaused);
  const isExploring = useSimulationStore((state) => state.isExploring);
  // Manual rotation reference (radians)
  const rotationRef = useRef(0);
  const currentScaleRef = useRef(1.0);


  useLayoutEffect(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 1000);
    }
  }, []);

  // Load textures
  const [colorMap, nightMap, cloudsMap, specularMap] = useTexture([
    '/textures/8k_earth_daymap.jpg',
    '/textures/8k_earth_nightmap.jpg',
    '/textures/8k_earth_clouds.jpg',
    '/textures/earth_specular_2048.jpg',
  ]);

  useFrame((state, delta) => {
    if (!isPaused) {
      useSimulationStore.getState().updateTime(delta * 1000);
    }

    const mode    = useSimulationStore.getState().viewMode;
    const modeVal = mode === 'day' ? 0.0 : mode === 'night' ? 1.0 : 2.0;

    // Dynamic atmosphere glow boost based on camera distance (closer = stronger limb glow)
    const camDist = state.camera.position.length();
    // 2.0 (far) -> 1.0 boost, ~1.15 (close explore) -> ~1.8 boost
    const atmosphereBoost = THREE.MathUtils.clamp(1.0 + (2.0 - camDist) * 0.95, 1.0, 1.85);

    // ── Update Earth material uniforms directly via ref ──
    if (earthMatRef.current) {
      const u = earthMatRef.current.uniforms;
      u.tDiffuse.value         = colorMap;
      u.tNight.value           = nightMap;
      u.tClouds.value          = cloudsMap;
      u.tSpecular.value        = specularMap;
      // Sun direction is FIXED in world space — do NOT rotate it with the earth
      u.sunDirection.value.copy(FIXED_SUN_DIRECTION);
      u.uViewMode.value        = modeVal;
      u.uAtmosphereBoost.value = atmosphereBoost;
    }

    // ── Smooth Earth rotation (full turn ≈90 s) + Explore scale ──
    if (earthRef.current) {
       rotationRef.current += delta * (2 * Math.PI / 90); // ~1 full rotation every 90 s
      earthRef.current.rotation.y = rotationRef.current;

      // Scale up slightly during explore mode to stretch horizontal width edge-to-edge
      const targetScale = isExploring ? 1.35 : 1.0;
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, delta * 2.5);
      earthRef.current.scale.setScalar(currentScaleRef.current);

      // Slow cloud drift
      if (cloudsMap.wrapS !== THREE.RepeatWrapping) {
        cloudsMap.wrapS = THREE.RepeatWrapping;
        cloudsMap.wrapT = THREE.RepeatWrapping;
      }
      cloudsMap.offset.x -= delta * 0.001 * useSimulationStore.getState().timeMultiplier;
    }
  });

  // Initial uniform objects (created once — actual values driven by useFrame via ref)
  const earthUniforms = {
    tDiffuse:         { value: colorMap },
    tNight:           { value: nightMap },
    tClouds:          { value: cloudsMap },
    tSpecular:        { value: specularMap },
    sunDirection:     { value: FIXED_SUN_DIRECTION.clone() },
    uViewMode:        { value: 0.0 },
    uAtmosphereBoost: { value: 1.0 },
  };

  return (
    <group rotation={[0, 0, EARTH_TILT]}>
      {/* Main Earth Sphere — only this mesh rotates on Y */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          ref={earthMatRef}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={earthUniforms}
        />
      </mesh>
    </group>
  );
}
