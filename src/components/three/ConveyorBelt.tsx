import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONVEYOR_LENGTH, CONVEYOR_WIDTH, CONVEYOR_HEIGHT } from '../../utils/constants';
import { useProductionStore } from '../../store/useProductionStore';

export function ConveyorBelt() {
  const beltRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { globalSpeed, isRunning, machines } = useProductionStore();
  const hasFault = machines.some((m) => m.status === 'fault');

  const beltMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1f29',
      roughness: 0.8,
      metalness: 0.2,
    });
  }, []);

  const frameMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#2d3748',
      roughness: 0.6,
      metalness: 0.4,
    });
  }, []);

  const rollerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#4a5568',
      roughness: 0.5,
      metalness: 0.5,
    });
  }, []);

  useFrame((_, delta) => {
    if (beltRef.current && isRunning && !hasFault) {
      const material = beltRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.x += delta * globalSpeed * 0.5;
      }
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      if (hasFault) {
        mat.color.set('#F53F3F');
        mat.emissive.set('#F53F3F');
        mat.emissiveIntensity = 0.1;
      } else {
        mat.color.set('#165DFF');
        mat.emissive.set('#165DFF');
        mat.emissiveIntensity = 0.2;
      }
    }
  });

  const rollers = useMemo(() => {
    const rollerPositions: [number, number, number][] = [];
    const rollerCount = Math.floor(CONVEYOR_LENGTH / 2) + 1;
    for (let i = 0; i < rollerCount; i++) {
      const x = -CONVEYOR_LENGTH / 2 + (i * CONVEYOR_LENGTH) / (rollerCount - 1);
      rollerPositions.push([x, CONVEYOR_HEIGHT / 2, 0]);
    }
    return rollerPositions;
  }, []);

  const legs = useMemo(() => {
    const legPositions: [number, number, number][] = [
      [-CONVEYOR_LENGTH / 2 + 1, -0.5, CONVEYOR_WIDTH / 2 + 0.2],
      [-CONVEYOR_LENGTH / 2 + 1, -0.5, -CONVEYOR_WIDTH / 2 - 0.2],
      [CONVEYOR_LENGTH / 2 - 1, -0.5, CONVEYOR_WIDTH / 2 + 0.2],
      [CONVEYOR_LENGTH / 2 - 1, -0.5, -CONVEYOR_WIDTH / 2 - 0.2],
      [0, -0.5, CONVEYOR_WIDTH / 2 + 0.2],
      [0, -0.5, -CONVEYOR_WIDTH / 2 - 0.2],
    ];
    return legPositions;
  }, []);

  return (
    <group position={[0, CONVEYOR_HEIGHT / 2, 0]}>
      {legs.map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.15, 1, 0.15]} />
          <primitive object={frameMaterial} attach="material" />
        </mesh>
      ))}

      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[CONVEYOR_LENGTH + 0.4, 0.1, CONVEYOR_WIDTH + 0.4]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {rollers.map((pos, i) => (
        <mesh key={`roller-${i}`} position={pos} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, CONVEYOR_WIDTH + 0.5, 16]} />
          <primitive object={rollerMaterial} attach="material" />
        </mesh>
      ))}

      <mesh ref={beltRef} position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[CONVEYOR_LENGTH, 0.05, CONVEYOR_WIDTH]} />
        <primitive object={beltMaterial} attach="material" />
      </mesh>

      <mesh ref={glowRef} position={[0, 0.11, 0]}>
        <boxGeometry args={[CONVEYOR_LENGTH, 0.01, CONVEYOR_WIDTH]} />
        <meshStandardMaterial
          color="#165DFF"
          emissive="#165DFF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}
