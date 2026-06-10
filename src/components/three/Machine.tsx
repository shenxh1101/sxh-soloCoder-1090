import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Machine as MachineType } from '../../types/production';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import { useProductionStore } from '../../store/useProductionStore';

interface MachineProps {
  machine: MachineType;
}

export function Machine({ machine }: MachineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { triggerFault } = useProductionStore();

  const statusColor = STATUS_COLORS[machine.status];

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (machine.status !== 'fault') {
      triggerFault(machine.id);
    }
  };

  const bodyMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: machine.status === 'fault' ? '#3d1a1a' : '#2d3748',
      roughness: 0.4,
      metalness: 0.6,
    });
  }, [machine.status]);

  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: machine.status === 'fault' ? 0.8 : 0.3,
      roughness: 0.3,
      metalness: 0.5,
    });
  }, [statusColor, machine.status]);

  useFrame((state) => {
    if (groupRef.current && machine.status === 'running') {
      groupRef.current.position.y = machine.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
    if (lightRef.current) {
      const intensity = machine.status === 'fault'
        ? 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.5
        : machine.status === 'running'
        ? 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
        : 0.3;
      lightRef.current.intensity = intensity;
    }
  });

  const isInspection = machine.id === 'm4';

  return (
    <group
      ref={groupRef}
      position={machine.position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <pointLight
        ref={lightRef}
        position={[0, 3, 0]}
        color={statusColor}
        intensity={0.5}
        distance={5}
      />

      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 2, 1.5]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[1.6, 0.2, 1.6]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.8, 0.2, 1.8]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} metalness={0.3} />
      </mesh>

      {!isInspection ? (
        <>
          <mesh position={[0, 1.5, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
            <meshStandardMaterial
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={machine.status === 'fault' ? 0.5 : 0.2}
            />
          </mesh>
          <mesh position={[0, 1.5, 1.2]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={machine.status === 'fault' ? 0.6 : 0.3}
            />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.2, 0.8]} castShadow>
            <boxGeometry args={[0.8, 0.8, 0.3]} />
            <meshStandardMaterial
              color="#00B42A"
              emissive="#00B42A"
              emissiveIntensity={machine.status === 'fault' ? 0 : 0.3}
            />
          </mesh>
          <mesh position={[0, 1.2, 1.0]}>
            <boxGeometry args={[0.4, 0.4, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={machine.status === 'fault' ? 0 : 0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        </>
      )}

      <mesh position={[0, 0.5, 0.76]}>
        <boxGeometry args={[0.6, 0.3, 0.02]} />
        <meshStandardMaterial
          color={machine.status === 'fault' ? '#F53F3F' : '#0a0e14'}
          emissive={machine.status === 'fault' ? '#F53F3F' : '#000000'}
          emissiveIntensity={machine.status === 'fault' ? 0.3 : 0}
        />
      </mesh>

      <Html
        position={[0, 3.5, 0]}
        center
        distanceFactor={8}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="min-w-[180px] rounded-lg border border-opacity-50 bg-black bg-opacity-70 backdrop-blur-sm px-3 py-2 text-white shadow-lg"
          style={{
            borderColor: statusColor,
            boxShadow: `0 0 20px ${statusColor}40`,
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">{machine.name}</span>
            <span
              className="rounded px-2 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: `${statusColor}30`,
                color: statusColor,
              }}
            >
              {STATUS_LABELS[machine.status]}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">加工数量</span>
            <span className="font-mono font-bold" style={{ color: statusColor }}>
              {machine.processedCount}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-gray-400">效率</span>
            <span className="font-mono font-bold" style={{ color: statusColor }}>
              {machine.efficiency.toFixed(1)}%
            </span>
          </div>
          {machine.status === 'fault' && (
            <div className="mt-2 animate-pulse text-center text-xs font-bold text-red-400">
              点击重置故障
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
