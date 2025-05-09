#!/usr/bin/env python3
# update_topai.py
# Script to scrape TopAI.tools Top 100 AI Tools page and save data to JSON

"""
Requirements:
  pip install requests beautifulsoup4 cloudscraper
"""
import sys
import logging
import json
from bs4 import BeautifulSoup

import requests
from requests.exceptions import HTTPError
# cloudscraper helps bypass basic protections
import cloudscraper

# Configuration
PAGE_URL = "https://topai.tools/top-100-ai-tools"
OUTPUT_FILE = "top100_tools.json"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
RATE_LIMIT = 1  # seconds between requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')


def fetch_top100():
    """
    Fetch the Top 100 AI tools page, using cloudscraper if needed, and return a list of tool data dicts.
    Each dict contains: name, url, description.
    """
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9", "Accept": "text/html,application/xhtml+xml"}

    try:
        resp = requests.get(PAGE_URL, headers=headers)
        resp.raise_for_status()
    except HTTPError as e:
        if e.response is not None and e.response.status_code == 403:
            logging.warning(f"Received 403 from {PAGE_URL}, retrying with cloudscraper...")
            scraper = cloudscraper.create_scraper()  # bypass Cloudflare
            resp = scraper.get(PAGE_URL, headers=headers)
            resp.raise_for_status()
        else:
            logging.error(f"Request failed: {e}")
            raise

    soup = BeautifulSoup(resp.text, 'html.parser')

    tools = []
    # The top 100 are listed in an ordered list <ol> with each <li>
    ol = soup.find('ol')
    if not ol:
        logging.error("No <ol> element found on page; structure may have changed.")
        return tools

    for li in ol.find_all('li'):
        a = li.find('a', href=True)
        if not a:
            continue
        name = a.get_text(strip=True)
        href = a['href']
        url = href if href.startswith('http') else f"https://topai.tools{href}"
        # Build description from text minus tool name
        text = li.get_text(separator=' ', strip=True)
        description = text.replace(name, '', 1).strip(' -–—:')
        tools.append({ 'name': name, 'url': url, 'description': description })

    logging.info(f"Parsed {len(tools)} tools from Top 100 list.")
    return tools


def main():
    try:
        data = fetch_top100()
    except Exception:
        logging.error("Failed to fetch Top 100 tools; exiting.")
        sys.exit(1)

    if not data:
        logging.error("No tools data fetched; exiting.")
        sys.exit(1)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logging.info(f"Saved data for {len(data)} tools to {OUTPUT_FILE}")


if __name__ == '__main__':
    main()

