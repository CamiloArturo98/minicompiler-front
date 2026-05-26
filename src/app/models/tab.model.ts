export interface Tab {
  id: number;
  name: string;
  code: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TabRequest {
  name: string;
  code: string;
  position: number;
}