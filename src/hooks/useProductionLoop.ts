import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useProductionStore } from '../store/useProductionStore';

export function useProductionLoop() {
  const {
    updateWorkpieces,
    spawnWorkpiece,
    recordProductionData,
    updateEfficiencyMetrics,
    addRunTime,
    isRunning,
    globalSpeed,
  } = useProductionStore();

  const lastTimeRef = useRef(0);
  const efficiencyUpdateRef = useRef(0);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    efficiencyUpdateRef.current = performance.now();
  }, []);

  useFrame(() => {
    if (!isRunning) return;

    const now = performance.now();
    const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    spawnWorkpiece();
    updateWorkpieces(deltaTime);
    addRunTime(deltaTime);
    recordProductionData();

    if (now - efficiencyUpdateRef.current > 1000) {
      updateEfficiencyMetrics();
      efficiencyUpdateRef.current = now;
    }
  });

  return null;
}
