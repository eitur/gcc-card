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

def card_copies_convert(card_point):
    card_copies = {
        range(1, 12): {0: 5, 1: 8, 2: 15},
        range(12, 23): {0: 5, 1: 7, 2: 13},
        range(23, 34): {0: 4, 1: 6, 2: 11},
        range(34, 45): {0: 3, 1: 5, 2: 9},
        range(45, 56): {0: 2, 1: 4, 2: 7},
        range(56, 67): {0: 1, 1: 3, 2: 5},
        range(67, 100): {0: 1, 1: 2, 2: 3},
    }
    for rank_key in card_copies:
        if card_point in rank_key:
            return card_copies.get(rank_key)

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

            # Build copies interval and cumulated for different card ranks
            if isinstance(safe_int_convert(row['point']), int):
                card_copies = card_copies_convert(safe_int_convert(row['point']))
                copy_obj = {
                    'interval': card_copies,
                    'cumulated': {
                        0: 0,
                        1: card_copies.get(0),
                        2: card_copies.get(0) + card_copies.get(1),
                        3: card_copies.get(0) + card_copies.get(1) + card_copies.get(2),
                    }
                }
            else:
                copy_obj = {
                    'interval': '-',
                    'cumulated': '-'
                }
            
            # Build the card object
            card_obj = {
                'id': int(row['id']),
                'names': names_obj,
                'point': safe_int_convert(row['point']),
                'group': int(group_number) if isinstance(group_number, int) else group_number,
                'individualProbability': 1/len(group_df),
                'groupCount': len(group_df),
                'image': row['image'] if pd.notna(row['image']) else 'default.webp',
                'acquiredFrom': row['acquiredfrom'] if pd.notna(row['acquiredfrom']) else '-',
                'copy': copy_obj
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

    # Create multiple group JSON files
    print("\n[2] Creating group JSON files...")
    create_group_jsons(df)
    
    print("\n" + "="*50)
    print("\n✓ All done!")