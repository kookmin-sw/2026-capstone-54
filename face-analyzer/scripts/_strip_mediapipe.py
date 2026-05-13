"""Lambda Layer에서 불필요한 파일을 삭제하여 250MB 제한을 준수한다.

Usage: python _strip_mediapipe.py <site_packages_dir>

mediapipe 내부 모듈은 건드리지 않는다 (런타임 에러 위험).
안전하게 삭제 가능한 것만 삭제한다:
  - __pycache__
  - .dist-info
  - tests/test 디렉토리
  - numpy/f2py (Fortran 바인딩)
  - cv2/data (Haar cascade XML)
"""

import os
import shutil
import sys


def get_dir_size_mb(path):
  total = 0
  for root, _dirs, files in os.walk(path):
    for f in files:
      fp = os.path.join(root, f)
      if os.path.isfile(fp):
        total += os.path.getsize(fp)
  return total / (1024 * 1024)


def remove_if_exists(path):
  if os.path.isdir(path):
    shutil.rmtree(path)
  elif os.path.isfile(path):
    os.remove(path)


def strip_packages(site_packages):
  """안전하게 삭제 가능한 파일만 삭제한다."""
  before = get_dir_size_mb(site_packages)

  # 1. numpy 불필요 파일
  numpy_dir = os.path.join(site_packages, "numpy")
  if os.path.isdir(numpy_dir):
    remove_if_exists(os.path.join(numpy_dir, "f2py"))
    for root, dirs, _files in os.walk(numpy_dir):
      for d in list(dirs):
        if d in ("tests", "test", "testing"):
          shutil.rmtree(os.path.join(root, d))
          dirs.remove(d)

  # 2. cv2/data (Haar cascade XML — Face Landmarker에서 미사용)
  remove_if_exists(os.path.join(site_packages, "cv2", "data"))

  # 3. 전역: __pycache__ 삭제
  for root, dirs, _files in os.walk(site_packages):
    for d in list(dirs):
      if d == "__pycache__":
        shutil.rmtree(os.path.join(root, d))
        dirs.remove(d)

  # 4. 전역: .dist-info 삭제
  for item in os.listdir(site_packages):
    if item.endswith(".dist-info"):
      remove_if_exists(os.path.join(site_packages, item))

  # 5. 전역: tests/test 디렉토리 삭제
  for root, dirs, _files in os.walk(site_packages):
    for d in list(dirs):
      if d in ("tests", "test"):
        shutil.rmtree(os.path.join(root, d))
        dirs.remove(d)

  after = get_dir_size_mb(site_packages)
  print(f"Stripped: {before:.1f} MB -> {after:.1f} MB (saved {before - after:.1f} MB)")


if __name__ == "__main__":
  if len(sys.argv) != 2:
    print(f"Usage: {sys.argv[0]} <site_packages_dir>", file=sys.stderr)
    sys.exit(1)
  strip_packages(os.path.abspath(sys.argv[1]))
