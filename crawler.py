import requests
from bs4 import BeautifulSoup
import os
import json
from urllib.parse import urljoin, urlparse

BASE_URL = "https://www.rheintacho.de"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# 👉 bạn control link ở đây
PRODUCT_URLS = []

# -----------------------------
# CREATE FOLDERS
# -----------------------------
os.makedirs("assets/images", exist_ok=True)
os.makedirs("assets/files", exist_ok=True)


def get_soup(url):
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    return BeautifulSoup(res.text, "html.parser")


# -----------------------------
# DOWNLOAD FILE
# -----------------------------
def download_file(url, folder):
    try:
        filename = os.path.basename(urlparse(url).path)

        if not filename:
            return None

        filepath = os.path.join(folder, filename)

        if not os.path.exists(filepath):
            res = requests.get(url, headers=HEADERS)
            with open(filepath, "wb") as f:
                f.write(res.content)

        return filename

    except Exception as e:
        print("Download error:", url, e)
        return None


# -----------------------------
# EXTRACT LIST
# -----------------------------
def extract_list(tag):
    if not tag:
        return []
    return [li.get_text(strip=True) for li in tag.select("li")]

def extract_description(soup):
    container = soup.select_one(".top-right .content-text")

    if not container:
        return ""

    return "".join(str(child) for child in container.contents)

def extract_scope_of_delivery(soup):
    container = soup.select_one(".content-text")

    if not container:
        return ""

    return "".join(str(child) for child in container.contents)


# -----------------------------
# TECHNICAL DATA
# -----------------------------
def extract_technical_data(soup):
    data = {}

    for row in soup.select("table tr"):
        cols = row.find_all(["td", "th"])
        if len(cols) >= 2:
            key = cols[0].get_text(" ", strip=True)
            value = cols[1].get_text(" ", strip=True)
            data[key] = value

    return data


# -----------------------------
# TYPES
# -----------------------------
def extract_types(soup):
    text = soup.get_text("\n")

    import re
    match = re.search(r"Types\s*:\s*(.+)", text)

    if match:
        return match.group(1).strip()

    return None


# -----------------------------
# DOCS (PDF)
# -----------------------------
def extract_docs(soup):
    docs = []

    for a in soup.select("a[href$='.pdf']"):
        url = urljoin(BASE_URL, a["href"])
        filename = download_file(url, "assets/files")

        if filename:
            docs.append(filename)

    return list(set(docs))


# -----------------------------
# IMAGES
# -----------------------------
def extract_images(soup):
    images = []

    for img in soup.select("img"):
        src = img.get("src")

        if not src:
            continue

        if any(ext in src.lower() for ext in [".jpg", ".png", ".jpeg"]):
            url = urljoin(BASE_URL, src)
            filename = download_file(url, "assets/images")
            if str.startswith(filename,"logo"):
                continue

            if filename:
                images.append(filename)

    return list(set(images))


# -----------------------------
# KEY + CATEGORY
# -----------------------------
def extract_key_category(url):
    parts = url.strip("/").split("/")
    key = parts[-1]
    category = str(parts[-2]).replace("-", " ").capitalize()
    main_category = str(parts[-3]).replace("-", " ").capitalize()
    return key, category, main_category

def extract_sections(soup):
    applications = []
    features = []

    for p in soup.select(".content-text p"):
        title = p.get_text(strip=True).lower()

        ul = p.find_next_sibling("ul")
        if not ul:
            continue

        items = [li.get_text(strip=True) for li in ul.select("li")]

        if "application" in title:
            applications = items

        elif "feature" in title:
            features = items

    return applications, features


# -----------------------------
# PARSE PRODUCT
# -----------------------------
def parse_product(url):
    soup = get_soup(url)

    key, category, main_category = extract_key_category(url)

    name = soup.find("h1").get_text(strip=True)

    applications, features = extract_sections(soup)
    technical_data = extract_technical_data(soup)
    description = extract_description(soup)
    scope_of_delivery = extract_scope_of_delivery(soup)
    if scope_of_delivery == description:
        scope_of_delivery = ""

    types = extract_types(soup)
    if types:
        technical_data["Types"] = types

    docs = extract_docs(soup)
    images = extract_images(soup)

    return {
        key: {
            "name": name,
            "applications": applications,
            "features": features,
            "description": description,
            "scope_of_delivery": scope_of_delivery,
            "technical_data": technical_data,
            "images": images,
            "docs": docs,
            "category": category,
            "main_category": main_category
        }
    }


# -----------------------------
# MAIN
# -----------------------------
def main():
    data = {}

    for url in PRODUCT_URLS:
        print("Crawling:", url)
        item = parse_product(url)
        data.update(item)

    with open("rheintacho.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Done!")


if __name__ == "__main__":
    main()