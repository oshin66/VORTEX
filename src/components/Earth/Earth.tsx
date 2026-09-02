import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getEarthRotation, EARTH_TILT } from '../../utils/astronomy';
import { earthVertexShader, earthFragmentShader } from './shaders';

// Fixed sun direction in WORLD space — the Earth rotates, the sun stays put.
// Points from lower-left to simulate a natural lighting angle.
const FIXED_SUN_DIRECTION = new THREE.Vector3(5, 2, 3).normalize();

export function Earth() {
  const earthRef      = useRef<THREE.Mesh>(null);
  const earthMatRef   = useRef<THREE.ShaderMaterial>(null);
  const isPaused = useSimulationStore((state) => state.isPaused);

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

  useFrame((_, delta) => {
    if (!isPaused) {
      useSimulationStore.getState().updateTime(delta * 1000);
    }

    const time    = useSimulationStore.getState().simulationTime;
    const mode    = useSimulationStore.getState().viewMode;
    const modeVal = mode === 'day' ? 0.0 : mode === 'night' ? 1.0 : 2.0;

    // ── Update Earth material uniforms directly via ref ──
    if (earthMatRef.current) {
      const u = earthMatRef.current.uniforms;
      u.tDiffuse.value     = colorMap;
      u.tNight.value       = nightMap;
      u.tClouds.value      = cloudsMap;
      u.tSpecular.value    = specularMap;
      // Sun direction is FIXED in world space — do NOT rotate it with the earth
      u.sunDirection.value.copy(FIXED_SUN_DIRECTION);
      u.uViewMode.value    = modeVal;
    }

    // ── Earth rotation — only the MESH rotates, not the sun ──
    if (earthRef.current) {
      earthRef.current.rotation.y = getEarthRotation(time);

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
    tDiffuse:     { value: colorMap },
    tNight:       { value: nightMap },
    tClouds:      { value: cloudsMap },
    tSpecular:    { value: specularMap },
    sunDirection: { value: FIXED_SUN_DIRECTION.clone() },
    uViewMode:    { value: 0.0 },
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
