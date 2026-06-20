#!/usr/bin/env python3
"""
CCB 进度服务 — 在 claude-code-best 容器内运行
提供实时进度 API + 配置 API 供总控台调用
"""
import json
import os
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

PROGRESS_FILE = "/tmp/ccb_progress.json"
CONFIG_FILE = "/opt/multi-agent/data/ccb_config.json"
CCB_BIN = "/usr/bin/ccb"

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _json(self, code, data):
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def do_GET(self):
        if self.path == "/status":
            data = {"task": None, "step": None, "status": "idle", "updated_at": None}
            if os.path.exists(PROGRESS_FILE):
                try:
                    with open(PROGRESS_FILE) as f:
                        data.update(json.load(f))
                except:
                    pass
            self._json(200, data)

        elif self.path == "/version":
            try:
                r = subprocess.run([CCB_BIN, "--version"], capture_output=True, text=True, timeout=5)
                ver = r.stdout.strip() or r.stderr.strip() or "unknown"
            except:
                ver = "check failed"
            self._json(200, {"version": ver})

        elif self.path == "/health":
            self._json(200, {"ok": True})

        elif self.path == "/api/config":
            cfg = {"provider": "", "model": "", "api_key": ""}
            if os.path.exists(CONFIG_FILE):
                try:
                    with open(CONFIG_FILE) as f:
                        cfg.update(json.load(f))
                except:
                    pass
            self._json(200, cfg)

        elif self.path == "/api/multi-agent-mode":
            enabled = False
            if os.path.exists(CONFIG_FILE):
                try:
                    with open(CONFIG_FILE) as f:
                        enabled = json.load(f).get("multi_agent", False)
                except:
                    pass
            self._json(200, {"enabled": enabled})

        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"

        if self.path == "/progress":
            try:
                data = json.loads(body)
                with open(PROGRESS_FILE, "w") as f:
                    json.dump(data, f, ensure_ascii=False)
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(400, {"error": str(e)})

        elif self.path == "/api/config":
            try:
                new = json.loads(body)
                existing = {}
                if os.path.exists(CONFIG_FILE):
                    with open(CONFIG_FILE) as f:
                        existing = json.load(f)
                existing.update(new)
                os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
                with open(CONFIG_FILE, "w") as f:
                    json.dump(existing, f, ensure_ascii=False)
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(400, {"error": str(e)})

        else:
            self._json(404, {"error": "not found"})

    def do_PUT(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"

        if self.path == "/api/multi-agent-mode":
            try:
                data = json.loads(body)
                existing = {}
                if os.path.exists(CONFIG_FILE):
                    with open(CONFIG_FILE) as f:
                        existing = json.load(f)
                existing["multi_agent"] = data.get("enabled", False)
                os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
                with open(CONFIG_FILE, "w") as f:
                    json.dump(existing, f, ensure_ascii=False)
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(400, {"error": str(e)})
        else:
            self._json(404, {"error": "not found"})

    def log_message(self, fmt, *args):
        pass  # 安静运行

if __name__ == "__main__":
    port = 9099
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"CCB progress service on :{port} (config={CONFIG_FILE})")
    server.serve_forever()
