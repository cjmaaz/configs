#!/usr/bin/env python3
"""
Schema Splitter - Split Large Schema into Manageable Files
===========================================================

This script takes the large salesforce-er-schema.yaml file and creates:
1. Individual object files (schema/objects/<ObjectName>.yaml)
2. A master index file (schema/_index.yaml)
3. Categorized schema files (schema/categories/*.yaml)
4. A lightweight search index (schema/_search_index.yaml)

This makes the schema usable by AI agents within token limits.

Usage:
    python3 split_schema_by_object.py [--input PATH] [--output-dir PATH]

Options:
    --input PATH        Path to the large schema file (default: config/salesforce-er-schema.yaml)
    --output-dir PATH   Path to output directory (default: config/schema)
    --help             Show this help message

The script is automatically called after schema generation by auto_generate_schema.py
"""

import os
import sys
import yaml
import argparse
from pathlib import Path
from collections import defaultdict
from datetime import datetime

class SchemaOptimizer:
    """Optimizes large schema files for AI agent consumption."""
    
    # Object categorization based on common patterns
    CATEGORIES = {
        'core': ['Account', 'Contact', 'Lead', 'User', 'Group', 'Profile'],
        'sales': ['Opportunity', 'Quote', 'Contract', 'Order', 'Product2', 'PricebookEntry', 
                  'OpportunityLineItem', 'QuoteLineItem', 'OrderItem'],
        'service': ['Case', 'Solution', 'Entitlement', 'ServiceContract', 'WorkOrder', 
                    'WorkOrderLineItem', 'ServiceAppointment'],
        'marketing': ['Campaign', 'CampaignMember', 'Lead'],
        'activities': ['Task', 'Event', 'EmailMessage'],
        'healthcare': [],  # Will auto-detect HealthCloudGA objects
        'custom': [],      # Will auto-detect custom objects
        'other': []        # Everything else
    }
    
    def __init__(self, input_file, output_dir):
        """
        Initialize the optimizer.
        
        Args:
            input_file: Path to the large schema YAML file
            output_dir: Path to the output directory for split files
        """
        self.input_file = Path(input_file)
        self.output_dir = Path(output_dir)
        self.schema_data = None
        self.objects = []
        self.relationships = []
        self.metadata = {}
        
    def load_schema(self):
        """Load the large schema file."""
        print("=" * 80)
        print("Loading Large Schema File")
        print("=" * 80)
        print(f"Reading: {self.input_file}")
        
        if not self.input_file.exists():
            print(f"✗ Error: Schema file not found: {self.input_file}")
            return False
        
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                self.schema_data = yaml.safe_load(f)
            
            # Extract components
            sf_schema = self.schema_data.get('salesforce_schema', {})
            self.metadata = sf_schema.get('metadata', {})
            self.objects = sf_schema.get('objects', [])
            self.relationships = sf_schema.get('relationships', [])
            
            print(f"✓ Loaded schema successfully")
            print(f"  Objects: {len(self.objects)}")
            print(f"  Relationships: {len(self.relationships)}")
            
            return True
            
        except yaml.YAMLError as e:
            print(f"✗ Error: Failed to parse YAML: {e}")
            return False
        except Exception as e:
            print(f"✗ Error: Failed to load schema: {e}")
            return False
    
    def create_directories(self):
        """Create output directory structure."""
        print("\n" + "=" * 80)
        print("Creating Directory Structure")
        print("=" * 80)
        
        dirs_to_create = [
            self.output_dir,
            self.output_dir / 'objects',
            self.output_dir / 'categories',
        ]
        
        for dir_path in dirs_to_create:
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                print(f"✓ {dir_path}")
            except Exception as e:
                print(f"✗ Error creating {dir_path}: {e}")
                return False
        
        return True
    
    def split_objects(self):
        """Split objects into individual files."""
        print("\n" + "=" * 80)
        print("Splitting Objects into Individual Files")
        print("=" * 80)
        
        objects_dir = self.output_dir / 'objects'
        success_count = 0
        
        for obj in self.objects:
            obj_name = obj.get('api_name', 'Unknown')
            
            try:
                # Create individual object file
                obj_file = objects_dir / f"{obj_name}.yaml"
                
                # Add metadata to object
                obj_data = {
                    'object': obj,
                    'related_relationships': self._get_relationships_for_object(obj_name),
                    'metadata': {
                        'split_from': str(self.input_file),
                        'generated_date': datetime.now().isoformat(),
                        'original_schema_date': self.metadata.get('generated_date', '')
                    }
                }
                
                with open(obj_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Salesforce Object Schema: {obj_name}\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Type: {obj.get('type', 'Unknown')}\n")
                    f.write(f"# Fields: {len(obj.get('fields', []))}\n")
                    f.write("#\n\n")
                    yaml.dump(obj_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
                
                success_count += 1
                
                if success_count % 50 == 0:
                    print(f"  Progress: {success_count}/{len(self.objects)} objects...")
                
            except Exception as e:
                print(f"✗ Error creating file for {obj_name}: {e}")
        
        print(f"✓ Created {success_count} object files")
        return True
    
    def _get_relationships_for_object(self, obj_name):
        """Get all relationships involving this object."""
        related = []
        for rel in self.relationships:
            if rel.get('from_object') == obj_name or rel.get('to_object') == obj_name:
                related.append(rel)
        return related
    
    def create_index(self):
        """Create master index file."""
        print("\n" + "=" * 80)
        print("Creating Master Index")
        print("=" * 80)
        
        index_file = self.output_dir / '_index.yaml'
        
        # Build index data
        index_data = {
            'schema_index': {
                'metadata': {
                    'generated_date': datetime.now().isoformat(),
                    'total_objects': len(self.objects),
                    'source_file': str(self.input_file),
                    'objects_directory': 'objects/',
                    'categories_directory': 'categories/'
                },
                'objects': []
            }
        }
        
        for obj in sorted(self.objects, key=lambda x: x.get('api_name', '')):
            obj_name = obj.get('api_name', '')
            obj_entry = {
                'api_name': obj_name,
                'label': obj.get('label', obj_name),
                'type': obj.get('type', 'Unknown'),
                'file': f"objects/{obj_name}.yaml",
                'field_count': len(obj.get('fields', [])),
                'has_record_types': len(obj.get('record_types', [])) > 0,
                'has_validation_rules': len(obj.get('validation_rules', [])) > 0
            }
            
            # Add key fields preview
            fields = obj.get('fields', [])
            key_fields = []
            for field in fields[:10]:  # First 10 fields
                field_name = field.get('api_name', '')
                field_type = field.get('type', '')
                if field_name and field_type:
                    key_fields.append(f"{field_name} ({field_type})")
            
            if key_fields:
                obj_entry['sample_fields'] = key_fields
            
            index_data['schema_index']['objects'].append(obj_entry)
        
        try:
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write("# Salesforce Schema Master Index\n")
                f.write(f"# Generated: {datetime.now().isoformat()}\n")
                f.write("#\n")
                f.write("# This index provides quick lookup for all Salesforce objects.\n")
                f.write("# To get full object details, read the file specified in the 'file' field.\n")
                f.write("#\n\n")
                yaml.dump(index_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
            
            print(f"✓ Created master index: {index_file}")
            print(f"  Contains {len(index_data['schema_index']['objects'])} object entries")
            return True
            
        except Exception as e:
            print(f"✗ Error creating index: {e}")
            return False
    
    def create_search_index(self):
        """Create lightweight search index with line numbers from original file."""
        print("\n" + "=" * 80)
        print("Creating Search Index")
        print("=" * 80)
        
        search_index_file = self.output_dir / '_search_index.yaml'
        
        search_data = {
            'search_index': {
                'metadata': {
                    'generated_date': datetime.now().isoformat(),
                    'description': 'Lightweight index for searching objects and fields',
                    'usage': 'Use this to quickly find objects and their key fields'
                },
                'objects': {}
            }
        }
        
        for obj in self.objects:
            obj_name = obj.get('api_name', '')
            fields_list = []
            
            for field in obj.get('fields', []):
                field_info = {
                    'name': field.get('api_name', ''),
                    'type': field.get('type', ''),
                    'required': field.get('required', False)
                }
                
                # Add picklist values if present
                if 'picklist_values' in field:
                    field_info['picklist_values'] = field['picklist_values']
                
                # Add lookup reference if present
                if 'reference_to' in field:
                    field_info['reference_to'] = field['reference_to']
                
                # Add length if present
                if 'length' in field:
                    field_info['length'] = field['length']
                
                fields_list.append(field_info)
            
            search_data['search_index']['objects'][obj_name] = {
                'type': obj.get('type', 'Unknown'),
                'label': obj.get('label', obj_name),
                'file': f"objects/{obj_name}.yaml",
                'fields': fields_list
            }
        
        try:
            with open(search_index_file, 'w', encoding='utf-8') as f:
                f.write("# Salesforce Schema Search Index\n")
                f.write(f"# Generated: {datetime.now().isoformat()}\n")
                f.write("#\n")
                f.write("# Lightweight index for quick field lookups.\n")
                f.write("# Contains all objects with their fields, types, and constraints.\n")
                f.write("#\n\n")
                yaml.dump(search_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
            
            print(f"✓ Created search index: {search_index_file}")
            return True
            
        except Exception as e:
            print(f"✗ Error creating search index: {e}")
            return False
    
    def create_categorized_schemas(self):
        """Create categorized schema files."""
        print("\n" + "=" * 80)
        print("Creating Categorized Schemas")
        print("=" * 80)
        
        categories_dir = self.output_dir / 'categories'
        
        # Auto-categorize objects
        categorized = defaultdict(list)
        
        for obj in self.objects:
            obj_name = obj.get('api_name', '')
            obj_type = obj.get('type', '')
            
            # Find category
            category_found = False
            
            # Check predefined categories
            for category, obj_list in self.CATEGORIES.items():
                if obj_name in obj_list:
                    categorized[category].append(obj)
                    category_found = True
                    break
            
            if category_found:
                continue
            
            # Auto-detect Healthcare objects
            if obj_name.startswith('HealthCloudGA__'):
                categorized['healthcare'].append(obj)
            # Auto-detect custom objects
            elif obj_name.endswith('__c'):
                categorized['custom'].append(obj)
            # Everything else
            else:
                categorized['other'].append(obj)
        
        # Create category files
        for category, objects_list in categorized.items():
            if not objects_list:
                continue
            
            category_file = categories_dir / f"{category}.yaml"
            
            category_data = {
                'category': category,
                'metadata': {
                    'generated_date': datetime.now().isoformat(),
                    'object_count': len(objects_list),
                    'description': f"Schema for {category} objects"
                },
                'objects': objects_list
            }
            
            try:
                with open(category_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Salesforce Schema - {category.upper()} Category\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Objects: {len(objects_list)}\n")
                    f.write("#\n\n")
                    yaml.dump(category_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
                
                print(f"✓ Created {category}.yaml ({len(objects_list)} objects)")
                
            except Exception as e:
                print(f"✗ Error creating category file {category}: {e}")
        
        return True
    
    def create_readme(self):
        """Create README file explaining the schema structure."""
        print("\n" + "=" * 80)
        print("Creating README")
        print("=" * 80)
        
        readme_file = self.output_dir / 'README.md'
        
        readme_content = """# Salesforce Schema Reference

This directory contains the optimized Salesforce schema split for AI agent consumption.

## Structure

```
config/schema/
├── _index.yaml              # Master index of all objects
├── _search_index.yaml       # Lightweight search index with all fields
├── objects/                 # Individual object schemas
│   ├── Account.yaml
│   ├── Contact.yaml
│   ├── Opportunity.yaml
│   └── ... (all objects)
└── categories/              # Objects grouped by category
    ├── core.yaml           # Core objects (Account, Contact, etc.)
    ├── sales.yaml          # Sales objects (Opportunity, Quote, etc.)
    ├── service.yaml        # Service objects (Case, WorkOrder, etc.)
    ├── healthcare.yaml     # Healthcare objects
    ├── custom.yaml         # Custom objects
    └── other.yaml          # Other objects
```

## Usage for AI Agents

### Quick Lookup Workflow

1. **Check if object exists:**
   - Read `_index.yaml` to see if object exists
   - Get the object file path from the index

2. **Read object details:**
   - Read `objects/<ObjectName>.yaml` for complete schema
   - This file contains all fields, types, relationships, etc.

3. **Search for fields:**
   - Read `_search_index.yaml` to search all fields across objects
   - Contains field names, types, picklist values, lookups, etc.

4. **Browse by category:**
   - Read category files (e.g., `categories/core.yaml`) for related objects

### Example: Validating Account Fields

```bash
# Step 1: Confirm Account exists
grep "api_name: Account" config/schema/_index.yaml

# Step 2: Read full Account schema
cat config/schema/objects/Account.yaml

# Step 3: Search for specific field
grep -A 5 "HealthCloudGA__IndividualId__c" config/schema/_search_index.yaml
```

### Example: Finding Healthcare Objects

```bash
# Read all healthcare objects at once
cat config/schema/categories/healthcare.yaml
```

## File Sizes

Individual object files are typically:
- Small objects: 50-200 lines (~2-8 KB)
- Medium objects: 200-500 lines (~8-20 KB)
- Large objects: 500-1500 lines (~20-60 KB)

All files are well within AI token limits for single-read consumption.

## Regeneration

This schema is auto-generated. To regenerate:

```bash
# Full regeneration (retrieves from org + generates schema + splits)
python3 scripts/auto_generate_schema.py

# Just re-split existing schema
python3 scripts/split_schema_by_object.py
```

## Metadata

"""
        
        readme_content += f"- **Generated:** {datetime.now().isoformat()}\n"
        readme_content += f"- **Total Objects:** {len(self.objects)}\n"
        readme_content += f"- **Source:** {self.input_file}\n"
        
        try:
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write(readme_content)
            
            print(f"✓ Created README: {readme_file}")
            return True
            
        except Exception as e:
            print(f"✗ Error creating README: {e}")
            return False
    
    def run(self):
        """Main execution."""
        print("\n")
        print("╔" + "=" * 78 + "╗")
        print("║" + " " * 20 + "Schema Optimizer & Splitter" + " " * 32 + "║")
        print("║" + " " * 15 + "Making Large Schemas AI-Friendly" + " " * 33 + "║")
        print("╚" + "=" * 78 + "╝")
        print()
        
        # Load schema
        if not self.load_schema():
            return False
        
        # Create directories
        if not self.create_directories():
            return False
        
        # Split objects
        if not self.split_objects():
            return False
        
        # Create index
        if not self.create_index():
            return False
        
        # Create search index
        if not self.create_search_index():
            return False
        
        # Create categorized schemas
        if not self.create_categorized_schemas():
            return False
        
        # Create README
        if not self.create_readme():
            return False
        
        # Success summary
        print("\n" + "=" * 80)
        print("✓ SCHEMA OPTIMIZATION COMPLETE!")
        print("=" * 80)
        print()
        print("Summary:")
        print(f"  - Input file: {self.input_file}")
        print(f"  - Output directory: {self.output_dir}")
        print(f"  - Objects split: {len(self.objects)}")
        print(f"  - Individual files: {len(self.objects)} in objects/")
        print(f"  - Category files: Created in categories/")
        print(f"  - Index files: _index.yaml, _search_index.yaml")
        print()
        print("Next steps:")
        print("  - AI agents should use config/schema/ instead of the large file")
        print("  - Read _index.yaml for quick object lookup")
        print("  - Read objects/<ObjectName>.yaml for full object details")
        print("  - Read _search_index.yaml for field searches")
        print()
        
        return True


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(
        description='Split large Salesforce schema into optimized files for AI agents',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '--input',
        help='Path to large schema file (default: config/salesforce-er-schema.yaml)',
        type=str,
        default='config/salesforce-er-schema.yaml'
    )
    
    parser.add_argument(
        '--output-dir',
        help='Path to output directory (default: config/schema)',
        type=str,
        default='config/schema'
    )
    
    args = parser.parse_args()
    
    optimizer = SchemaOptimizer(args.input, args.output_dir)
    
    try:
        success = optimizer.run()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n✗ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
