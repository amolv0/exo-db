import json

def remove_null_values(obj):
    if isinstance(obj, dict):
        return {key: remove_null_values(value) for key, value in obj.items() if value is not None}
    elif isinstance(obj, list):
        return [remove_null_values(element) for element in obj if element is not None]
    else:
        return obj

# Path to your original JSON file
json_file_path = 'data/washington_copy.json'

# Read the JSON data from the file
with open(json_file_path, 'r') as file:
    original_data = json.load(file)

# Remove null values from the JSON data
updated_data = remove_null_values(original_data)

# Path to save the updated JSON file
updated_json_file_path = 'data/washington_updated.json'

# Write the updated JSON data to a new file
with open(updated_json_file_path, 'w') as file:
    json.dump(updated_data, file, indent=2)

print(f"Updated JSON saved to {updated_json_file_path}")
