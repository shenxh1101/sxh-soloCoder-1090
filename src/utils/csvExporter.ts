import type { ProductionRecord, Machine } from '../types/production';
import { getLiveMachineFaultDuration } from './efficiencyCalculator';

function formatMachineStatus(status: Machine['status']): string {
  switch (status) {
    case 'running':
      return '运行中';
    case 'idle':
      return '空闲';
    case 'fault':
      return '故障';
  }
}

export function exportProductionDataToCSV(records: ProductionRecord[], machines: Machine[]): void {
  if (records.length === 0 && machines.length === 0) {
    alert('暂无生产数据可导出');
    return;
  }

  const lines: string[] = [];

  lines.push('=== 生产线汇总数据 ===');
  const summaryHeaders = ['时间', '生产量', '效率(%)', 'OEE(%)', '故障时长(秒)'];
  lines.push(summaryHeaders.join(','));
  for (const record of records) {
    lines.push([
      new Date(record.timestamp).toLocaleString('zh-CN'),
      record.count.toString(),
      record.efficiency.toFixed(2),
      record.oee.toFixed(2),
      (record.faultDuration / 1000).toFixed(2),
    ].join(','));
  }

  lines.push('');
  lines.push('=== 设备明细数据 ===');
  const machineHeaders = ['设备名称', '当前状态', '加工数量', '故障次数', '累计故障时长(秒)', '损失产量(累计)', '最近故障时间'];
  lines.push(machineHeaders.join(','));
  for (const machine of machines) {
    const totalFaultDuration = getLiveMachineFaultDuration(machine);
    const totalLostProduction = machine.faultRecords.reduce((sum, fr) => sum + fr.lostProduction, 0);
    const lastFaultRecord = machine.faultRecords.length > 0
      ? machine.faultRecords[machine.faultRecords.length - 1]
      : null;
    const lastFaultTime = lastFaultRecord
      ? new Date(lastFaultRecord.timestamp).toLocaleString('zh-CN')
      : '无';
    lines.push([
      machine.name,
      formatMachineStatus(machine.status),
      machine.processedCount.toString(),
      machine.faultCount.toString(),
      (totalFaultDuration / 1000).toFixed(2),
      totalLostProduction.toString(),
      lastFaultTime,
    ].join(','));
  }

  lines.push('');
  lines.push('=== 故障复盘记录 ===');
  const faultHeaders = ['设备名称', '故障开始时间', '修复时间', '持续时长(秒)', '损失产量(件)', '故障时产量', '修复时产量'];
  lines.push(faultHeaders.join(','));
  for (const machine of machines) {
    for (const fr of machine.faultRecords) {
      const resolveTime = fr.resolvedAt
        ? new Date(fr.resolvedAt).toLocaleString('zh-CN')
        : '未修复';
      const duration = fr.resolvedAt
        ? (fr.duration / 1000).toFixed(2)
        : ((Date.now() - fr.timestamp) / 1000).toFixed(2);
      const productionAtResolve = fr.resolvedAt
        ? fr.productionAtResolve.toString()
        : '未修复';
      lines.push([
        machine.name,
        new Date(fr.timestamp).toLocaleString('zh-CN'),
        resolveTime,
        duration,
        fr.lostProduction.toString(),
        fr.productionAtFault.toString(),
        productionAtResolve,
      ].join(','));
    }
  }

  lines.push('');
  lines.push('=== 故障汇总统计 ===');
  const faultSummaryHeaders = ['设备名称', '故障次数', '平均修复时长(秒)', '累计停机时长(秒)', '累计损失产量(件)'];
  lines.push(faultSummaryHeaders.join(','));
  for (const machine of machines) {
    const resolvedFaults = machine.faultRecords.filter(fr => fr.resolvedAt);
    const averageRepairDuration = resolvedFaults.length > 0
      ? (resolvedFaults.reduce((sum, fr) => sum + fr.duration, 0) / resolvedFaults.length / 1000).toFixed(2)
      : '0';
    const totalFaultDurationSec = (getLiveMachineFaultDuration(machine) / 1000).toFixed(2);
    const totalLostProduction = machine.faultRecords.reduce((sum, fr) => sum + fr.lostProduction, 0);
    lines.push([
      machine.name,
      machine.faultCount.toString(),
      averageRepairDuration,
      totalFaultDurationSec,
      totalLostProduction.toString(),
    ].join(','));
  }

  const csvContent = lines.join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute('href', url);
  link.setAttribute('download', `产线A_生产数据_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function loadProductionDataFromStorage(): ProductionRecord[] {
  try {
    const data = localStorage.getItem('productionHistory');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load production data:', e);
  }
  return [];
}

export function saveProductionDataToStorage(records: ProductionRecord[]): void {
  try {
    localStorage.setItem('productionHistory', JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save production data:', e);
  }
}
