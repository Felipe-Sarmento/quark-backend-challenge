export interface DlqPayload<T> {
  originalPayload: T;
  retryCount: number;
  errorMessage: string;
  failedAt: string;
  workerName: string;
}

export function computeRetryDelayMs(retryCount: number, capMs = 30_000): number {
  return Math.min(1000 * Math.pow(2, retryCount - 1), capMs);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
