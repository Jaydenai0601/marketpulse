#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 backend/run.py 生成的 data/daily_data.json 同步到 Next.js 数据库。

用法：
    export NEXTJS_URL="http://localhost:3000"
    export CRON_SECRET="your-cron-secret"
    python backend/sync_to_api.py
"""
import os
import sys
import json
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(ROOT, "data", "daily_data.json")

NEXTJS_URL = os.environ.get("NEXTJS_URL", "http://localhost:3000").rstrip("/")
CRON_SECRET = os.environ.get("CRON_SECRET", "")
IMPORT_URL = f"{NEXTJS_URL}/api/import"


def main():
    if not CRON_SECRET:
        print("❌ 请设置 CRON_SECRET 环境变量")
        sys.exit(1)

    if not os.path.exists(DATA_FILE):
        print(f"❌ 找不到 {DATA_FILE}，请先运行 backend/run.py")
        sys.exit(1)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        payload = json.load(f)

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        IMPORT_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {CRON_SECRET}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            print(f"✅ 已同步到 Next.js: {result}")
    except urllib.error.HTTPError as e:
        print(f"❌ 同步失败: {e.code} {e.reason}")
        print(e.read().decode("utf-8"))
        sys.exit(1)


if __name__ == "__main__":
    main()
