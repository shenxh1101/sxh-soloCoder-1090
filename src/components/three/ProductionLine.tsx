import { ConveyorBelt } from './ConveyorBelt';
import { Machine } from './Machine';
import { Workpieces } from './Workpiece';
import { useProductionStore } from '../../store/useProductionStore';

export function ProductionLine() {
  const { machines } = useProductionStore();

  return (
    <group>
      <ConveyorBelt />
      {machines.map((machine) => (
        <Machine key={machine.id} machine={machine} />
      ))}
      <Workpieces />
    </group>
  );
}
