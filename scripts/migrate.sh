#!/bin/bash
# ============================================
# SIMKO — Safe Migration Script
# Usage: ./scripts/migrate.sh [up|status|down <count>]
#
#   up       — Apply pending migrations (safe, no data loss)
#   status   — Show migration status
#   down <n> — Roll back last <n> migrations (DANGEROUS — data loss)
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

case "${1:-up}" in
  up)
    echo "Applying pending migrations..."
    npx prisma migrate deploy
    echo "Done."
    ;;
  status)
    echo "Migration status:"
    npx prisma migrate status
    ;;
  down)
    COUNT="${2:-1}"
    echo "WARNING: Rolling back $COUNT migration(s) will LOSE DATA."
    echo "Press Ctrl+C within 5 seconds to cancel..."
    sleep 5
    for ((i=0; i<COUNT; i++)); do
      npx prisma migrate diff --to-migration= --script > /tmp/rollback_$(date +%s).sql
      npx prisma migrate resolve --rolled-back
    done
    echo "Rolled back $COUNT migration(s). Manual SQL in /tmp/rollback_*.sql"
    ;;
  *)
    echo "Usage: $0 [up|status|down <count>]"
    exit 1
    ;;
esac
