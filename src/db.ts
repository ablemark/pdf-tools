import Dexie, { Table } from 'dexie';

export interface HistoryRecord {
  id?: number;
  fileName: string;
  operationType: string;
  timestamp: number;
  fileSize: number;
  status: 'success' | 'failed';
  blob?: Blob;
}

export class HistoryDB extends Dexie {
  records!: Table<HistoryRecord, number>;

  constructor() {
    super('HistoryDB');
    this.version(1).stores({
      records: '++id, fileName, operationType, timestamp, fileSize, status'
    });
  }
}

export const db = new HistoryDB();

export async function addHistoryRecord(record: Omit<HistoryRecord, 'id'>) {
  try {
    await db.records.add(record);
  } catch (error) {
    console.error('Failed to save history record:', error);
  }
}
