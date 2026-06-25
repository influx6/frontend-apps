export default interface TodoData {
  id: string;
  detail: string;
  completed: boolean;
  created: Date;
}

export interface TodoResult {
  items: TodoData[];
  batchSize: number;
  nextCursor: number | null;
  prevCursor: number | null;
}
