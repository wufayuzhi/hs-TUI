#!/usr/bin/env python3
"""
CCB 进度服务 — 在 claude-code-best 容器内运行
提供实时进度 API 供总控台调用
"""
import json
import os
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

PROGRESS_FILE = "/tmp/ccb_progress.json"
CCB_BIN = "/usr/bin/ccb"

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()

        if self.path == "/status":
            # 当前任务进度
            data = {"task": None, "step": None, "status": "idle", "updated_at": None}
            if os.path.exists(PROGRESS_FILE):
                try:
                    with open(PROGRESS_FILE) as f:
                        data.update(json.load(f))
                except:
                    pass
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

        elif self.path == "/version":
            # CCB 版本信息
            try:
                r = subprocess.run([CCB_BIN, "--version"], capture_output=True, text=True, timeout=5)
                ver = r.stdout.strip() or r.stderr.strip() or "unknown"
            except:
                ver = "check failed"
            self.wfile.write(json.dumps({"version": ver}).encode())

        elif self.path == "/health":
            self.wfile.write(json.dumps({"ok": True}).encode())
        else:
            self.wfile.write(json.dumps({"error": "not found"}).encode())

    def do_POST(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()

        if self.path == "/progress":
            # CCB 执行任务时调这个接口写进度
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                with open(PROGRESS_FILE, "w") as f:
                    json.dump(data, f, ensure_ascii=False)
                self.wfile.write(json.dumps({"ok": True}).encode())
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, fmt, *args):
        pass  # 安静运行

if __name__ == "__main__":
    port = 9099
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"CCB progress service on :{port}")
    server.serve_forever()
