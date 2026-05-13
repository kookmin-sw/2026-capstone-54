"""디렉토리를 zip으로 압축하는 헬퍼 스크립트.

Usage: python _zipdir.py <source_dir> <output_zip>

source_dir 내부의 파일들을 상대 경로로 zip에 추가한다.
Git Bash ↔ Python 경로 호환 문제를 해결하기 위해 sys.argv로 경로를 받는다.
"""

import os
import sys
import zipfile


def main():
  if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <source_dir> <output_zip>", file=sys.stderr)
    sys.exit(1)

  source_dir = os.path.abspath(sys.argv[1])
  output_zip = os.path.abspath(sys.argv[2])

  os.makedirs(os.path.dirname(output_zip), exist_ok=True)

  with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _dirs, files in os.walk(source_dir):
      for f in files:
        abs_path = os.path.join(root, f)
        arc_name = os.path.relpath(abs_path, source_dir)
        zf.write(abs_path, arc_name)

  print(f"Created: {output_zip}")
  print(f"Size: {os.path.getsize(output_zip) / (1024 * 1024):.1f} MB")


if __name__ == "__main__":
  main()
