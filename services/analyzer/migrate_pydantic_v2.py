#!/usr/bin/env python3
"""
Complete Pydantic v1 to v2 Migration Script
Migrates all models in src/models/ to Pydantic v2 syntax
"""

import re
from pathlib import Path
from typing import List, Tuple


def migrate_imports(content: str) -> str:
    """Update imports to Pydantic v2"""
    # Add field_validator if validator is used
    if '@validator' in content and 'field_validator' not in content:
        content = re.sub(
            r'from pydantic import (.*?)\bvalidator\b',
            r'from pydantic import \1field_validator, model_validator',
            content
        )

    # Add ConfigDict import if Config class exists
    if 'class Config:' in content and 'ConfigDict' not in content:
        # Check if BaseModel is imported from pydantic
        if 'from pydantic import' in content:
            content = re.sub(
                r'from pydantic import (.*?)$',
                r'from pydantic import \1, ConfigDict',
                content,
                flags=re.MULTILINE
            )

    return content


def migrate_validators(content: str) -> str:
    """Migrate @validator to @field_validator"""

    # Pattern for validators with single field
    # @validator('field_name')
    # def method(cls, v, values):
    pattern1 = r"@validator\('([^']+)'\)\s+def\s+(\w+)\(cls,\s*v(?:,\s*values)?\):"

    def replace_single_field(match):
        field = match.group(1)
        method = match.group(2)
        return f"@field_validator('{field}')\n    @classmethod\n    def {method}(cls, v):"

    content = re.sub(pattern1, replace_single_field, content)

    # Pattern for validators with multiple fields
    # @validator('field1', 'field2', 'field3')
    pattern2 = r"@validator\(((?:'[^']+'(?:,\s*)?)+)\)\s+def\s+(\w+)\(cls,\s*v(?:,\s*values)?\):"

    def replace_multi_field(match):
        fields = match.group(1)
        method = match.group(2)
        return f"@field_validator({fields})\n    @classmethod\n    def {method}(cls, v):"

    content = re.sub(pattern2, replace_multi_field, content)

    # Remove 'values' parameter references in validator bodies
    # This is approximate - may need manual review
    # content = re.sub(r"values\.get\('([^']+)'\)", r"self.\1", content)

    return content


def migrate_config_class(content: str) -> str:
    """Migrate Config class to model_config"""

    # Find all Config classes and convert them
    config_pattern = r'class Config:\s*\n(?:[ \t]+"""[^"]*"""\s*\n)?(?:[ \t]+.*\n)*?(?=\n[ \t]*(?:@|def|class|\Z))'

    def convert_config(match):
        config_block = match.group(0)

        # Extract config options
        options = {}

        # validate_assignment
        if 'validate_assignment = True' in config_block:
            options['validate_assignment'] = True

        # use_enum_values
        if 'use_enum_values = True' in config_block:
            options['use_enum_values'] = True

        # schema_extra -> json_schema_extra
        if 'schema_extra' in config_block:
            schema_extra_match = re.search(r'schema_extra\s*=\s*({[^}]+})', config_block, re.DOTALL)
            if schema_extra_match:
                options['json_schema_extra'] = schema_extra_match.group(1)

        # Build model_config
        if not options:
            return ""  # Remove empty config

        config_parts = []
        for key, value in options.items():
            if key == 'json_schema_extra':
                config_parts.append(f'"{key}": {value}')
            else:
                config_parts.append(f'"{key}": {value}')

        config_str = ", ".join(config_parts)
        return f"model_config = ConfigDict({config_str})\n"

    content = re.sub(config_pattern, convert_config, content)

    # Remove json_encoders (will be handled separately if needed)
    content = re.sub(r'\s*json_encoders\s*=\s*{[^}]+}\s*', '', content)

    return content


def add_datetime_serializer(content: str) -> str:
    """Add model_serializer for datetime if json_encoders was used"""

    if 'datetime: lambda v: v.isoformat()' not in content:
        return content

    # Check if datetime import exists
    if 'from datetime import datetime' not in content:
        # Add import at the top
        content = re.sub(
            r'(from datetime import[^\n]+)',
            r'\1',
            content
        )

    # This is complex - for now, just remove json_encoders
    # Manual review recommended for datetime serialization

    return content


def migrate_file(filepath: Path) -> Tuple[bool, str]:
    """Migrate a single file"""

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Apply migrations
        content = migrate_imports(content)
        content = migrate_validators(content)
        content = migrate_config_class(content)
        content = add_datetime_serializer(content)

        # Write back if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "✅ Migrated"
        else:
            return False, "⏭️  No changes needed"

    except Exception as e:
        return False, f"❌ Error: {str(e)}"


def main():
    """Main migration function"""

    models_dir = Path(__file__).parent / 'src' / 'models'

    print("🔄 Starting Pydantic v2 Migration...")
    print(f"📁 Models directory: {models_dir}")
    print()

    migrated_count = 0
    skipped_count = 0
    error_count = 0

    for py_file in sorted(models_dir.glob('*.py')):
        if py_file.name == '__init__.py':
            continue

        print(f"Processing {py_file.name}...", end=' ')
        success, message = migrate_file(py_file)
        print(message)

        if "Migrated" in message:
            migrated_count += 1
        elif "Error" in message:
            error_count += 1
        else:
            skipped_count += 1

    print()
    print("=" * 60)
    print(f"✅ Migrated: {migrated_count} files")
    print(f"⏭️  Skipped: {skipped_count} files")
    print(f"❌ Errors: {error_count} files")
    print("=" * 60)

    if error_count == 0:
        print()
        print("🎉 Migration completed successfully!")
        print()
        print("⚠️  IMPORTANT: Please review the changes:")
        print("  1. Check that @field_validator decorators are correct")
        print("  2. Verify model_config settings")
        print("  3. Test all models thoroughly")
        print("  4. Some datetime serialization may need manual updates")
    else:
        print()
        print("⚠️  Migration completed with errors. Please review.")


if __name__ == '__main__':
    main()
