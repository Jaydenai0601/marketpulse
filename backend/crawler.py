#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
财经新闻爬虫模块
支持：新浪财经首页、新浪财经滚动、东方财富
"""

import requests
import re
import urllib3
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin

# macOS 系统 Python 的 LibreSSL 与部分网站 TLS 不兼容，关闭 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


def safe_get(url, **kwargs):
    """带重试和 SSL 兼容的 GET 请求"""
    for attempt in range(2):
        try:
            resp = requests.get(
                url,
                headers=HEADERS,
                timeout=15,
                verify=False,
                allow_redirects=True,
                **kwargs
            )
            resp.encoding = resp.apparent_encoding or "utf-8"
            return resp
        except Exception as e:
            print(f"  [请求重试 {attempt+1}/2] {url}: {e}")
    return None


def crawl_sina_homepage():
    """抓取新浪财经首页头条"""
    url = "https://finance.sina.com.cn/"
    resp = safe_get(url)
    if not resp:
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    news_list = []

    # 首页所有符合日期格式的新闻链接
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        href = a["href"]
        # 过滤：长度适中、包含日期、排除 App/视频/广告
        if (
            text
            and 12 < len(text) < 120
            and re.search(r"20\d{2}-\d{2}-\d{2}", href)
            and "detail" not in href
            and "video" not in href
            and "app" not in href.lower()
            and "下载" not in text
        ):
            full_url = urljoin(url, href)
            news_list.append({
                "source": "新浪财经",
                "title": text,
                "url": full_url,
                "pub_time": "",
                "content": text,
            })

    # 去重
    seen = set()
    unique = []
    for n in news_list:
        key = n["title"][:30]
        if key not in seen:
            seen.add(key)
            unique.append(n)
    return unique[:25]


def crawl_sina_roll(cid=56589):
    """抓取新浪财经滚动频道"""
    url = f"https://finance.sina.com.cn/roll/c/{cid}.shtml"
    resp = safe_get(url)
    if not resp:
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    news_list = []

    items = soup.select("#d_list li")
    for item in items[:20]:
        a = item.select_one("a")
        time_tag = item.select_one(".c_time")
        if not a:
            continue
        title = a.get_text(strip=True)
        link = a.get("href", "")
        if not title or len(title) < 10 or "博客" in title:
            continue
        news_list.append({
            "source": "新浪财经",
            "title": title,
            "url": urljoin(url, link),
            "pub_time": time_tag.get_text(strip=True) if time_tag else "",
            "content": title,
        })
    return news_list


def crawl_eastmoney():
    """抓取东方财富（尝试多个页面）"""
    urls = [
        "https://finance.eastmoney.com/a/cywjh.html",
        "https://finance.eastmoney.com/yaowen.html",
    ]
    all_news = []
    for url in urls:
        resp = safe_get(url)
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, "lxml")
        # 新版页面用 JS 加载，这里尝试多种选择器
        selectors = ["#newsListContent li", ".news-list li", ".item"]
        for sel in selectors:
            items = soup.select(sel)
            if items:
                for item in items[:15]:
                    a = item.select_one("a")
                    time_tag = item.select_one("span.time") or item.select_one(".time")
                    if not a:
                        continue
                    title = a.get_text(strip=True)
                    link = a.get("href", "")
                    if not title or len(title) < 10:
                        continue
                    all_news.append({
                        "source": "东方财富",
                        "title": title,
                        "url": urljoin(url, link),
                        "pub_time": time_tag.get_text(strip=True) if time_tag else "",
                        "content": title,
                    })
                break
    return all_news[:15]


def fetch_news_content(url):
    """尝试抓取新闻正文"""
    try:
        resp = safe_get(url)
        if not resp:
            return ""
        soup = BeautifulSoup(resp.text, "lxml")
        for sel in ["#artibody", ".article", "#article_content", ".article-content", "#ContentBody", ".content"]:
            tag = soup.select_one(sel)
            if tag:
                text = tag.get_text(separator="\n", strip=True)
                return text[:2000]
        return ""
    except Exception:
        return ""


def get_all_news(fetch_content=False):
    """抓取所有来源的新闻，去重"""
    print("📡 正在抓取财经新闻...")
    all_news = []
    all_news.extend(crawl_sina_homepage())
    all_news.extend(crawl_sina_roll())
    all_news.extend(crawl_eastmoney())

    # 去重（按标题前30字）
    seen = set()
    unique = []
    for n in all_news:
        key = n["title"][:30]
        if key and key not in seen:
            seen.add(key)
            unique.append(n)

    # 可选：抓取正文
    if fetch_content:
        for n in unique[:20]:
            if n["url"]:
                content = fetch_news_content(n["url"])
                if content:
                    n["content"] = content

    print(f"✅ 共抓取 {len(unique)} 条新闻")
    return unique[:25]


if __name__ == "__main__":
    news = get_all_news(fetch_content=False)
    for i, n in enumerate(news[:15]):
        print(f"{i+1}. [{n['source']}] {n['title']}")
