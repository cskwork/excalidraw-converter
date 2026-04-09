#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# 의존성 설치 (node_modules 없거나 package.json이 더 최신일 때)
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# 개발 모드 또는 프로덕션 모드 선택
if [ "${1:-dev}" = "prod" ]; then
  echo "Building for production..."
  npm run build
  echo "Starting production server..."
  npm run start
else
  echo "Starting development server..."
  npm run dev
fi
