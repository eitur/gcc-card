import pandas as pd
import re
import json

excel_file = 'cards_table.xlsx'
df = pd.read_excel(excel_file)
df.columns = df.columns.str.lower()

columns_to_keep = ['id', 'name', 'point', 'group']
df = df[columns_to_keep]

# Function to create image field
def generate_image_name(name):
    name = name.lower()                   # lowercase
    name = name.replace('card', '')       # remove 'card'
    name = re.sub(r'[^a-z0-9]+', '-', name)  # replace non-alphanumeric with -
    name = re.sub(r'-+', '-', name)       # collapse multiple -
    name = name.strip('-')                # remove leading/trailing -
    return name + '.png'

# Process each group from 1 to 7
for group_number in range(1, 8):
    group_df = df[df['group'] == group_number].copy()  # filter group
    if group_df.empty:
        print(f"No data for group {group_number}")
        continue

    group_df['rate'] = 1/len(group_df)  # probability of getting the card
    group_df['region'] = ''
    group_df['groupCount'] = len(group_df)
    group_df['image'] = group_df['name'].apply(generate_image_name)  # add image field

    # Convert to JSON
    data_json = group_df.to_dict(orient='records')

    # Save JSON file
    output_file = f'group-{group_number}.json'
    with open(output_file, 'w') as f:
        json.dump(data_json, f, indent=2)

    print(f"Group {group_number} JSON saved as {output_file}")