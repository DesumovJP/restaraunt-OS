export type TableStatus = 'free' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  documentId?: string; // Strapi v5 document ID (required for GraphQL)
  number: number;
  status: TableStatus;
  capacity: number;
  currentGuests?: number;
  reservedBy?: string;
  reservedAt?: Date;
  occupiedAt?: Date; // Час, коли столик був зайнятий (для таймера)
  zone?: string; // Zone/area of the restaurant
}
