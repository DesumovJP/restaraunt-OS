export type TableStatus = 'free' | 'occupied' | 'reserved' | 'billing';

export type CloseReason =
  | 'normal'            // Звичайне закриття
  | 'mistaken_open'     // Помилково відкрито
  | 'no_show'           // Гість не прийшов
  | 'walkout'           // Пішов без оплати
  | 'emergency'         // Екстрене закриття
  | 'technical_error';  // Технічна помилка

export type TableZone = 'main' | 'terrace' | 'vip' | 'bar';

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
  freedAt?: Date;
  zone?: TableZone; // Zone/area of the restaurant
  lastCloseReason?: CloseReason; // Причина останнього закриття
  closeComment?: string; // Коментар до закриття
  mergedWith?: string[]; // IDs столів, з якими об'єднано
  primaryTableId?: string; // ID основного столу при об'єднанні
  reservationId?: string; // ID бронювання
}
