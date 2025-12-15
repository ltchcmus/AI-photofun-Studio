#!/usr/bin/env python3
"""
Helper script to add gallery save logic to all feature status views
"""

import os
import re

# Feature configurations
FEATURES = {
    'upscale': {
        'intent': 'upscale',
        'metadata_fields': ['upscale_factor', 'flavor']
    },
    'reimagine': {
        'intent': 'reimagine',
        'metadata_fields': ['model']
    },
    'relight': {
        'intent': 'relight',
        'metadata_fields': ['model']
    },
    'image_expand': {
        'intent': 'image_expand',
        'metadata_fields': ['aspect_ratio']
    },
    'style_transfer': {
        'intent': 'style_transfer',
        'metadata_fields': ['style']
    }
}

BASE_DIR = '/home/imdeeslt/Study/HCMUS/3.1Term_25-26/Intro2SE/Projects/AI-photofun-Studio/src/backend/backendAI/apps'

def add_imports(file_path):
    """Add required imports if not present"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    imports_to_add = []
    if 'from apps.image_gallery.services import image_gallery_service' not in content:
        imports_to_add.append('from apps.image_gallery.services import image_gallery_service')
    
    if imports_to_add:
        # Find last import line
        import_lines = [i for i, line in enumerate(content.split('\n')) if line.startswith('import ') or line.startswith('from ')]
        if import_lines:
            lines = content.split('\n')
            insert_pos = max(import_lines) + 1
            for imp in imports_to_add:
                lines.insert(insert_pos, imp)
            content = '\n'.join(lines)
            
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"✓ Added imports to {file_path}")

def add_gallery_save_to_status_view(file_path, feature_name):
    """Add gallery save logic to status view"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    intent = FEATURES[feature_name]['intent']
    metadata_fields = FEATURES[feature_name]['metadata_fields']
    
    # Find the status view get method
    pattern = r'(def get\(self, request, task_id\):.*?)(return APIResponse\.success\()'
    
    # Gallery save code template
    gallery_code = f'''
            # If completed and user_id provided, save to gallery
            user_id = request.query_params.get('user_id')
            if result.get('status') == 'COMPLETED' and result.get('uploaded_urls') and user_id:
                try:
                    for image_url in result['uploaded_urls']:
                        metadata = {{'task_id': task_id}}
                        {" ".join([f"if result.get('{field}'): metadata['{field}'] = result.get('{field}')" for field in metadata_fields])}
                        image_gallery_service.save_generated_image(
                            user_id=user_id,
                            image_url=image_url,
                            prompt=result.get('prompt', 'Processed image'),
                            intent='{intent}',
                            metadata=metadata
                        )
                    logger.info(f"[DirectAPI] Saved {{len(result['uploaded_urls'])}} images to gallery for user {{user_id}}")
                except Exception as e:
                    logger.warning(f"[DirectAPI] Failed to save to gallery: {{str(e)}}")
            
            '''
    
    def replacer(match):
        return match.group(1) + gallery_code + match.group(2)
    
    new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"✓ Added gallery save to {file_path}")
        return True
    else:
        print(f"⚠ Could not find pattern in {file_path}")
        return False

def main():
    print("🔧 Adding gallery save logic to all feature views...")
    print()
    
    for feature_name in FEATURES:
        file_path = os.path.join(BASE_DIR, feature_name, 'views.py')
        if os.path.exists(file_path):
            print(f"Processing {feature_name}...")
            add_imports(file_path)
            add_gallery_save_to_status_view(file_path, feature_name)
            print()
    
    print("✅ Done!")

if __name__ == '__main__':
    main()
