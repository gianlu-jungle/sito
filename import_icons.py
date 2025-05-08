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
URL_PREFIX  = './assets/images/tools'  # Percorso da usare nel sito

os.makedirs(IMAGES_DIR, exist_ok=True)

# ————————————————
# CARICA IL JSON ORIGINALE
# ————————————————
with open(SRC_JSON, encoding='utf-8') as f:
    tools = json.load(f)

# ————————————————
# PROCESSA OGNI TOOL
# ————————————————
for tool in tools:
    # Scarica e salva immagine come .png
    img_url = tool.get('immagine')
    if img_url:
        slug = tool['nome'].strip().lower().replace(' ', '_').replace('.', '')
        filename = f"{slug}.png"
        local_path = os.path.join(IMAGES_DIR, filename)

        if not os.path.exists(local_path):
            try:
                resp = requests.get(img_url, timeout=10)
                resp.raise_for_status()
                img = Image.open(BytesIO(resp.content)).convert('RGBA')
                img.save(local_path, format='PNG')
                print(f"✅ Salvata immagine: {filename}")
            except Exception as e:
                print(f"❌ Errore immagine {img_url}: {e}")

        tool['immagine'] = f"{URL_PREFIX}/{filename}"

    # ————————————————
    # Normalizza 'categorie' come array
    # ————————————————
    categorie = []

    # Se esiste già 'categorie', usa quella
    if 'categorie' in tool and isinstance(tool['categorie'], list):
        categorie = [c.strip() for c in tool['categorie'] if c.strip()]

    # Se esiste anche 'categoria', aggiungila
    if 'categoria' in tool:
        raw = tool['categoria']
        parts = raw.split(',') if ',' in raw else [raw]
        categorie += [c.strip() for c in parts if c.strip()]
        del tool['categoria']  # rimuovi sempre 'categoria'

    # Rimuovi duplicati e salva
    tool['categorie'] = sorted(set(categorie))

# ————————————————
# SALVA IL FILE RISULTATO
# ————————————————
with open(DST_JSON, 'w', encoding='utf-8') as f:
    json.dump(tools, f, ensure_ascii=False, indent=2)

print(f"\n✅ tools.json generato con icone locali e categorie normalizzate.")

