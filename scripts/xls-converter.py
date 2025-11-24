import pandas as pd
import re
import os
import json
import requests
from io import BytesIO


# Google Sheets published URL (published xlsx)
SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRddMHNdnFESEpNUoT0f5AWBXL4IswirigL1Qdd8vvgkVcabrjvW4sZ4DwIH4I-Q5e_zw-LmOxlrk-Y/pub?output=xlsx'

# Download spreadsheet
print("Downloading spreadsheet...")
response = requests.get(SHEET_URL)
df = pd.read_excel(BytesIO(response.content))
df.columns = df.columns.str.lower()

columns_to_keep = ['id', 'name', 'point', 'group', 'namekr', 'namebr', 'nametw']
df = df[columns_to_keep]

def generate_name(name, replace_character='-'):
    name = name.lower()                   # lowercase
    name = re.sub(r'[^a-z0-9]+', replace_character, name)  # replace non-alphanumeric with replace_character
    name = name.strip(replace_character)  # remove leading/trailing replace_character
    return name

# Create card-names translation dictionary
card_names_dict = {
    'en': {},
    'kr': {},
    'br': {},
    'tw': {}
}

# Populate translations
for _, row in df.iterrows():
    id_key = row['id']
    
    # English (original name)
    card_names_dict['en'][id_key] = row['name']
    
    # Korean translation
    if pd.notna(row.get('namekr')):
        card_names_dict['kr'][id_key] = row['namekr']
    else:
        card_names_dict['kr'][id_key] = row['name']  # fallback to English
    
    # Portuguese translation
    if pd.notna(row.get('namebr')):
        card_names_dict['br'][id_key] = row['namebr']
    else:
        card_names_dict['br'][id_key] = row['name']  # fallback to English

    # Chinese translation
    if pd.notna(row.get('nametw')):
        card_names_dict['tw'][id_key] = row['nametw']
    else:
        card_names_dict['tw'][id_key] = row['name']  # fallback to English

# Save card-names.json
locales_folder = "locales"
os.makedirs(locales_folder, exist_ok=True)
card_names_file = os.path.join(locales_folder, 'card-names.json')

with open(card_names_file, 'w', encoding='utf-8') as f:
    json.dump(card_names_dict, f, indent=2, ensure_ascii=False)

print(f"Card names translations saved to {card_names_file}")


# Process each group from 1 to 7
for group_number in range(1, 8):
    group_df = df[df['group'] == group_number].copy()  # filter group
    if group_df.empty:
        print(f"No data for group {group_number}")
        continue

    group_df['rate'] = 1/len(group_df)  # probability of getting the card
    group_df['region'] = ''
    group_df['groupCount'] = len(group_df)
    group_df['image'] = group_df['id'].astype(str) + '.webp'

    # Keep only necessary columns for JSON output
    output_columns = ['id', 'point', 'group', 'rate', 'region', 'groupCount', 'image']
    group_df_output = group_df[output_columns]

    # Convert to JSON
    data_json = group_df_output.to_dict(orient='records')

    # Save JSON file
    cards_folder = "cards-data"               # your folder name
    os.makedirs(cards_folder, exist_ok=True)   # create it if missing
    output_file = os.path.join(cards_folder, f'group-{group_number}.json')
    with open(output_file, 'w') as f:
        json.dump(data_json, f, indent=2)

    print(f"Group {group_number} JSON saved as {output_file}")