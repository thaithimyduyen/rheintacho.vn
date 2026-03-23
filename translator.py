import json
import time
from openai import OpenAI

# ===== CONFIG =====
INPUT_FILE = "assets/data/assessories.json"
OUTPUT_FILE = "assets/data/assessories_output.json"

client = OpenAI()

# ===== CACHE =====
cache = {}

# ===== TECH MAP =====
TECH_MAP = {
    "Number of LEDs": "Số lượng LED",
    "Frequency range": "Dải tần số",
    "Light intensity max.": "Cường độ ánh sáng tối đa",
    "Flash duration": "Thời gian phát xung",
    "Power supply": "Nguồn cấp",
    "Dimensions": "Kích thước",
    "Frequency": "Tần số",
    "Phase shift": "Độ lệch pha"
}

# ===== TRANSLATE =====
def translate_text(text):
    time.sleep(2)
    if not text or text.strip() == "":
        return ""

    if text in cache:
        return cache[text]

    try:
        res = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Translate to Vietnamese. Keep HTML tags unchanged. Use technical/industrial tone."
                },
                {
                    "role": "user",
                    "content": text
                }
            ]
        )

        result = res.choices[0].message.content.strip()
        cache[text] = result
        return result

    except Exception as e:
        print("❌ Translate error:", e)
        return text


# ===== CONVERT =====
def convert_product(product):
    fields = [
        "name",
        "applications",
        "features",
        "description",
        "scope_of_delivery",
        "category",
        "main_category"
    ]

    new_product = {}

    for key, value in product.items():

        # ===== MULTI LANGUAGE =====
        if key in fields:
            if isinstance(value, str):
                new_product[key] = {
                    "en": value,
                    "vi": translate_text(value)
                }
            elif isinstance(value, list):
                new_product[key] = value
            else:
                new_product[key] = value

        # ===== TECHNICAL DATA =====
        elif key == "technical_data" and isinstance(value, dict):

            en_data = value
            vi_data = {}

            for k, v in en_data.items():

                # 🔥 KEY TRANSLATION
                if k in TECH_MAP:
                    vi_key = TECH_MAP[k]
                else:
                    vi_key = translate_text(k)
                    TECH_MAP[k] = vi_key  # cache lại

                # 🔥 VALUE TRANSLATION (optional)
                vi_value = translate_text(v) if isinstance(v, str) else v

                vi_data[vi_key] = vi_value

            new_product[key] = {
                "en": en_data,
                "vi": vi_data
            }

        # ===== KEEP =====
        else:
            new_product[key] = value

    return new_product


# ===== MAIN =====
def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    result = {}

    for product_key, product in data.items():
        print(f"🔄 Processing: {product_key}")
        result[product_key] = convert_product(product)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print("✅ DONE → output.json")


if __name__ == "__main__":
    main()