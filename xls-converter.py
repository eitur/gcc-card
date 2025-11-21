import pandas as pd
import re
import os
import json

excel_file = 'cards_table.xlsx'
df = pd.read_excel(excel_file)
df.columns = df.columns.str.lower()

columns_to_keep = ['id', 'name', 'point', 'group', 'namekr', 'namebr']
df = df[columns_to_keep]

# Function to create image field
def generate_image_name(name):
    name = name.lower()                   # lowercase
    name = name.replace('card', '')       # remove 'card'
    name = re.sub(r'[^a-z0-9]+', '-', name)  # replace non-alphanumeric with -
    name = re.sub(r'-+', '-', name)       # collapse multiple -
    name = name.strip('-')                # remove leading/trailing -
    return name + '.png'

def generate_name_key(name):
    name = name.lower()
    name = re.sub(r'[^a-z0-9]+', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')
    return name

# Create card-names translation dictionary
card_names_dict = {
    'en': {},
    'kr': {},
    'br': {}
}

# Populate translations
for _, row in df.iterrows():
    name_key = generate_name_key(row['name'])
    
    # English (original name)
    card_names_dict['en'][name_key] = row['name']
    
    # Korean translation
    if pd.notna(row.get('namekr')):
        card_names_dict['kr'][name_key] = row['namekr']
    else:
        card_names_dict['kr'][name_key] = row['name']  # fallback to English
    
    # Portuguese translation
    if pd.notna(row.get('namebr')):
        card_names_dict['br'][name_key] = row['namebr']
    else:
        card_names_dict['br'][name_key] = row['name']  # fallback to English

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

    group_df['nameKey'] = group_df['name'].apply(generate_name_key)
    group_df['rate'] = 1/len(group_df)  # probability of getting the card
    group_df['region'] = ''
    group_df['groupCount'] = len(group_df)
    group_df['image'] = group_df['name'].apply(generate_image_name)  # add image field

    # Keep only necessary columns for JSON output
    output_columns = ['id', 'nameKey', 'point', 'group', 'rate', 'region', 'groupCount', 'image']
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