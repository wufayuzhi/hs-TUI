#!/usr/bin/env python3
"""NTN Dashboard - static file server + API proxy.

Serves the dashboard frontend and proxies backend API calls
with the SQL-HTTP token injected automatically.
"""
import json, mimetypes, os, sys, time
import http.server
import urllib.request
import urllib.error

STATIC_DIR = os.environ.get("STATIC_DIR", "/app")
MEM_URL = "http://10.69.68.143:8081"
SQL_URL = "http://10.69.68.186:8080"
CCB_URL = "http://10.69.68.39:9099"
HERMES_URL = "http://127.0.0.1:9119"

# Read SQL token from environment variable
token = os.environ.get("NTN_SQL_HTTP_TOKEN", "")

def do_proxy(method, base, path, body=None):
    url = base + path
    hdrs = {"User-Agent": "NTN-Dashboard/1.0"}
    if body is not None:
        hdrs["Content-Type"] = "application/json"
    if token:
        hdrs["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return 502, json.dumps({"error": str(e)}).encode()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/"):
            return self._api("GET")
        self._static()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self._api("POST")
        self.send_error(405)

    def _static(self):
        p = self.path if self.path != "/" else "/index.html"
        fp = STATIC_DIR + p
        if not os.path.isfile(fp):
            fp = STATIC_DIR + "/index.html"
        if os.path.isfile(fp):
            ct, _ = mimetypes.guess_type(fp)
            self.send_response(200)
            self.send_header("Content-Type", ct or "application/octet-stream")
            self.end_headers()
            with open(fp, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)

    def _api(self, method):
        p = self.path
        body = None
        cl = int(self.headers.get("Content-Length", 0))
        if cl > 0:
            try:
                body = json.loads(self.rfile.read(cl))
            except:
                body = None

        if p.startswith("/api/sql-proxy"):
            status, data = do_proxy(method, SQL_URL, p[14:], body)
        elif p.startswith("/api/mem"):
            status, data = do_proxy(method, MEM_URL, p[8:], body)
        elif p.startswith("/api/ccb-progress"):
            status, data = do_proxy(method, CCB_URL, p[17:], body)
        elif p.startswith("/api/hermes"):
            status, data = do_proxy(method, HERMES_URL, p[11:], body)
        else:
            self.send_error(404)
            return

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9120
    srv = http.server.HTTPServer(("0.0.0.0", port), Handler)
    print(f"NTN Dashboard: http://0.0.0.0:{port}")
    print(f"  SQL token: {'loaded' if token else 'NOT FOUND'}")
    srv.serve_forever()
