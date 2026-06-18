#!/usr/bin/env python3
"""Start the NTN Dashboard proxy server."""
import os, sys, time, subprocess

# Read token from the running process
with open("/proc/28021/environ", "rb") as f:
    data = f.read()
for entry in data.split(b"\0"):
    if entry.startswith(b"NTN_SQL_HTTP_TOKEN=***        token = entry.split(b"=", 1)[1].decode()
        break

os.environ["NTN_SQL_HTTP_TOKEN"] = token
print(f"Token set ({len(token)} chars)")

# Kill old process on port 9120
subprocess.run(["fuser", "-k", "9120/tcp"], capture_output=True)
time.sleep(1)

# Start proxy
proc = subprocess.Popen(
    [sys.executable, "/mnt/shared/code/ntn-dashboard/server/proxy.py", "9120"],
    env=os.environ,
    stdout=open("/tmp/dashboard.log", "w"),
    stderr=subprocess.STDOUT,
)
time.sleep(2)

# Verify
import urllib.request
for path, name in [("/", "Dashboard"), ("/api/sql-proxy/health", "SQL-Proxy"), ("/api/mem/health", "MEM-Proxy"), ("/api/ccb-progress/version", "CCB-Proxy")]:
    try:
        r = urllib.request.urlopen(f"http://localhost:9120{path}", timeout=3)
        print(f"{name}: HTTP {r.status} ✅")
    except Exception as e:
        print(f"{name}: {e}")
