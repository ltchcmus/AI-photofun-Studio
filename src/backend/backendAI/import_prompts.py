#!/usr/bin/env python
"""
Script to import prompts from prompts.txt into MongoDB for rec_prompt service.

Usage:
    # From inside Docker container:
    docker exec -it backendai_api python import_prompts.py

    # Or run locally (if MongoDB is accessible at localhost:27017):
    python import_prompts.py
"""

import os
import sys
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')

import django
django.setup()

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError


def get_mongo_client():
    """Get MongoDB client from environment or default."""
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    return MongoClient(mongo_uri)


def import_prompts(file_path: str = 'prompts.txt', db_name: str = None):
    """Import prompts from file into MongoDB."""
    
    # Get database name from settings
    if db_name is None:
        db_name = os.getenv('MONGO_DB_NAME', 'ai_photofun_studio')
    
    print(f"📂 Reading prompts from: {file_path}")
    
    # Read prompts from file
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    
    print(f"📝 Found {len(lines)} prompts in file")
    
    # Connect to MongoDB
    print(f"🔗 Connecting to MongoDB...")
    client = get_mongo_client()
    db = client[db_name]
    
    # Use same collection names as the service (apps/rec_prompt/models.py)
    prompts_collection = db['rec_prompts']
    counters_collection = db['rec_counters']
    
    # Create indexes
    prompts_collection.create_index('prompt_id', unique=True)
    prompts_collection.create_index('text', unique=True)
    
    # Get current count
    existing_count = prompts_collection.count_documents({})
    print(f"📊 Existing prompts in database: {existing_count}")
    
    # Get or initialize counter
    counter_doc = counters_collection.find_one({'_id': 'rec_prompts'})
    if counter_doc is None:
        current_id = 0
        counters_collection.insert_one({'_id': 'rec_prompts', 'seq': 0})
    else:
        current_id = int(counter_doc.get('seq', 0))
    
    print(f"📊 Current counter seq: {current_id}")
    
    # Import prompts
    imported = 0
    skipped = 0
    
    for i, text in enumerate(lines):
        text = ' '.join(text.split())  # Normalize whitespace
        if not text:
            continue
        
        # Check if prompt already exists
        existing = prompts_collection.find_one({'text': text})
        if existing:
            skipped += 1
            continue
        
        # Increment counter
        current_id += 1
        
        # Insert prompt
        try:
            prompts_collection.insert_one({
                'prompt_id': current_id,
                'text': text,
                'popularity': 0,
                'created_at': time.time()
            })
            imported += 1
            
            if imported % 100 == 0:
                print(f"  ✅ Imported {imported} prompts...")
                
        except DuplicateKeyError:
            skipped += 1
            current_id -= 1  # Revert counter since insert failed
    
    # Update counter
    counters_collection.update_one(
        {'_id': 'rec_prompts'},
        {'$set': {'seq': current_id}},
        upsert=True
    )
    
    print(f"\n✅ Import complete!")
    print(f"   - Imported: {imported} prompts")
    print(f"   - Skipped (already exists): {skipped} prompts")
    print(f"   - Total in database: {prompts_collection.count_documents({})}")
    
    return True


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Import prompts into MongoDB')
    parser.add_argument('--file', type=str, default='prompts.txt',
                        help='Path to prompts.txt file')
    parser.add_argument('--db', type=str, default=None,
                        help='MongoDB database name (default: from env)')
    
    args = parser.parse_args()
    
    success = import_prompts(args.file, args.db)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
