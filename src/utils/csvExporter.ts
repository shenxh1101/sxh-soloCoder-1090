import type { ProductionRecord } from '../types/production';

export function exportProductionDataToCSV(records: ProductionRecord[]): void {
  if (records.length === 0) {
    alert('暂无生产数据可导出');
    return;
  }

  const headers = ['时间', '生产量', '效率(%)', 'OEE(%)', '故障时长(秒)'];
  const rows = records.map((record) => [
    new Date(record.timestamp).toLocaleString('zh-CN'),
    record.count.toString(),
    record.efficiency.toFixed(2),
    record.oee.toFixed(2),
    (record.faultDuration / 1000).toFixed(2),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `production-data-${timestamp}.csv`);
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
