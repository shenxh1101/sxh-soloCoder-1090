import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Effects } from '@react-three/drei';
import { EffectComposer, Bloom, FXAA, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Floor } from './Floor';
import { ProductionLine } from './ProductionLine';
import { useProductionLoop } from '../../hooks/useProductionLoop';
import { useFirstPersonCamera } from '../../hooks/useFirstPersonCamera';
import { useProductionStore } from '../../store/useProductionStore';

function SceneContent() {
  const { camera } = useThree();
  const { cameraMode } = useProductionStore();
  const controlsRef = useRef<any>(null);

  useProductionLoop();
  useFirstPersonCamera();

  const ambientLightIntensity = useMemo(() => 0.4, []);
  const directionalLightIntensity = useMemo(() => 1.2, []);

  return (
    <>
      <color attach="background" args={['#0a0e14']} />
      <fog attach="fog" args={['#0a0e14', 20, 60]} />

      <ambientLight intensity={ambientLightIntensity} color="#87ceeb" />

      <directionalLight
        position={[10, 20, 10]}
        intensity={directionalLightIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#165DFF" />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#722ED1" />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <Floor />
      <ProductionLine />

      {cameraMode === 'overview' && (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 1, 0]}
        />
      )}

      <Effects>
        <EffectComposer multisampling={8}>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            height={300}
            intensity={0.5}
          />
          <FXAA />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      </Effects>
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 15], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
