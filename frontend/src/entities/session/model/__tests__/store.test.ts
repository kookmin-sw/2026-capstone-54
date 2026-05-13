import { useSessionStore } from "../store";

beforeEach(() => {
  useSessionStore.getState().logout();
  localStorage.clear();
});

describe("useSessionStore", () => {
  it("초기 상태: isAuthenticated=false, user=null", () => {
    const s = useSessionStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.user).toBeNull();
  });

  it("setUser(user) → isAuthenticated=true 자동 설정", () => {
    const user = { id: "u-1", name: "홍길동", email: "h@x.com", initial: "홍" };
    useSessionStore.getState().setUser(user);

    const s = useSessionStore.getState();
    expect(s.user).toEqual(user);
    expect(s.isAuthenticated).toBe(true);
  });

  it("setUser(null) → isAuthenticated=false (truthy 변환)", () => {
    useSessionStore.getState().setUser({ id: "x", name: "x", email: "x", initial: "x" });
    useSessionStore.getState().setUser(null);

    const s = useSessionStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it("setAuthenticated(true) → user 변경 없이 인증만 토글", () => {
    useSessionStore.getState().setAuthenticated(true);
    const s = useSessionStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user).toBeNull();
  });

  it("logout → isAuthenticated=false + user=null", () => {
    useSessionStore.getState().setUser({ id: "x", name: "x", email: "x", initial: "x" });
    useSessionStore.getState().logout();

    const s = useSessionStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.user).toBeNull();
  });

  it("zustand persist: 상태 변경 후 localStorage('session-storage') 에 기록됨", () => {
    useSessionStore.getState().setUser({ id: "u-1", name: "홍", email: "h@x.com", initial: "홍" });

    const raw = localStorage.getItem("session-storage");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.user.id).toBe("u-1");
    expect(parsed.state.isAuthenticated).toBe(true);
  });
});
