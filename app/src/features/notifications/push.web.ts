/** Web 版はプッシュ通知なし（要件 U-30）。ネイティブ版と同じ形で何もしない */
export type RegisterResult = 'registered' | 'denied' | 'unavailable';

export function configureNotificationHandler() {}

export async function registerForPush(): Promise<RegisterResult> {
  return 'unavailable';
}

export async function unregisterPush(): Promise<void> {}

export function subscribeNotificationTaps(_onTap: (data: unknown, id: string) => void): () => void {
  return () => {};
}
