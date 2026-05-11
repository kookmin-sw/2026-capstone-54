#!/usr/bin/env bash
#
# Auto-label nodes by allocatable memory.
#   - allocatable > 4Gi  -> nodepool=heavy   (m5.large)
#   - allocatable <= 4Gi -> no label         (t3.small)
#
# Usage:
#   ./setup-node-labels.sh           # dry-run
#   ./setup-node-labels.sh --apply   # apply labels

set -euo pipefail

APPLY=false
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

THRESHOLD_KIB=4000000

echo "── current nodes ──"
kubectl get nodes -o wide --label-columns=nodepool
echo ""

echo "── recommended labels ──"
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.allocatable.memory}{"\n"}{end}' | while IFS=$'\t' read -r name memory; do
  kib="${memory%Ki}"
  if [[ "$kib" -gt "$THRESHOLD_KIB" ]]; then
    if [[ "$APPLY" == true ]]; then
      kubectl label node "$name" nodepool=heavy --overwrite
      echo "LABELED: $name nodepool=heavy (allocatable=$memory)"
    else
      echo "DRY-RUN: kubectl label node $name nodepool=heavy --overwrite (allocatable=$memory)"
    fi
  else
    echo "SKIP:    $name (allocatable=$memory, < ${THRESHOLD_KIB}Ki)"
  fi
done

if [[ "$APPLY" == false ]]; then
  echo ""
  echo "to apply: $0 --apply"
fi
