export const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    // Use the 3x3 portion of modelMatrix for normals (correct for non-uniform scale cases)
    // modelMatrix includes both the group tilt and mesh rotation
    mat3 worldMat = mat3(modelMatrix);
    vWorldNormal = normalize(worldMat * normal);
    vec4 worldPos4 = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos4.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos4;
  }
`;

export const earthFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform sampler2D tNight;
  uniform sampler2D tSpecular;
  uniform sampler2D tClouds;

  uniform vec3 sunDirection;
  uniform float uViewMode; // 0.0=day 1.0=night 2.0=live
  uniform float uAtmosphereBoost; // Boost atmosphere glow on close pass

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  // Boost color saturation by factor s (1.0 = unchanged)
  vec3 saturate(vec3 color, float s) {
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(lum), color, s);
  }

  void main() {
    vec3 normal   = normalize(vWorldNormal);
    vec3 viewDir  = normalize(cameraPosition - vWorldPosition);
    // lightDir is the fixed world-space sun direction
    vec3 lightDir = normalize(sunDirection);

    // ---- read textures ----
    vec3 dayColor   = texture2D(tDiffuse,  vUv).rgb;
    vec3 nightColor = texture2D(tNight,    vUv).rgb;
    float specStr   = texture2D(tSpecular, vUv).r;
    float cloudMask = clamp(texture2D(tClouds, vUv).r, 0.0, 1.0);

    // Boost day texture saturation to eliminate washed-out grey-tan look
    dayColor = saturate(dayColor, 1.35);

    // ================================================================
    // UNIFIED LIGHTING / TERMINATOR
    // Computed in world space: normal rotates with the earth,
    // lightDir is fixed → NdotL changes as earth spins → visible terminator
    // ================================================================
    float NdotL = dot(normal, lightDir);
    // Soft graduated band spanning ~50° either side of the terminator
    float terminator = smoothstep(-0.25, 0.25, NdotL);

    // ================================================================
    // 1. DAY TEXTURE (Lit & Shadowed)
    // ================================================================
    vec3 dayBase = mix(dayColor, vec3(1.0), cloudMask * 0.85);
    
    // Specular highlight only on lit side (Blinn-Phong)
    float NdotH  = max(dot(normal, normalize(lightDir + viewDir)), 0.0);
    float specular = pow(NdotH, 32.0) * specStr * 0.6;
    
    // Shadowed side: cool blue-grey tint, ~10% brightness — texture remains readable
    vec3 shadowTint = vec3(0.08, 0.10, 0.18);
    vec3 dayShadow  = dayBase * shadowTint;
    
    // Lit side: slightly dimmed for realism
    vec3 dayLit  = dayBase * 0.88 + vec3(specular);
    vec3 dayFace = mix(dayShadow, dayLit, terminator);

    // ================================================================
    // 2. STYLIZED NIGHT MODE (uViewMode == 1.0)
    // ================================================================
    // A. Base Sphere: Deep near-black navy (#050810 to #0A1420)
    vec3 nightNavyBase = vec3(0.020, 0.031, 0.063);
    
    // B. City Lights: Sourced from real texture data, bold warm-gold amber palette
    float rawLum   = dot(nightColor, vec3(0.299, 0.587, 0.114));
    float cityMask = smoothstep(0.08, 0.45, rawLum); // bold cluster mask
    
    vec3 sparseGold = vec3(0.788, 0.478, 0.188); // #C97A30
    vec3 midGold    = vec3(1.0, 0.72, 0.30);    // #FFB84D / #E08A3C
    vec3 coreGold   = vec3(1.0, 0.85, 0.54);    // #FFD98A
    vec3 hotWhite   = vec3(1.5, 1.4, 1.3);     // bloom bleed core
    
    vec3 goldColorMap = mix(
      mix(sparseGold, midGold, smoothstep(0.0, 0.35, cityMask)),
      mix(coreGold, hotWhite, smoothstep(0.7, 1.0, cityMask)),
      smoothstep(0.35, 0.7, cityMask)
    );
    float nightCityIntensity = pow(cityMask, 1.1) * 6.5;
    vec3 nightCityLights = goldColorMap * nightCityIntensity;

    // C. Atmospheric Rim Halo: 360° uniform cyan-blue glow (#4FB8F0 to #6FD0FF)
    // Angle-independent around full circumference (not gated by sun NdotL)
    float NdotV  = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 3.8); // smooth inward/outward falloff
    
    vec3 cyanOuter = vec3(0.31, 0.72, 0.94);  // #4FB8F0
    vec3 cyanCore  = vec3(0.435, 0.815, 1.0); // #6FD0FF
    vec3 cyanRimColor = mix(cyanOuter, cyanCore, pow(fresnel, 1.2));
    vec3 nightRimHalo = cyanRimColor * fresnel * 2.5 * uAtmosphereBoost;

    vec3 nightModeFace = nightNavyBase + nightCityLights + nightRimHalo;

    // ================================================================
    // 3. PHOTOREAL SUNLIT LIMB (for Day & Live modes)
    // ================================================================
    float dayFresnel = pow(1.0 - NdotV, 4.5);
    float rimGate = smoothstep(-0.1, 0.25, NdotL);
    vec3 rimCore  = vec3(0.40, 0.80, 1.0);
    vec3 rimOuter = vec3(0.20, 0.60, 0.98);
    vec3 rimColor = mix(rimOuter, rimCore, pow(dayFresnel, 1.2));
    vec3 dayAtmosphereRim = rimColor * dayFresnel * rimGate * 1.5 * uAtmosphereBoost;

    // ================================================================
    // 4. COMBINE BASED ON VIEW MODE
    // ================================================================
    vec3 finalColor;
    if (uViewMode < 0.5) {
      // DAY MODE: Day texture with real terminator shadow + sunlit rim
      finalColor = dayFace + dayAtmosphereRim;
    } else if (uViewMode < 1.5) {
      // NIGHT MODE: Stylized uniform dark navy + gold city lights + 360° cyan rim
      finalColor = nightModeFace;
    } else {
      // LIVE MODE: Day on lit side, night lights on dark side
      vec3 liveNight = nightNavyBase + (nightCityLights * (1.0 - smoothstep(-0.1, 0.2, NdotL)));
      finalColor = mix(liveNight, dayFace, terminator) + dayAtmosphereRim;
    }
    
    finalColor = clamp(finalColor, 0.0, 3.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

