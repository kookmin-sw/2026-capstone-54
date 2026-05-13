import { renderHook, act } from "@testing-library/react";
import { useResumeSectionMutation } from "../useResumeSectionMutation";

describe("useResumeSectionMutation — 초기 상태", () => {
  it("isSaving=false, error=null, save 함수 노출", () => {
    const { result } = renderHook(() => useResumeSectionMutation<string>());
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.save).toBe("function");
  });
});

describe("useResumeSectionMutation — save 성공", () => {
  it("mutator 결과 반환 + onSuccess 콜백 호출", async () => {
    const mutator = jest.fn().mockResolvedValue("saved-value");
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useResumeSectionMutation<string>());

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.save({ mutator, onSuccess });
    });

    expect(returnValue).toBe("saved-value");
    expect(mutator).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("saved-value");
  });

  it("성공 후 isSaving=false, error=null 유지", async () => {
    const mutator = jest.fn().mockResolvedValue({ updated: true });
    const { result } = renderHook(() => useResumeSectionMutation<{ updated: boolean }>());

    await act(async () => {
      await result.current.save({ mutator });
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("save 진행 중 isSaving=true (시작 시점) + 종료 후 false", async () => {
    let resolvePromise: (v: string) => void;
    const mutator = jest.fn(() => new Promise<string>((resolve) => { resolvePromise = resolve; }));
    const { result } = renderHook(() => useResumeSectionMutation<string>());

    act(() => { void result.current.save({ mutator }); });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolvePromise!("done");
      await Promise.resolve();
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("onSuccess 콜백 미전달도 성공 처리", async () => {
    const mutator = jest.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useResumeSectionMutation<string>());

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.save({ mutator });
    });

    expect(returnValue).toBe("ok");
  });
});

describe("useResumeSectionMutation — save 실패", () => {
  it("Error 인스턴스 throw 시 error 상태에 저장 + 재throw + onError 콜백", async () => {
    const err = new Error("저장 실패");
    const mutator = jest.fn().mockRejectedValue(err);
    const onError = jest.fn();
    const { result } = renderHook(() => useResumeSectionMutation<string>());

    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.save({ mutator, onError });
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBe(err);
    expect(result.current.error).toBe(err);
    expect(onError).toHaveBeenCalledWith(err);
    expect(result.current.isSaving).toBe(false);
  });

  it("non-Error throw 시 Error 객체로 래핑", async () => {
    const mutator = jest.fn().mockRejectedValue("string error");
    const onError = jest.fn();
    const { result } = renderHook(() => useResumeSectionMutation<string>());

    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.save({ mutator, onError });
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("string error");
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("string error");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("save 시작 시 이전 error clear", async () => {
    const failingMutator = jest.fn().mockRejectedValue(new Error("실패1"));
    const successMutator = jest.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useResumeSectionMutation<string>());

    await act(async () => {
      try {
        await result.current.save({ mutator: failingMutator });
      } catch {
        void 0;
      }
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => { await result.current.save({ mutator: successMutator }); });
    expect(result.current.error).toBeNull();
  });
});
