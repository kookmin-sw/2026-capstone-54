/** 이력서 타입(파일/텍스트) 아이콘. */
import { FileText, PencilLine } from "lucide-react";
import type { ResumeType } from "../api/types";

interface ResumeTypeIconProps {
  type: ResumeType;
  size?: number;
  className?: string;
}

export function ResumeTypeIcon({ type, size = 16, className = "" }: ResumeTypeIconProps) {
  if (type === "file") return <FileText size={size} className={className} />;
  return <PencilLine size={size} className={className} />;
}
