#!/bin/bash
# Extract the SQL token from running process and start the dashboard proxy

TOKEN=*** /proc/28021/environ 2>/dev/null | tr '\0' '\n' | grep "^NTN_SQL_HTTP_TOKEN=*** | cut -d= -f2-)

if [ -z "$TOKEN" ]; then
    echo "ERROR: Could not extract NTN_SQL_HTTP_TOKEN"
    exit 1
fi

echo "Token found (${#TOKEN} chars)"

# Kill any existing process on port 9120
fuser -k 9120/tcp 2>/dev/null
sleep 1

# Start the proxy with the token
cd /mnt/shared/code/ntn-dashboard
NTN_SQL_HTTP_TOKEN="$TOKEN" nohup python3 server/proxy.py 9120 > /tmp/dashboard.log 2>&1 &
sleep 2

# Verify
curl -s -o /dev/null -w "Dashboard: HTTP %{http_code}\n" http://localhost:9120/
curl -s -o /dev/null -w "SQL-Proxy: HTTP %{http_code}\n" http://localhost:9120/api/sql-proxy/health
curl -s -o /dev/null -w "MEM-Proxy: HTTP %{http_code}\n" http://localhost:9120/api/mem/health
curl -s -o /dev/null -w "CCB-Proxy: HTTP %{http_code}\n" http://localhost:9120/api/ccb-progress/version
echo "Done"
