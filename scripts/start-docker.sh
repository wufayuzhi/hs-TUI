#!/bin/bash
set -e
# 启动 dockerd 作为容器内服务
echo "Starting dockerd..."
dockerd --userland-proxy=false > /tmp/dockerd.log 2>&1 &
sleep 4
if [ -S /var/run/docker.sock ]; then
    echo "Docker is ready"
    docker ps
else
    echo "Waiting for docker..."
    sleep 4
    if [ -S /var/run/docker.sock ]; then
        echo "Docker is ready"
    else
        cat /tmp/dockerd.log | tail -5
        exit 1
    fi
fi
