export type BoardData = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type ColumnData = {
  id: string;
  name: string;
  order: number;
  boardId: string;
};

export type ItemData = {
  id: string;
  title: string;
  content?: string;
  order: number;
  columnId: string;
};
