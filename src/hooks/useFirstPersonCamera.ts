import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useProductionStore } from '../store/useProductionStore';
import { CONVEYOR_LENGTH } from '../utils/constants';

export function useFirstPersonCamera() {
  const { camera } = useThree();
  const { cameraMode, globalSpeed } = useProductionStore();
  const pathProgressRef = useRef(0);
  const isFirstPersonRef = useRef(cameraMode === 'firstPerson');

  useEffect(() => {
    isFirstPersonRef.current = cameraMode === 'firstPerson';
    if (cameraMode === 'overview') {
      camera.position.set(0, 15, 15);
      camera.lookAt(0, 0, 0);
    }
  }, [cameraMode, camera]);

  const getPathPosition = useCallback((progress: number): THREE.Vector3 => {
    const startX = -CONVEYOR_LENGTH / 2 - 2;
    const endX = CONVEYOR_LENGTH / 2 + 2;
    const x = startX + progress * (endX - startX);
    const y = 2.5;
    const z = -2;
    return new THREE.Vector3(x, y, z);
  }, []);

  const getLookAtPosition = useCallback((progress: number): THREE.Vector3 => {
    const startX = -CONVEYOR_LENGTH / 2;
    const endX = CONVEYOR_LENGTH / 2;
    const x = startX + progress * (endX - startX);
    return new THREE.Vector3(x, 0.5, 0);
  }, []);

  useFrame((_, delta) => {
    if (!isFirstPersonRef.current) return;

    pathProgressRef.current += delta * 0.05 * globalSpeed;
    if (pathProgressRef.current > 1) {
      pathProgressRef.current = 0;
    }

    const targetPosition = getPathPosition(pathProgressRef.current);
    const targetLookAt = getLookAtPosition(pathProgressRef.current);

    camera.position.lerp(targetPosition, delta * 2);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.add(camera.position);
    currentLookAt.lerp(targetLookAt, delta * 2);
    camera.lookAt(currentLookAt);
  });

  return null;
}
