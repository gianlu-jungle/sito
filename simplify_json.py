import json

# Load the original data
with open('tools_api_icons.json', 'r', encoding='utf-8') as file:
    tools = json.load(file)

# Count categories
category_counts = {}
for tool in tools:
    for cat in tool['categorie']:
        category_counts[cat] = category_counts.get(cat, 0) + 1

# Determine main categories
main_categories = {cat for cat, count in category_counts.items() if count >= 5}

simplified_tools = []
seen = set()

for tool in tools:
    name = tool['nome']
    if name in seen:
        continue
    seen.add(name)

    # Simplify categories
    simplified_cats = [cat for cat in tool['categorie'] if cat in main_categories]
    if not simplified_cats:
        simplified_cats = ['Altri strumenti']

    # Update icon URL from futurepedia.io
    domain = tool['url'].split('/')[2]
    icon_url = f"https://img.logo.dev/{domain}?token=pk_L_yFOS-_SwS9CEjcWCFzGw&size=200&format=png"

    simplified_tool = {
        "nome": name,
        "url": tool['url'],
        "descrizione": tool['descrizione'],
        "immagine": icon_url,
        "categorie": simplified_cats
    }

    simplified_tools.append(simplified_tool)

# Save simplified JSON
with open('simplified_tools.json', 'w', encoding='utf-8') as file:
    json.dump(simplified_tools, file, ensure_ascii=False, indent=2)