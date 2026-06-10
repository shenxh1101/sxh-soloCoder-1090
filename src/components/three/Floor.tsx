import { useRef, useMemo } from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

export function Floor() {
  const gridRef = useRef<THREE.Group>(null);

  const floorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0a0e14',
      roughness: 0.9,
      metalness: 0.1,
    });
  }, []);

  return (
    <group ref={gridRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      <Grid
        position={[0, 0.01, 0]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e3a5f"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#165DFF"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
    </group>
  );
}
