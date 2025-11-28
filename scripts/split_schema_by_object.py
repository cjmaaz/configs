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
        """Split objects into individual folders with separate files for schema, picklists, and formulas."""
        print("\n" + "=" * 80)
        print("Splitting Objects into Folder Structure")
        print("=" * 80)
        
        objects_dir = self.output_dir / 'objects'
        success_count = 0
        
        for obj in self.objects:
            obj_name = obj.get('api_name', 'Unknown')
            
            try:
                # Create individual object folder
                obj_folder = objects_dir / obj_name
                obj_folder.mkdir(parents=True, exist_ok=True)
                
                # Extract picklists and formulas from fields
                picklists, formulas, core_fields = self._extract_field_metadata(obj.get('fields', []), obj_name)
                
                # Create core schema file (without picklist values and formulas)
                schema_file = obj_folder / 'schema.yaml'
                schema_data = {
                    'object': {
                        'api_name': obj.get('api_name'),
                        'type': obj.get('type'),
                        'label': obj.get('label'),
                        'description': obj.get('description'),
                        'fields': core_fields,
                        'record_types': obj.get('record_types', []),
                        'validation_rules': obj.get('validation_rules', [])
                    },
                    'related_relationships': self._get_relationships_for_object(obj_name),
                    'metadata': {
                        'split_from': str(self.input_file),
                        'generated_date': datetime.now().isoformat(),
                        'original_schema_date': self.metadata.get('generated_date', ''),
                        'has_picklists': len(picklists) > 0,
                        'has_formulas': len(formulas) > 0
                    }
                }
                
                with open(schema_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Salesforce Object Schema: {obj_name}\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Type: {obj.get('type', 'Unknown')}\n")
                    f.write(f"# Fields: {len(core_fields)}\n")
                    f.write("#\n")
                    f.write("# This file contains core field structure.\n")
                    f.write("# Picklist values: See picklists.yaml (if present)\n")
                    f.write("# Formula definitions: See formulas.yaml (if present)\n")
                    f.write("#\n\n")
                    yaml.dump(schema_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
                
                # Create picklists file if there are any
                if picklists:
                    picklists_file = obj_folder / 'picklists.yaml'
                    picklists_data = {
                        'picklists': picklists,
                        'metadata': {
                            'object': obj_name,
                            'generated_date': datetime.now().isoformat(),
                            'picklist_count': len(picklists)
                        }
                    }
                    
                    with open(picklists_file, 'w', encoding='utf-8') as f:
                        f.write(f"# Picklist Values for {obj_name}\n")
                        f.write(f"# Generated: {datetime.now().isoformat()}\n")
                        f.write(f"# Total Picklist Fields: {len(picklists)}\n")
                        f.write("#\n\n")
                        yaml.dump(picklists_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
                
                # Create formulas file if there are any
                if formulas:
                    formulas_file = obj_folder / 'formulas.yaml'
                    formulas_data = {
                        'formulas': formulas,
                        'metadata': {
                            'object': obj_name,
                            'generated_date': datetime.now().isoformat(),
                            'formula_count': len(formulas)
                        }
                    }
                    
                    with open(formulas_file, 'w', encoding='utf-8') as f:
                        f.write(f"# Formula Definitions for {obj_name}\n")
                        f.write(f"# Generated: {datetime.now().isoformat()}\n")
                        f.write(f"# Total Formula Fields: {len(formulas)}\n")
                        f.write("#\n\n")
                        yaml.dump(formulas_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
                
                success_count += 1
                
                if success_count % 50 == 0:
                    print(f"  Progress: {success_count}/{len(self.objects)} objects...")
                
            except Exception as e:
                print(f"✗ Error creating files for {obj_name}: {e}")
        
        print(f"✓ Created {success_count} object folders")
        return True
    
    def _get_relationships_for_object(self, obj_name):
        """Get all relationships involving this object."""
        related = []
        for rel in self.relationships:
            if rel.get('from_object') == obj_name or rel.get('to_object') == obj_name:
                related.append(rel)
        return related
    
    def _extract_field_metadata(self, fields, obj_name):
        """
        Extract picklists and formulas from fields, returning core fields without them.
        
        Args:
            fields: List of field dictionaries
            obj_name: Name of the object (for generating paths in notes)
        
        Returns:
            tuple: (picklists_dict, formulas_dict, core_fields_list)
        """
        picklists = {}
        formulas = {}
        core_fields = []
        
        for field in fields:
            field_name = field.get('api_name', '')
            core_field = field.copy()
            
            # Extract picklist values
            if 'picklist_values' in field and field['picklist_values']:
                picklists[field_name] = field['picklist_values']
                # Remove from core field to reduce size
                core_field.pop('picklist_values', None)
                # Add note with full path to check picklists.yaml
                core_field['_note'] = f"Picklist values available in config/schema/objects/{obj_name}/picklists.yaml"
            
            # Extract formula definitions
            if 'formula' in field and field['formula']:
                formulas[field_name] = field['formula']
                # Remove from core field to reduce size
                core_field.pop('formula', None)
                # Add note with full path to check formulas.yaml
                core_field['_note'] = f"Formula definition available in config/schema/objects/{obj_name}/formulas.yaml"
            
            core_fields.append(core_field)
        
        return picklists, formulas, core_fields
    
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
                    'categories_directory': 'categories/',
                    'structure': 'Each object has a folder with schema.yaml, picklists.yaml (optional), formulas.yaml (optional)'
                },
                'objects': []
            }
        }
        
        for obj in sorted(self.objects, key=lambda x: x.get('api_name', '')):
            obj_name = obj.get('api_name', '')
            fields = obj.get('fields', [])
            
            # Check for picklists and formulas
            has_picklists = any('picklist_values' in f and f['picklist_values'] for f in fields)
            has_formulas = any('formula' in f and f['formula'] for f in fields)
            
            obj_entry = {
                'api_name': obj_name,
                'label': obj.get('label', obj_name),
                'type': obj.get('type', 'Unknown'),
                'folder': f"objects/{obj_name}/",
                'files': {
                    'schema': f"objects/{obj_name}/schema.yaml",
                    'picklists': f"objects/{obj_name}/picklists.yaml" if has_picklists else None,
                    'formulas': f"objects/{obj_name}/formulas.yaml" if has_formulas else None
                },
                'field_count': len(fields),
                'has_picklists': has_picklists,
                'has_formulas': has_formulas,
                'has_record_types': len(obj.get('record_types', [])) > 0,
                'has_validation_rules': len(obj.get('validation_rules', [])) > 0
            }
            
            # Add key fields preview
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
                f.write("# Each object has a dedicated folder with:\n")
                f.write("#   - schema.yaml (core structure - ALWAYS present)\n")
                f.write("#   - picklists.yaml (picklist values - optional)\n")
                f.write("#   - formulas.yaml (formula definitions - optional)\n")
                f.write("#\n\n")
                yaml.dump(index_data, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=120)
            
            print(f"✓ Created master index: {index_file}")
            print(f"  Contains {len(index_data['schema_index']['objects'])} object entries")
            return True
            
        except Exception as e:
            print(f"✗ Error creating index: {e}")
            return False
    
    def create_search_index(self):
        """Create lightweight search index with field metadata (without picklist values)."""
        print("\n" + "=" * 80)
        print("Creating Search Index")
        print("=" * 80)
        
        search_index_file = self.output_dir / '_search_index.yaml'
        
        search_data = {
            'search_index': {
                'metadata': {
                    'generated_date': datetime.now().isoformat(),
                    'description': 'Lightweight index for searching objects and fields',
                    'usage': 'Use this to quickly find objects and their key fields. For picklist values, see objects/<ObjectName>/picklists.yaml'
                },
                'objects': {}
            }
        }
        
        for obj in self.objects:
            obj_name = obj.get('api_name', '')
            fields_list = []
            
            has_picklists = False
            has_formulas = False
            
            for field in obj.get('fields', []):
                field_info = {
                    'name': field.get('api_name', ''),
                    'type': field.get('type', ''),
                    'required': field.get('required', False)
                }
                
                # Note presence of picklist values but don't include them (reduces size)
                if 'picklist_values' in field and field['picklist_values']:
                    field_info['has_picklist_values'] = True
                    has_picklists = True
                
                # Note presence of formula but don't include it (reduces size)
                if 'formula' in field and field['formula']:
                    field_info['has_formula'] = True
                    has_formulas = True
                
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
                'folder': f"objects/{obj_name}/",
                'files': {
                    'schema': f"objects/{obj_name}/schema.yaml",
                    'picklists': f"objects/{obj_name}/picklists.yaml" if has_picklists else None,
                    'formulas': f"objects/{obj_name}/formulas.yaml" if has_formulas else None
                },
                'fields': fields_list
            }
        
        try:
            with open(search_index_file, 'w', encoding='utf-8') as f:
                f.write("# Salesforce Schema Search Index\n")
                f.write(f"# Generated: {datetime.now().isoformat()}\n")
                f.write("#\n")
                f.write("# Lightweight index for quick field lookups.\n")
                f.write("# Contains all objects with their fields, types, and constraints.\n")
                f.write("# For picklist values: Read objects/<ObjectName>/picklists.yaml\n")
                f.write("# For formula definitions: Read objects/<ObjectName>/formulas.yaml\n")
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
├── objects/                 # Individual object folders
│   ├── Account/
│   │   ├── schema.yaml     # Core structure (ALWAYS present)
│   │   ├── picklists.yaml  # Picklist values (if present)
│   │   └── formulas.yaml   # Formula definitions (if present)
│   ├── Contact/
│   │   ├── schema.yaml
│   │   ├── picklists.yaml
│   │   └── formulas.yaml
│   └── ... (all objects)
└── categories/              # Objects grouped by category
    ├── core.yaml           # Core objects (Account, Contact, etc.)
    ├── sales.yaml          # Sales objects (Opportunity, Quote, etc.)
    ├── service.yaml        # Service objects (Case, WorkOrder, etc.)
    ├── healthcare.yaml     # Healthcare objects
    ├── custom.yaml         # Custom objects
    └── other.yaml          # Other objects
```

## Three-File Structure per Object

Each object now has its own folder with up to 3 files:

### 1. `schema.yaml` (ALWAYS present)
Core field structure without large data:
- Field API names, types, labels, descriptions
- Required flags, unique flags, external_id
- Length, precision, scale
- Relationship names and references
- Record types and validation rules

**Note:** Picklist fields are marked as "Picklist" type but values are in separate file.

### 2. `picklists.yaml` (Optional)
All picklist values for fields that have them:
```yaml
picklists:
  Status:
    - Open
    - Closed
  Priority:
    - High
    - Medium
    - Low
```

### 3. `formulas.yaml` (Optional)
All formula definitions for calculated fields:
```yaml
formulas:
  FullName__c: |
    FirstName__c & ' ' & LastName__c
  IsHighValue__c: |
    AnnualRevenue > 1000000
```

## Usage for AI Agents

### Efficient Reading Pattern

**Step 1: Always read core schema first**
```bash
read_file config/schema/objects/<ObjectName>/schema.yaml
```

**Step 2: Read picklists only if needed**
```bash
# Only when writing DML operations or validating picklist field values
read_file config/schema/objects/<ObjectName>/picklists.yaml
```

**Step 3: Read formulas only if needed**
```bash
# Only when you need to understand formula field logic
read_file config/schema/objects/<ObjectName>/formulas.yaml
```

### When to Read Each File

| File | Read When |
|------|-----------|
| `schema.yaml` | **Always** - For any code writing, field validation, SOQL queries |
| `picklists.yaml` | Writing DML operations, validating user input, setting picklist field values |
| `formulas.yaml` | Understanding calculated field logic, debugging formula errors |

### Example: Validating Account Fields

```bash
# Step 1: Check if object exists
cat config/schema/_index.yaml | grep "Account"

# Step 2: Read core schema (ALWAYS)
cat config/schema/objects/Account/schema.yaml

# Step 3: If setting picklist fields, read picklist values
cat config/schema/objects/Account/picklists.yaml

# Step 4: If working with formulas, read formula definitions
cat config/schema/objects/Account/formulas.yaml
```

### Example: Writing DML Code

```bash
# Step 1: Read core schema for field names and types
read_file config/schema/objects/Lead/schema.yaml

# Step 2: Read picklists to get valid Status values
read_file config/schema/objects/Lead/picklists.yaml

# Now write code with validated values
```

### Example: Understanding Formula Fields

```bash
# Step 1: Read core schema to see which fields are formulas
read_file config/schema/objects/Opportunity/schema.yaml

# Step 2: Read formula definitions to understand logic
read_file config/schema/objects/Opportunity/formulas.yaml
```

## File Sizes

With the new structure, files are significantly smaller:

**Old structure:**
- Large objects: 1500-2700 lines (~60-100 KB) - TOO BIG!

**New structure:**
- schema.yaml: 200-800 lines (~8-30 KB) - 70-90% smaller
- picklists.yaml: 50-500 lines (~2-20 KB) - Only when needed
- formulas.yaml: 10-100 lines (~0.5-5 KB) - Only when needed

All files are now well within AI token limits for efficient consumption.

## Benefits

1. **Smaller Files**: Core schema 70-90% smaller without picklist arrays
2. **Faster Loading**: Read only what you need for the task
3. **Better Organization**: Clear separation between structure and data
4. **Reduced Token Usage**: Don't load 2000+ picklist values when you only need field types
5. **Scalability**: Works for objects with 100+ fields or massive picklist arrays

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
        readme_content += f"- **Structure:** Three-file system (schema + picklists + formulas)\n"
        
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
        # Calculate statistics
        total_with_picklists = sum(1 for obj in self.objects if any('picklist_values' in f and f['picklist_values'] for f in obj.get('fields', [])))
        total_with_formulas = sum(1 for obj in self.objects if any('formula' in f and f['formula'] for f in obj.get('fields', [])))
        
        print("\n" + "=" * 80)
        print("✓ SCHEMA OPTIMIZATION COMPLETE!")
        print("=" * 80)
        print()
        print("Summary:")
        print(f"  - Input file: {self.input_file}")
        print(f"  - Output directory: {self.output_dir}")
        print(f"  - Objects split: {len(self.objects)}")
        print(f"  - Object folders: {len(self.objects)} in objects/")
        print(f"  - Objects with picklists: {total_with_picklists}")
        print(f"  - Objects with formulas: {total_with_formulas}")
        print(f"  - Category files: Created in categories/")
        print(f"  - Index files: _index.yaml, _search_index.yaml")
        print()
        print("File Structure per Object:")
        print("  - schema.yaml (core structure - ALWAYS present)")
        print("  - picklists.yaml (picklist values - if present)")
        print("  - formulas.yaml (formula definitions - if present)")
        print()
        print("Next steps:")
        print("  - AI agents should use config/schema/ with new folder structure")
        print("  - Read _index.yaml for quick object lookup")
        print("  - Read objects/<ObjectName>/schema.yaml for core structure")
        print("  - Read objects/<ObjectName>/picklists.yaml for picklist values (conditional)")
        print("  - Read objects/<ObjectName>/formulas.yaml for formula definitions (conditional)")
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
