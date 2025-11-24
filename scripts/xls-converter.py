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

columns_to_keep = ['id', 'name', 'point', 'image', 'group', 'namekr', 'namebr', 'nametw']
df = df[columns_to_keep]

# Process each group from 1 to 7, none (cards not belong to collections), and undefined (info not filled)
for group_number in list(range(1, 8)) + ['none', 'undefined']:
    if isinstance(group_number, int):
        group_df = df[df['group'] == group_number].copy()  # filter group
    elif group_number == 'none':
        group_df = df[df['group'] == 'none'].copy()
    else:  # undefinend
        group_df = df[df['group'].isna()].copy()
    if group_df.empty:
        print(f"No data for group {group_number}")
        continue

    # Prepare the data for JSON output
    data_json = []
    
    for _, row in group_df.iterrows():
        # Build the names object with all translations
        names_obj = {
            'en': row['name'],
            'kr': row['namekr'] if pd.notna(row.get('namekr')) else row['name'],
            'br': row['namebr'] if pd.notna(row.get('namebr')) else row['name'],
            'tw': row['nametw'] if pd.notna(row.get('nametw')) else row['name']
        }
        
        # Build the card object
        card_obj = {
            'id': int(row['id']),
            'names': names_obj,
            'point': int(row['point']) if isinstance(group_number, int) else '-',
            'group': int(group_number) if isinstance(group_number, int) else ('-' if group_number == 'none' else group_number),
            'rate': 1/len(group_df),
            'region': '',
            'groupCount': len(group_df),
            'image': row['image']
        }
        
        data_json.append(card_obj)

    # Save JSON file
    cards_folder = "cards-data"               # your folder name
    os.makedirs(cards_folder, exist_ok=True)   # create it if missing
    output_file = os.path.join(cards_folder, f'group-{group_number}.json')
    with open(output_file, 'w') as f:
        json.dump(data_json, f, indent=2, ensure_ascii=False)

    print(f"Group {group_number} JSON saved as {output_file}")