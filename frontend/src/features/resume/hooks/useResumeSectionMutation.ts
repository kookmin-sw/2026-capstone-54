/**
 * 이력서 섹션 저장(mutation) 공통 훅.
 *
 * 인라인 편집에서 사용한다. 호출자는 mutator 함수를 넘기고, 이 훅은
 * isSaving / error / save() 트리오를 반환한다. 저장 성공 시 onSuccess 콜백을 호출해
 * 부모가 캐시(detail state) 를 갱신한다.
 */

import { useCallback, useState } from "react";

interface Options<TResult> {
  /** 실제 API 호출. 호출자가 클로저로 resume_uuid 등을 넣어 전달한다. */
  mutator: () => Promise<TResult>;
  /** 성공 시 부모 캐시 갱신용 콜백. */
  onSuccess?: (result: TResult) => void;
  /** 실패 시 콜백. */
  onError?: (err: Error) => void;
}

export function useResumeSectionMutation<TResult>() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const save = useCallback(async (opts: Options<TResult>) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await opts.mutator();
      opts.onSuccess?.(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      opts.onError?.(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { isSaving, error, save };
}
