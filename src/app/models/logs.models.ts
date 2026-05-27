export interface LogRecord {
  id: number;
  sessionId?: number;
  sourceCode: string;
  output?: string;
  bytecode?: string;
  success: boolean;
  errorMessage?: string;
  compilationTimeMs: number;
  instructionsExecuted: number;
  optimized: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
