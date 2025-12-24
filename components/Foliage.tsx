import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, THEME } from '../types';

interface FoliageProps {
  count: number;
  height: number;
  radius: number;
  chaosRadius: number;
  state: TreeState;
}

// Custom Shader Material with "Magical" Physics
const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color(THEME.colors.emerald) },
    uGold: { value: new THREE.Color(THEME.colors.gold) }
  },
  vertexShader: `
    uniform float uProgress;
    uniform float uTime;
    attribute vec3 aPositionChaos;
    attribute vec3 aPositionTarget;
    attribute float aRandom;
    
    varying float vAlpha;
    varying float vRandom;
    varying vec2 vUv;
    varying float vProgress;

    // Cubic easing for smoother transition
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    // rotation matrix around Y axis
    mat2 rotate2d(float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
    }

    void main() {
      vUv = uv;
      vRandom = aRandom;
      
      // 1. Staggered Animation
      // Use randomness to offset the progress per particle so they don't move as a solid block
      float localProgress = smoothstep(0.0, 1.0, (uProgress - aRandom * 0.15) / 0.85);
      float t = easeInOutCubic(localProgress);
      vProgress = t;

      // 2. Vortex / Spiral Effect
      // Interpolate positions
      vec3 pos = mix(aPositionChaos, aPositionTarget, t);
      
      // Calculate a "spin" amount. 
      // When t is 0 (Chaos), spin is high. When t is 1 (Formed), spin is 0.
      float spinAmount = (1.0 - t) * 3.0 * (aRandom + 0.5); 
      
      // Apply rotation to XZ plane
      pos.xz = rotate2d(spinAmount) * pos.xz;

      // 3. Arcing / Expansion
      // Bulge outward slightly during the middle of the transition for an "explosive" feel
      float expansion = sin(t * 3.14159) * 2.0 * aRandom;
      pos += normalize(pos) * expansion;

      // 4. Organic Wind / Breathing (When formed)
      if (t > 0.8) {
        float windTime = uTime * 1.5;
        float xOffset = sin(windTime + pos.y * 0.5) * 0.1;
        float zOffset = cos(windTime * 0.8 + pos.x * 0.5) * 0.05;
        
        // Add high frequency noise for "shimmer"
        float jitter = sin(uTime * 5.0 + aRandom * 10.0) * 0.02;

        pos.x += xOffset + jitter;
        pos.z += zOffset + jitter;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // 5. Size Attenuation & Pulsing
      // Particles pulse in size for a twinkling effect
      float pulse = 1.0 + sin(uTime * 3.0 + aRandom * 20.0) * 0.3;
      gl_PointSize = (120.0 / -mvPosition.z) * (0.6 + aRandom * 0.6) * pulse;
      
      // Fade calculation
      vAlpha = 0.5 + (0.5 * t); 
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uGold;
    uniform float uTime;
    
    varying float vAlpha;
    varying float vRandom;
    varying float vProgress;
    
    void main() {
      // Circular particle soft edge
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if(dist > 0.5) discard;
      
      // Gradient / Glow
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5); // Sharpen the dot
      
      // Twinkle Color Shift
      // Mix between Emerald Green and Gold based on time and randomness
      float twinkle = sin(uTime * 4.0 + vRandom * 50.0);
      // Only twinkle when fully formed or transitioning
      vec3 finalColor = mix(uColor, uGold, smoothstep(0.8, 1.0, twinkle) * 0.5 * vProgress);

      // Add a hot white center
      finalColor = mix(finalColor, vec3(1.0), strength * 0.3 * step(0.8, vProgress));

      gl_FragColor = vec4(finalColor, vAlpha * strength);
    }
  `
};

export const Foliage: React.FC<FoliageProps> = ({ count, height, radius, chaosRadius, state }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  // Generate Geometry Data
  const { positionsChaos, positionsTarget, randoms } = useMemo(() => {
    const pChaos = new Float32Array(count * 3);
    const pTarget = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 1. Chaos Position: Random Sphere with varying density
      const r = chaosRadius * Math.pow(Math.random(), 1/3); // Cube root for uniform sphere
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const xC = r * Math.sin(phi) * Math.cos(theta);
      const yC = r * Math.sin(phi) * Math.sin(theta);
      const zC = r * Math.cos(phi);

      pChaos[i * 3] = xC;
      pChaos[i * 3 + 1] = yC;
      pChaos[i * 3 + 2] = zC;

      // 2. Target Position: Volumetric Cone
      // Use a volumetric distribution so the tree looks full, not just a shell
      const h = Math.random(); // Normalized height 0-1
      const yT = h * height; 
      
      // Radius at this height (Cone shape)
      const maxR = (1.0 - h) * radius;
      
      // Random radius within the cone at this height (Volume)
      // SQRT ensures uniform distribution on the disc
      const rT = maxR * Math.sqrt(Math.random()); 
      const angle = Math.random() * Math.PI * 2;

      const xT = rT * Math.cos(angle);
      const zT = rT * Math.sin(angle);
      
      pTarget[i * 3] = xT;
      pTarget[i * 3 + 1] = yT; // Bottom is 0
      pTarget[i * 3 + 2] = zT;

      rnd[i] = Math.random();
    }

    return { 
      positionsChaos: pChaos, 
      positionsTarget: pTarget, 
      randoms: rnd 
    };
  }, [count, height, radius, chaosRadius]);

  // Use a ref to track animation progress independently of react render cycle
  const progress = useRef(0);
  
  useFrame((rootState, delta) => {
    if (shaderRef.current) {
      // Update time uniform
      shaderRef.current.uniforms.uTime.value = rootState.clock.elapsedTime;
      
      // Determine target progress based on prop state
      const target = state === TreeState.FORMED ? 1 : 0;
      
      // Smoothly lerp current progress towards target
      // Slower interpolation for a more "majestic" feel
      progress.current = THREE.MathUtils.lerp(progress.current, target, delta * 0.5);
      
      // Update shader uniform
      shaderRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positionsChaos} // Initial positions
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionChaos"
          count={count}
          array={positionsChaos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionTarget"
          count={count}
          array={positionsTarget}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};