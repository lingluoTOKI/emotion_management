#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to verify requirements.txt encoding
"""

import os
import sys

def test_file_encoding(file_path):
    """Test if a file can be read without encoding issues"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"✅ Successfully read {file_path}")
            print(f"   File size: {len(content)} characters")
            print(f"   First few lines:")
            for i, line in enumerate(content.split('\n')[:5]):
                if line.strip():
                    print(f"   {i+1}: {line}")
            return True
    except UnicodeDecodeError as e:
        print(f"❌ UnicodeDecodeError reading {file_path}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return False

def main():
    """Main test function"""
    print("Testing file encoding...")
    print("=" * 50)
    
    # Test main requirements file
    main_req = "backend/requirements.txt"
    if os.path.exists(main_req):
        test_file_encoding(main_req)
    else:
        print(f"❌ File not found: {main_req}")
    
    print()
    
    # Test minimal requirements file
    min_req = "backend/requirements-minimal.txt"
    if os.path.exists(min_req):
        test_file_encoding(min_req)
    else:
        print(f"❌ File not found: {min_req}")
    
    print()
    print("=" * 50)
    print("Encoding test completed!")

if __name__ == "__main__":
    main()

