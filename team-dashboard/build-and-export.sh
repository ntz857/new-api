#!/usr/bin/env bash
# build-and-export.sh — 构建 team-dashboard Docker 镜像并导出为 tar.gz

set -euo pipefail

# ── 默认值 ────────────────────────────────────────────────────────────────────
VERSION="latest"
PLATFORM="linux/amd64"
OUTPUT_DIR="."
DOCKERFILE="./Dockerfile"
NO_EXPORT=false
NO_CACHE=false

# ── 帮助 ──────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
用法:
  ./build-and-export.sh [选项]

选项:
  -v, --version   版本号           (默认: $VERSION)  镜像名固定为 team-dashboard:<version>
  -p, --platform  目标平台         (默认: $PLATFORM)
  -d, --output-dir 导出目录        (默认: $OUTPUT_DIR) 文件名自动为 team-dashboard-<version>.tar.gz
  -f, --file      Dockerfile 路径 (默认: $DOCKERFILE)
  --no-export     只构建，不导出
  --no-cache      构建时不使用缓存
  -h, --help      显示帮助

示例:
  ./build-and-export.sh
  ./build-and-export.sh -v 1.2.0
  ./build-and-export.sh -v 1.2.0 -p linux/arm64 --no-cache
  ./build-and-export.sh -v 1.2.0 -d /tmp
  ./build-and-export.sh --no-export
EOF
  exit 0
}

# ── 参数解析 ──────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--version)    VERSION="$2";     shift 2 ;;
    -p|--platform)   PLATFORM="$2";    shift 2 ;;
    -d|--output-dir) OUTPUT_DIR="$2";  shift 2 ;;
    -f|--file)       DOCKERFILE="$2";  shift 2 ;;
    --no-export)     NO_EXPORT=true;   shift   ;;
    --no-cache)      NO_CACHE=true;    shift   ;;
    -h|--help)       usage ;;
    *) echo "❌ 未知参数: $1"; usage ;;
  esac
done

# ── 派生值 ────────────────────────────────────────────────────────────────────
IMAGE_TAG="team-dashboard:${VERSION}"
OUTPUT="${OUTPUT_DIR}/team-dashboard-${VERSION}.tar.gz"
GOARCH="${PLATFORM##*/}"

# ── 工具检查 ──────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ docker 未安装"; exit 1; }

# ── 构建参数 ──────────────────────────────────────────────────────────────────
CACHE_ARGS=()
$NO_CACHE && CACHE_ARGS=(--no-cache)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  team-dashboard 构建脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  镜像标签  : $IMAGE_TAG"
echo "  目标平台  : $PLATFORM (GOARCH=$GOARCH)"
echo "  Dockerfile: $DOCKERFILE"
$NO_EXPORT || echo "  导出路径  : $OUTPUT"
$NO_CACHE  && echo "  缓存      : 已禁用"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 构建 ──────────────────────────────────────────────────────────────────────
echo ""
echo "▶ 构建镜像..."

docker build \
  "${CACHE_ARGS[@]}" \
  --platform "$PLATFORM" \
  --build-arg GOARCH="$GOARCH" \
  -t "$IMAGE_TAG" \
  -f "$DOCKERFILE" \
  .

echo "✅ 构建完成: $IMAGE_TAG"

# ── 导出 ──────────────────────────────────────────────────────────────────────
if ! $NO_EXPORT; then
  echo ""
  echo "▶ 导出镜像到 $OUTPUT ..."
  mkdir -p "$OUTPUT_DIR"
  docker save "$IMAGE_TAG" | gzip > "$OUTPUT"
  SIZE=$(du -sh "$OUTPUT" | cut -f1)
  echo "✅ 导出完成: $OUTPUT ($SIZE)"
  echo ""
  echo "部署到服务器:"
  echo "  scp $OUTPUT user@server:/path/to/"
  echo "  ssh user@server 'docker load < /path/to/$(basename "$OUTPUT")'"
fi

