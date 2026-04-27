/** Web Locks API 래퍼. 미지원 브라우저에서는 noop. 권한은 서버가 결정. */

export type SessionLockHandle = {
  release: () => void;
};

export async function acquireSessionLock(sessionUuid: string): Promise<SessionLockHandle | null> {
  const lockManager = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!lockManager?.request) return null;

  const name = `interview_session_${sessionUuid}`;
  let releaseFn: (() => void) | null = null;
  let acquired = false;

  const lockPromise = lockManager.request(name, { ifAvailable: true }, async (lock) => {
    if (lock === null) return;
    acquired = true;
    await new Promise<void>((resolve) => {
      releaseFn = resolve;
    });
  });

  // Yield once to let lockManager resolve the ifAvailable check synchronously.
  await Promise.resolve();

  if (!acquired) {
    void lockPromise;
    return null;
  }

  return {
    release: () => {
      if (releaseFn) releaseFn();
    },
  };
}
