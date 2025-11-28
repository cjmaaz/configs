#!/usr/bin/env python3
"""
Script to enrich Salesforce schema YAML files with picklist values and other metadata.

This script uses Salesforce CLI to extract complete field metadata including:
- Picklist values (ACTIVE ONLY - inactive values are excluded)
- Default values
- Field dependencies
- Controlling/dependent field relationships
- Formula definitions
- Validation rule details

IMPORTANT: Only ACTIVE picklist values are extracted to ensure AI agents
           and developers only use currently valid values.

WINDOWS COMPATIBLE: Properly resolves SF CLI path on Windows

Usage:
    # Enrich all objects (auto-detects org from .sf/config.json)
    python/python3 enrich_schema_with_picklists.py

    # Enrich all objects with explicit org
    python/python3 enrich_schema_with_picklists.py --org IBXDev_Maaz

    # Enrich specific objects
    python/python3 enrich_schema_with_picklists.py --objects Account,Contact,HealthcareProviderNpi

    # Dry run (show what would be changed)
    python/python3 enrich_schema_with_picklists.py --dry-run

Requirements:
    - Salesforce CLI (sf) installed
    - Authenticated org
    - PyYAML: pip install pyyaml

Note: This script is automatically called by auto_generate_schema.py as Step 9.
"""

import subprocess
import json
import yaml
import argparse
import platform
import shutil
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import sys

class SchemaEnricher:
    """Enriches Salesforce schema YAML files with complete metadata from org."""
    
    def __init__(self, org_alias: Optional[str] = None, schema_dir: str = "config/schema/objects"):
        self.org_alias = org_alias or self._detect_org_alias()
        self.schema_dir = Path(schema_dir)
        self.sf_exe = self._resolve_sf()
        self.enrichment_stats = {
            'objects_processed': 0,
            'fields_enriched': 0,
            'picklists_added': 0,
            'formulas_added': 0,
            'validations_updated': 0,
            'errors': [],
            'picklist_files_created': 0,
            'formula_files_created': 0
        }
    
    def _resolve_sf(self) -> str:
        """
        Resolve the path to the sf executable, handling Windows nuances.
        Returns the full path to the sf executable.
        """
        exe = shutil.which('sf')
        if exe:
            print(f"✓ Found SF CLI: {exe}")
            return exe
        
        if platform.system() == 'Windows':
            # Common Windows install paths for sf
            candidates = [
                r'C:\Program Files\Salesforce CLI\bin\sf.cmd',
                r'C:\Program Files\sf\bin\sf.cmd',
                rf'{os.environ.get("USERPROFILE", "")}\AppData\Roaming\npm\sf.cmd',
                rf'{os.environ.get("LOCALAPPDATA", "")}\sf\bin\sf.cmd'
            ]
            for c in candidates:
                if c and os.path.isfile(c):
                    print(f"✓ Found SF CLI: {c}")
                    return c
        
        print("✗ Salesforce CLI (sf) not found. Install it or add it to PATH.")
        print("  See: https://developer.salesforce.com/tools/salesforcecli")
        sys.exit(1)
    
    def _detect_org_alias(self) -> str:
        """
        Automatically detect the target org from .sf/config.json or .sfdx/sfdx-config.json.
        Same logic as auto_generate_schema.py.
        """
        project_root = Path.cwd()
        
        # Try .sf/config.json (SF CLI v2)
        sf_config = project_root / '.sf' / 'config.json'
        if sf_config.exists():
            try:
                with open(sf_config, 'r') as f:
                    config = json.load(f)
                    org_alias = config.get('target-org')
                    if org_alias:
                        print(f"✓ Auto-detected org: {org_alias} (from .sf/config.json)")
                        return org_alias
            except Exception:
                pass
        
        # Try .sfdx/sfdx-config.json (legacy)
        sfdx_config = project_root / '.sfdx' / 'sfdx-config.json'
        if sfdx_config.exists():
            try:
                with open(sfdx_config, 'r') as f:
                    config = json.load(f)
                    org_alias = config.get('defaultusername')
                    if org_alias:
                        print(f"✓ Auto-detected org: {org_alias} (from .sfdx/sfdx-config.json)")
                        return org_alias
            except Exception:
                pass
        
        # Could not detect org
        print("✗ Could not auto-detect target org from .sf/config.json or .sfdx/sfdx-config.json")
        print("  Please either:")
        print("    1. Set a default org: sf config set target-org <your-org-alias>")
        print("    2. Provide --org parameter: python/python3 enrich_schema_with_picklists.py --org YourOrg")
        sys.exit(1)
    
    def get_object_metadata(self, object_name: str) -> Optional[Dict]:
        """
        Retrieve complete object metadata from Salesforce using CLI.
        
        SF CLI Commands Used:
        ---------------------
        # Method 1: Using describe (faster, JSON output)
        sf sobject describe --sobject <ObjectName> --target-org <org> --json
        
        # Method 2: Using metadata retrieve (more complete)
        sf project retrieve start --metadata CustomObject:<ObjectName> --target-org <org>
        
        Returns field metadata including:
        - type, label, length
        - picklist values (picklistValues[])
        - controlling/dependent fields
        - formula definitions
        - default values
        """
        try:
            # Use describe command for field-level metadata
            cmd = [
                self.sf_exe, 'sobject', 'describe',
                '--sobject', object_name,
                '--target-org', self.org_alias,
                '--json'
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                check=True,
                timeout=60  # 60 second timeout per object
            )
            metadata = json.loads(result.stdout)
            
            if metadata.get('status') == 0:
                return metadata.get('result', {})
            else:
                self.enrichment_stats['errors'].append(f"{object_name}: {metadata.get('message')}")
                return None
                
        except subprocess.TimeoutExpired:
            self.enrichment_stats['errors'].append(f"{object_name}: Timeout after 60 seconds")
            return None
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)
            self.enrichment_stats['errors'].append(f"{object_name}: CLI error - {error_msg}")
            return None
        except json.JSONDecodeError as e:
            self.enrichment_stats['errors'].append(f"{object_name}: JSON parse error - {str(e)}")
            return None
        except FileNotFoundError:
            print(f"✗ Error: Could not find SF CLI executable: {self.sf_exe}")
            print("  Please ensure Salesforce CLI is installed and in your PATH")
            sys.exit(1)
        except Exception as e:
            self.enrichment_stats['errors'].append(f"{object_name}: Unexpected error - {str(e)}")
            return None
    
    def extract_picklist_values(self, field_metadata: Dict) -> Optional[List[str]]:
        """
        Extract picklist values from field metadata.
        
        IMPORTANT: Returns ONLY ACTIVE picklist values.
        Inactive values are excluded to prevent invalid data in code.
        """
        if field_metadata.get('type') not in ['picklist', 'multipicklist']:
            return None
        
        picklist_values = field_metadata.get('picklistValues', [])
        
        # CRITICAL: Filter for ACTIVE values only (exclude inactive)
        # This ensures AI agents only use valid, currently-active picklist values
        active_values = [
            pv['value'] 
            for pv in picklist_values 
            if pv.get('active', True)  # Only include if active=True
        ]
        
        return active_values if active_values else None
    
    def _extract_non_picklist_formula_metadata(self, field_metadata: Dict) -> Dict[str, Any]:
        """
        Extract field metadata EXCLUDING picklists and formulas.
        (Those are handled separately in the new structure)
        """
        enriched_field = {}
        
        # Basic field info
        field_type = field_metadata.get('type')
        
        # Default value
        if field_metadata.get('defaultValue'):
            enriched_field['default_value'] = field_metadata['defaultValue']
        
        # Field constraints
        if field_metadata.get('nillable') is False:
            enriched_field['required'] = True
        
        if field_metadata.get('unique'):
            enriched_field['unique'] = True
        
        if field_metadata.get('externalId'):
            enriched_field['external_id'] = True
        
        # Lookup relationship
        if field_type == 'reference':
            reference_to = field_metadata.get('referenceTo', [])
            if reference_to:
                enriched_field['reference_to'] = reference_to[0] if len(reference_to) == 1 else reference_to
        
        # Field dependencies (controlling/dependent picklists)
        if field_metadata.get('controllerName'):
            enriched_field['controlling_field'] = field_metadata['controllerName']
        
        if field_metadata.get('dependentPicklist'):
            enriched_field['is_dependent_picklist'] = True
        
        # Field length
        if field_metadata.get('length'):
            enriched_field['length'] = field_metadata['length']
        
        # Precision and scale (for numbers)
        if field_metadata.get('precision'):
            enriched_field['precision'] = field_metadata['precision']
        if field_metadata.get('scale'):
            enriched_field['scale'] = field_metadata['scale']
        
        # Help text
        if field_metadata.get('inlineHelpText'):
            enriched_field['help_text'] = field_metadata['inlineHelpText']
        
        # Description
        if field_metadata.get('label'):
            enriched_field['label'] = field_metadata['label']
        
        return enriched_field
    
    def extract_field_metadata(self, field_metadata: Dict) -> Dict[str, Any]:
        """
        Extract comprehensive field metadata including:
        - Picklist values
        - Default values
        - Formula definitions
        - Dependencies
        - Constraints (required, unique, externalId)
        """
        enriched_field = {}
        
        # Basic field info
        field_name = field_metadata.get('name')
        field_type = field_metadata.get('type')
        
        # Picklist values
        if field_type in ['picklist', 'multipicklist']:
            picklist_values = self.extract_picklist_values(field_metadata)
            if picklist_values:
                enriched_field['picklist_values'] = picklist_values
                self.enrichment_stats['picklists_added'] += 1
        
        # Default value
        if field_metadata.get('defaultValue'):
            enriched_field['default_value'] = field_metadata['defaultValue']
        
        # Formula
        if field_metadata.get('calculated') and field_metadata.get('calculatedFormula'):
            enriched_field['formula'] = field_metadata['calculatedFormula']
            self.enrichment_stats['formulas_added'] += 1
        
        # Field constraints
        if field_metadata.get('nillable') is False:
            enriched_field['required'] = True
        
        if field_metadata.get('unique'):
            enriched_field['unique'] = True
        
        if field_metadata.get('externalId'):
            enriched_field['external_id'] = True
        
        # Lookup relationship
        if field_type == 'reference':
            reference_to = field_metadata.get('referenceTo', [])
            if reference_to:
                enriched_field['reference_to'] = reference_to[0] if len(reference_to) == 1 else reference_to
        
        # Field dependencies (controlling/dependent picklists)
        if field_metadata.get('controllerName'):
            enriched_field['controlling_field'] = field_metadata['controllerName']
        
        if field_metadata.get('dependentPicklist'):
            enriched_field['is_dependent_picklist'] = True
        
        # Field length
        if field_metadata.get('length'):
            enriched_field['length'] = field_metadata['length']
        
        # Precision and scale (for numbers)
        if field_metadata.get('precision'):
            enriched_field['precision'] = field_metadata['precision']
        if field_metadata.get('scale'):
            enriched_field['scale'] = field_metadata['scale']
        
        # Help text
        if field_metadata.get('inlineHelpText'):
            enriched_field['help_text'] = field_metadata['inlineHelpText']
        
        # Description
        if field_metadata.get('label'):
            enriched_field['label'] = field_metadata['label']
        
        return enriched_field
    
    def enrich_object_schema(self, object_name: str, dry_run: bool = False) -> bool:
        """
        Enrich a single object's schema files with metadata from org.
        
        Creates/updates three files:
        - schema.yaml (core structure)
        - picklists.yaml (picklist values)
        - formulas.yaml (formula definitions)
        
        Returns True if successful, False otherwise.
        """
        # Check if object folder exists (new structure)
        obj_folder = self.schema_dir / object_name
        schema_file = obj_folder / 'schema.yaml'
        
        # Also check for legacy single-file structure
        legacy_file = self.schema_dir / f"{object_name}.yaml"
        
        if not schema_file.exists() and not legacy_file.exists():
            self.enrichment_stats['errors'].append(f"{object_name}: Schema file not found")
            return False
        
        # Determine which structure we're working with
        if schema_file.exists():
            # New folder structure
            working_file = schema_file
            is_new_structure = True
        else:
            # Legacy single file
            working_file = legacy_file
            is_new_structure = False
        
        # Get metadata from Salesforce
        print(f"📡 Retrieving metadata for {object_name}...")
        org_metadata = self.get_object_metadata(object_name)
        
        if not org_metadata:
            return False
        
        # Load existing schema
        with open(working_file, 'r', encoding='utf-8') as f:
            schema = yaml.safe_load(f)
        
        # Create field lookup map from org metadata
        org_fields = {f['name']: f for f in org_metadata.get('fields', [])}
        
        # Separate enriched data into categories
        enriched_fields = []
        picklists_data = {}
        formulas_data = {}
        enriched_count = 0
        
        for field in schema.get('object', {}).get('fields', []):
            field_name = field.get('api_name')
            
            if field_name in org_fields:
                org_field = org_fields[field_name]
                
                # Extract picklist values
                if org_field.get('type') in ['picklist', 'multipicklist']:
                    picklist_values = self.extract_picklist_values(org_field)
                    if picklist_values:
                        picklists_data[field_name] = picklist_values
                        self.enrichment_stats['picklists_added'] += 1
                        # Don't add to field if new structure
                        if not is_new_structure:
                            field['picklist_values'] = picklist_values
                        enriched_count += 1
                
                # Extract formula
                if org_field.get('calculated') and org_field.get('calculatedFormula'):
                    formula = org_field['calculatedFormula']
                    formulas_data[field_name] = formula
                    self.enrichment_stats['formulas_added'] += 1
                    # Don't add to field if new structure
                    if not is_new_structure:
                        field['formula'] = formula
                    enriched_count += 1
                
                # Add other enrichment data (not picklists/formulas)
                enriched_data = self._extract_non_picklist_formula_metadata(org_field)
                for key, value in enriched_data.items():
                    if key not in field or not field[key]:
                        field[key] = value
                        enriched_count += 1
            
            enriched_fields.append(field)
        
        # Update schema object with enriched fields
        schema['object']['fields'] = enriched_fields
        
        self.enrichment_stats['fields_enriched'] += enriched_count
        
        if dry_run:
            print(f"  [DRY RUN] Would enrich {enriched_count} fields in {object_name}")
            if picklists_data:
                print(f"  [DRY RUN] Would create picklists.yaml with {len(picklists_data)} picklists")
            if formulas_data:
                print(f"  [DRY RUN] Would create formulas.yaml with {len(formulas_data)} formulas")
            return True
        
        if is_new_structure:
            # Write to separate files (new structure)
            
            # 1. Write schema file (without picklist values and formulas)
            with open(schema_file, 'w', encoding='utf-8') as f:
                # Preserve metadata
                if 'metadata' not in schema:
                    schema['metadata'] = {}
                schema['metadata']['enriched_date'] = datetime.now().isoformat()
                schema['metadata']['has_picklists'] = len(picklists_data) > 0
                schema['metadata']['has_formulas'] = len(formulas_data) > 0
                
                yaml.dump(schema, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            
            # 2. Write picklists file if we have picklists
            if picklists_data:
                picklists_file = obj_folder / 'picklists.yaml'
                picklists_content = {
                    'picklists': picklists_data,
                    'metadata': {
                        'object': object_name,
                        'generated_date': datetime.now().isoformat(),
                        'picklist_count': len(picklists_data),
                        'note': 'Only ACTIVE picklist values are included'
                    }
                }
                with open(picklists_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Picklist Values for {object_name}\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Total Picklist Fields: {len(picklists_data)}\n")
                    f.write("#\n")
                    f.write("# IMPORTANT: Only ACTIVE picklist values are shown.\n")
                    f.write("# Inactive values are excluded to prevent invalid data in code.\n")
                    f.write("#\n\n")
                    yaml.dump(picklists_content, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
                self.enrichment_stats['picklist_files_created'] += 1
            
            # 3. Write formulas file if we have formulas
            if formulas_data:
                formulas_file = obj_folder / 'formulas.yaml'
                formulas_content = {
                    'formulas': formulas_data,
                    'metadata': {
                        'object': object_name,
                        'generated_date': datetime.now().isoformat(),
                        'formula_count': len(formulas_data)
                    }
                }
                with open(formulas_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Formula Definitions for {object_name}\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Total Formula Fields: {len(formulas_data)}\n")
                    f.write("#\n\n")
                    yaml.dump(formulas_content, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
                self.enrichment_stats['formula_files_created'] += 1
            
            print(f"  ✅ Enriched {object_name}: {enriched_count} fields, {len(picklists_data)} picklists, {len(formulas_data)} formulas")
        else:
            # Write back to single file (legacy structure)
            with open(working_file, 'w', encoding='utf-8') as f:
                yaml.dump(schema, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            
            print(f"  ✅ Enriched {enriched_count} fields in {object_name} (legacy structure)")
        
        self.enrichment_stats['objects_processed'] += 1
        
        return True
    
    def enrich_all_objects(self, object_names: Optional[List[str]] = None, dry_run: bool = False):
        """
        Enrich all objects in schema directory or specific list of objects.
        Works with both new folder structure and legacy single-file structure.
        """
        if object_names:
            objects_to_process = object_names
        else:
            # Get all objects - check for both folder structure and legacy files
            objects_to_process = []
            
            # Check for folder structure (new)
            if self.schema_dir.exists():
                for item in self.schema_dir.iterdir():
                    if item.is_dir() and not item.name.startswith('_'):
                        # It's an object folder
                        objects_to_process.append(item.name)
                    elif item.is_file() and item.suffix == '.yaml' and not item.name.startswith('_'):
                        # Legacy single file (remove .yaml extension)
                        objects_to_process.append(item.stem)
            
            # Remove duplicates
            objects_to_process = list(set(objects_to_process))
        
        print(f"\n🚀 Enriching {len(objects_to_process)} objects...")
        print(f"   Org: {self.org_alias}")
        print(f"   Schema Dir: {self.schema_dir}")
        if dry_run:
            print("   Mode: DRY RUN (no files will be modified)\n")
        else:
            print("   Mode: WRITE (files will be updated)\n")
        
        for obj_name in objects_to_process:
            self.enrich_object_schema(obj_name, dry_run)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print enrichment summary statistics."""
        print("\n" + "="*60)
        print("📊 ENRICHMENT SUMMARY")
        print("="*60)
        print(f"Objects Processed:    {self.enrichment_stats['objects_processed']}")
        print(f"Fields Enriched:      {self.enrichment_stats['fields_enriched']}")
        print(f"Picklists Added:      {self.enrichment_stats['picklists_added']}")
        print(f"Formulas Added:       {self.enrichment_stats['formulas_added']}")
        print(f"Picklist Files:       {self.enrichment_stats['picklist_files_created']}")
        print(f"Formula Files:        {self.enrichment_stats['formula_files_created']}")
        print(f"Errors:               {len(self.enrichment_stats['errors'])}")
        
        if self.enrichment_stats['errors']:
            print("\n⚠️  ERRORS:")
            for error in self.enrichment_stats['errors'][:10]:  # Show first 10
                print(f"   - {error}")
            if len(self.enrichment_stats['errors']) > 10:
                print(f"   ... and {len(self.enrichment_stats['errors']) - 10} more")
        
        print("="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='Enrich Salesforce schema YAML files with picklist values and metadata',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Enrich all objects (auto-detects org)
  python/python3 enrich_schema_with_picklists.py

  # Enrich all objects with explicit org
  python/python3 enrich_schema_with_picklists.py --org IBXDev_Maaz

  # Enrich specific objects
  python/python3 enrich_schema_with_picklists.py --objects Account,HealthcareProviderNpi

  # Dry run to see what would change
  python/python3 enrich_schema_with_picklists.py --dry-run

SF CLI Commands Used:
  sf sobject describe --sobject <ObjectName> --target-org <org> --json
  
Note: Org alias is auto-detected from .sf/config.json (or .sfdx/sfdx-config.json).
      Use --org to override auto-detection.
        """
    )
    
    parser.add_argument(
        '--org', '-o',
        required=False,
        help='Salesforce org alias (e.g., IBXDev_Maaz). If not provided, auto-detects from .sf/config.json'
    )
    
    parser.add_argument(
        '--objects',
        help='Comma-separated list of object names to enrich (default: all objects in schema directory)'
    )
    
    parser.add_argument(
        '--schema-dir',
        default='config/schema/objects',
        help='Path to schema objects directory (default: config/schema/objects)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without modifying files'
    )
    
    args = parser.parse_args()
    
    # Parse objects list
    objects_to_enrich = None
    if args.objects:
        objects_to_enrich = [obj.strip() for obj in args.objects.split(',')]
    
    # Create enricher and run
    enricher = SchemaEnricher(args.org, args.schema_dir)
    enricher.enrich_all_objects(objects_to_enrich, args.dry_run)


if __name__ == '__main__':
    main()
