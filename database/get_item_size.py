import json

# Script to determine the size of a dynamodb table item. 

def calculate_attribute_size(key, value):
    size = len(key.encode('utf-8'))
    
    # Check the type of the value and calculate accordingly
    if isinstance(value, dict):
        for type_code, type_value in value.items():
            if type_code in ['S', 'N']:
                # Strings and Numbers
                size += len(type_value.encode('utf-8'))
            elif type_code == 'B':
                # Binary type value; decode to get raw binary size
                size += len(type_value)  # Assuming base64 encoded
            elif type_code in ['SS', 'NS', 'BS']:
                # Sets; calculate the size of each element
                size += sum([len(str(elem).encode('utf-8')) for elem in type_value])
            elif type_code in ['M', 'L']:
                # Maps and Lists; recursive calculation for each element
                size += sum([calculate_attribute_size(k, v) if type_code == 'M' else calculate_attribute_size(str(i), v) for i, (k, v) in enumerate(type_value.items() if type_code == 'M' else enumerate(type_value))])
    return size

def calculate_item_size(item):
    return sum([calculate_attribute_size(key, value) for key, value in item.items()]) + 100

with open('./data/team_114670.json', 'r') as f:
    item_data = json.load(f)
    item_size = calculate_item_size(item_data['Item'])  
    print(f"Item size: {item_size / 1024} KB")  # Display size in Kilobytes
