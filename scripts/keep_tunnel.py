#!/usr/bin/env python3
import subprocess
import time
import re
import os

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
URL_FILE = os.path.join(WORKSPACE_DIR, "DEPLOYED_URL.txt")

def start_tunnel():
    cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ServerAliveInterval=30",
        "-o", "ServerAliveCountMax=5",
        "-R", "80:localhost:3000",
        "nokey@localhost.run"
    ]
    
    print("Starting persistent tunnel to localhost:3000...")
    while True:
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            for line in proc.stdout:
                line_str = line.strip()
                if line_str:
                    print(line_str)
                    m = re.search(r"https://[a-zA-Z0-9\-\.]+\.lhr\.life", line_str)
                    if m:
                        url = m.group(0)
                        print(f"Captured live public URL: {url}")
                        with open(URL_FILE, "w", encoding="utf-8") as f:
                            f.write(url + "\n")
            
            proc.wait()
            print("Tunnel closed by host. Reconnecting in 3s...")
        except Exception as e:
            print(f"Tunnel exception: {e}. Reconnecting in 5s...")
            time.sleep(5)
        time.sleep(3)

if __name__ == "__main__":
    start_tunnel()
