/** 다른 곳에서 인터뷰 ownership 이 인수되어 이 화면이 evict 된 사실을 안내하는 모달. */
import { useNavigate } from "react-router-dom";
import { useInterviewSessionStore } from "@/features/interview-session/model/store";

export function SessionTakeoverModal() {
  const open = useInterviewSessionStore((s) => s.takeoverModalOpen);
  const navigate = useNavigate();

  if (!open) return null;

  const onGoToResults = () => {
    navigate("/interview/results");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="takeover-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="takeover-modal-title" className="text-lg font-bold text-gray-900">
          다른 곳에서 이어서 진행 중입니다
        </h2>
        <p className="mt-3 text-sm text-gray-700">
          이 면접은 다른 탭 또는 기기에서 이어서 진행되고 있습니다. 이 화면은 더 이상 사용할 수
          없습니다. 면접 목록으로 이동하세요.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onGoToResults}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            내 면접 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
