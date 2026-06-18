FROM python:3.11-alpine

WORKDIR /app

# 不需要额外 pip 包了，只用标准库
COPY . .

EXPOSE 9120

CMD ["python3", "server/proxy.py", "9120"]
