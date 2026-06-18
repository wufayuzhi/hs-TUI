#!/bin/bash
# HS TUI 一键部署 - 在宿主机上直接执行
# curl -sL http://[HOST]:[PORT]/deploy.sh | bash

set -e
echo "=== 部署 HS TUI 总控台 ==="

# 1. 检查 Docker
if ! command -v docker &>/dev/null; then
    echo "安装 Docker..."
    apt-get update -qq && apt-get install -y -qq docker.io
fi

# 2. 启动 Docker
systemctl start docker 2>/dev/null || dockerd --userland-proxy=false &>/tmp/dockerd.log &
sleep 3

# 3. 建目录
mkdir -p /root/ntn-dashboard

# 4. 下载项目文件（从 Hermes-code 容器获取）
# 先 copy 到共享目录，或者直接在这里建

# 5. 建 Dockerfile
cat > /mnt/shared/code/ntn-dashboard/Dockerfile << 'DOCKER'
FROM python:3.11-alpine
WORKDIR /app
RUN pip install --no-cache-dir requests
COPY . .
EXPOSE 9120
CMD ["python3", "server/proxy.py", "9120"]
DOCKER

# 6. 打镜像
docker build -t hs-tui /mnt/shared/code/ntn-dashboard

# 7. 跑容器
docker rm -f hs-tui 2>/dev/null || true
docker run -d --name hs-tui --restart unless-stopped --network host hs-tui

echo "=== 部署完成 ==="
echo "访问: http://$(hostname -I | awk '{print $1}'):9120"
