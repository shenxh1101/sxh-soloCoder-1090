import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useProductionStore, getWorkpiecePosition } from '../../store/useProductionStore';
import { WORKPIECE_SIZE } from '../../utils/constants';
import type { Workpiece as WorkpieceType } from '../../types/production';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

export function Workpieces() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const { workpieces, isRunning, globalSpeed } = useProductionStore();

  const rotationRef = useRef(0);

  const processedColor = useMemo(() => new THREE.Color('#00B42A'), []);
  const unprocessedColor = useMemo(() => new THREE.Color('#FF7D00'), []);
  const failedColor = useMemo(() => new THREE.Color('#F53F3F'), []);

  useFrame((state, delta) => {
    if (!instancedMeshRef.current) return;

    const mesh = instancedMeshRef.current;
    rotationRef.current += delta * 2 * globalSpeed;

    workpieces.forEach((wp: WorkpieceType, i: number) => {
      const [x, y, z] = getWorkpiecePosition(wp.progress);

      dummy.position.set(x, y, z);

      const rotationOffset = wp.progress * Math.PI * 4;
      dummy.rotation.set(
        isRunning ? rotationRef.current + rotationOffset : 0,
        isRunning ? rotationRef.current * 0.7 + rotationOffset : 0,
        0
      );

      const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.05;
      dummy.scale.setScalar(scale);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (wp.inspected && !wp.passed) {
        mesh.setColorAt(i, failedColor);
      } else if (wp.processed) {
        mesh.setColorAt(i, processedColor);
      } else {
        mesh.setColorAt(i, unprocessedColor);
      }
    });

    for (let i = workpieces.length; i < mesh.count; i++) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(0x000000));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  const maxCount = useProductionStore.getState().maxWorkpieces;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, maxCount]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[WORKPIECE_SIZE, WORKPIECE_SIZE, WORKPIECE_SIZE]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.6}
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
}
