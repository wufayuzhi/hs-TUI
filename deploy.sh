#!/bin/bash
# HS TUI 一键部署 - 在宿主机上直接执行
# curl -sL http://[HOST]:[PORT]/deploy.sh | bash
# 需要环境变量 NTN_SQL_HTTP_TOKEN

set -e
echo "=== 部署 HS TUI 总控台 ==="

# 1. 检查 Docker
if ! command -v docker &>/dev/null; then
    echo "安装 Docker..."
    apt-get update -qq && apt-get install -y -qq docker.io
fi

# 2. 确保 Docker 运行
systemctl start docker 2>/dev/null || dockerd --userland-proxy=false &>/tmp/dockerd.log &
sleep 3

# 3. 获取 SQL Token
if [ -z "$NTN_SQL_HTTP_TOKEN" ]; then
    # 从当前进程环境取（在 LXD 容器内执行时）
    for pid in /proc/*/environ 2>/dev/null; do
        val=$(strings "$pid" 2>/dev/null | grep "^NTN_SQL_HTTP_TOKEN=" | head -1)
        [ -n "$val" ] && { NTN_SQL_HTTP_TOKEN="${val#*=}"; break; }
    done
fi
if [ -z "$NTN_SQL_HTTP_TOKEN" ]; then
    echo "错误: 未找到 NTN_SQL_HTTP_TOKEN"
    echo "请运行: export NTN_SQL_HTTP_TOKEN=\"你的token\""
    exit 1
fi
echo "Token 已获取 ✅"

# 4. 建目录
PROJ_DIR="/home/ops/hs-tui"
mkdir -p "$PROJ_DIR"

# 5. 克隆或拉取
if [ -d "$PROJ_DIR/.git" ]; then
    cd "$PROJ_DIR" && git pull
else
    git clone https://github.com/wufayuzhi/hs-TUI.git "$PROJ_DIR"
fi

# 6. 建 Dockerfile（已包含在项目中，此处作为 fallback）
cd "$PROJ_DIR"
cat > Dockerfile << 'DOCKER'
FROM python:3.11-alpine
WORKDIR /app
RUN pip install --no-cache-dir requests
COPY . .
EXPOSE 9120
CMD ["python3", "server/proxy.py", "9120"]
DOCKER

# 7. 打镜像
docker build -t hs-tui .

# 8. 跑容器（传 Token）
docker rm -f hs-tui 2>/dev/null || true
docker run -d --name hs-tui \
  --restart unless-stopped \
  --network host \
  -e NTN_SQL_HTTP_TOKEN="$NTN_SQL_HTTP_TOKEN" \
  hs-tui

echo "=== 部署完成 ==="
IP=$(hostname -I | awk '{print $1}')
echo "访问: http://${IP}:9120"
echo "查看日志: docker logs hs-tui -f"
