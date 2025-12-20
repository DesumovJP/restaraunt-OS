export type TableStatus = 'free' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  capacity: number;
  currentGuests?: number;
  reservedBy?: string;
  reservedAt?: Date;
}
