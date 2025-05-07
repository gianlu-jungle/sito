import os
import json
import requests
from io import BytesIO
from PIL import Image
from urllib.parse import urlparse

# ————————————————
# CONFIGURAZIONE
# ————————————————
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
SRC_JSON    = os.path.join(BASE_DIR, 'tools_api_icons.json')
DST_JSON    = os.path.join(BASE_DIR, 'tools.json')
IMAGES_DIR  = os.path.join(BASE_DIR, 'assets', 'images', 'tools')
URL_PREFIX  = './assets/images/tools'  # prefisso URL usato dal tuo sito

os.makedirs(IMAGES_DIR, exist_ok=True)

# ————————————————
# CARICA IL JSON SORGENTE
# ————————————————
with open(SRC_JSON, encoding='utf-8') as f:
    tools = json.load(f)

# ————————————————
# SCARICA E CONVERTI IN PNG
# ————————————————
for tool in tools:
    img_url = tool.get('immagine')
    if not img_url:
        continue

    # Genera slug e nome file .png
    slug     = tool['nome'].strip().lower().replace(' ', '_').replace('.', '')
    filename = f"{slug}.png"
    local_path = os.path.join(IMAGES_DIR, filename)

    # Scarica l’immagine se non esiste
    if not os.path.exists(local_path):
        resp = requests.get(img_url, timeout=10)
        resp.raise_for_status()

        # Apri l’immagine in memoria e converti in PNG
        img = Image.open(BytesIO(resp.content)).convert('RGBA')
        img.save(local_path, format='PNG')
        print(f"Converted and saved: {img_url} → {local_path}")

    # Aggiorna il JSON col percorso .png locale
    tool['immagine'] = f"{URL_PREFIX}/{filename}"

# ————————————————
# SALVA IL NUOVO tools.json
# ————————————————
with open(DST_JSON, 'w', encoding='utf-8') as f:
    json.dump(tools, f, ensure_ascii=False, indent=2)

print(f"\n✅ Generated {DST_JSON} with all icons as PNG.")

