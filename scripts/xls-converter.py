import pandas as pd
import re
import os
import json
import requests
from io import BytesIO


# Google Sheets published URL (published xlsx)
SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRddMHNdnFESEpNUoT0f5AWBXL4IswirigL1Qdd8vvgkVcabrjvW4sZ4DwIH4I-Q5e_zw-LmOxlrk-Y/pub?output=xlsx'
CARDS_FOLDER = "cards-data"


def safe_int_convert(value):
    """Safely convert value to int, return '-' if not possible"""
    if pd.isna(value):
        return '-'
    try:
        # Try to convert to float first (handles string numbers), then to int
        return int(float(value))
    except (ValueError, TypeError):
        return '-'


def create_single_json(df):
    """Create one single JSON file with all cards"""
    # Sort by ID to maintain order
    df = df.sort_values('id')
    
    all_cards = []
    
    for _, row in df.iterrows():
        # Build the names object with all translations
        names_obj = {
            'en': row['name'],
            'kr': row['namekr'] if pd.notna(row.get('namekr')) else row['name'],
            'br': row['namebr'] if pd.notna(row.get('namebr')) else row['name'],
            'tw': row['nametw'] if pd.notna(row.get('nametw')) else row['name']
        }
        
        # Get group count for this card's group
        group_count = len(df[df['group'] == row['group']])
        
        # Build the card object
        card_obj = {
            'id': int(row['id']),
            'names': names_obj,
            'point': safe_int_convert(row['point']),
            'group': int(row['group']) if pd.notna(row['group']) and isinstance(row['group'], (int, float)) else row['group'],
            'rate': round(1/group_count, 6) if group_count > 0 else 0,
            'groupCount': group_count,
            'image': row['image'] if pd.notna(row['image']) else 'default.webp',
            'acquiredFrom': row['acquiredfrom'] if pd.notna(row['acquiredfrom']) else '-'
        }
        
        all_cards.append(card_obj)
    
    # Save single JSON file
    os.makedirs(CARDS_FOLDER, exist_ok=True)
    output_file = os.path.join(CARDS_FOLDER, 'all-cards.json')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_cards, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Single file saved: {output_file}")
    print(f"  Total cards: {len(all_cards)}")


def create_group_jsons(df):
    """Create separate JSON files for each group"""
    # none (cards not belong to collections), and undefined (info not filled)
    for group_number in list(range(1, 8)) + ['uncollectible', 'exclusive']:
        group_df = df[df['group'] == group_number].copy()  # filter group
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
                'point': safe_int_convert(row['point']),
                'group': int(group_number) if isinstance(group_number, int) else group_number,
                'rate': 1/len(group_df),
                'groupCount': len(group_df),
                'image': row['image'] if pd.notna(row['image']) else 'default.webp',
                'acquiredFrom': row['acquiredfrom'] if pd.notna(row['acquiredfrom']) else '-'
            }
            
            data_json.append(card_obj)

        # Save JSON file
        os.makedirs(CARDS_FOLDER, exist_ok=True)   # create it if missing
        output_file = os.path.join(CARDS_FOLDER, f'group-{group_number}.json')
        with open(output_file, 'w') as f:
            json.dump(data_json, f, indent=2, ensure_ascii=False)

        print(f"✓ Group {group_number}: {output_file} ({len(data_json)} cards)")


if __name__ == "__main__":
    # Download spreadsheet
    print("Downloading spreadsheet...")
    response = requests.get(SHEET_URL)
    df = pd.read_excel(BytesIO(response.content))
    df.columns = df.columns.str.lower()
    
    columns_to_keep = ['id', 'name', 'point', 'image', 'group', 'namekr', 'namebr', 'nametw', 'acquiredfrom']
    df = df[columns_to_keep]
    
    print("\n" + "="*50)
    print("\n[1] Creating single JSON file...")
    create_single_json(df)
    
    print("\n" + "="*50)
    
    # Option 2: Create multiple group JSON files
    print("\n[2] Creating group JSON files...")
    create_group_jsons(df)
    
    print("\n" + "="*50)
    print("\n✓ All done!")