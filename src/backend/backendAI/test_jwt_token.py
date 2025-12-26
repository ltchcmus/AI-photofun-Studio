#!/usr/bin/env python3
"""
Test JWT Token Decoding
Debug script to check JWT token structure and roles
"""

import jwt
import sys
import json

# JWT config (should match your .env)
SECRET = "lethanhcong.site.nmcnpm"
ALGORITHM = "HS512"
ISSUER = "ThanhCong"
AUDIENCE = "NMCNPM-CLIENT"

def decode_token(token_string):
    """Decode and display JWT token contents"""
    try:
        # Decode without verification first to see structure
        unverified = jwt.decode(token_string, options={"verify_signature": False})
        print("=" * 80)
        print("🔍 UNVERIFIED TOKEN PAYLOAD (for debugging):")
        print("=" * 80)
        print(json.dumps(unverified, indent=2))
        print()
        
        # Now decode with verification
        payload = jwt.decode(
            token_string,
            SECRET,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_iss': True,
                'verify_aud': True,
            }
        )
        
        print("=" * 80)
        print("✅ VERIFIED TOKEN PAYLOAD:")
        print("=" * 80)
        print(json.dumps(payload, indent=2))
        print()
        
        # Extract important fields
        user_id = payload.get('sub')
        scope = payload.get('scope', '')
        token_type = payload.get('type', '')
        
        print("=" * 80)
        print("📊 TOKEN ANALYSIS:")
        print("=" * 80)
        print(f"User ID: {user_id}")
        print(f"Token Type: {token_type}")
        print(f"Scope: {scope}")
        print()
        
        # Parse roles
        permissions = scope.split()
        roles = [p.replace('ROLE_', '') for p in permissions if p.startswith('ROLE_')]
        authorities = [p for p in permissions if not p.startswith('ROLE_')]
        
        print(f"Roles: {roles}")
        print(f"Authorities: {authorities}")
        print()
        
        # Check specific roles
        has_admin = 'ROLE_ADMIN' in permissions
        has_premium = 'ROLE_PREMIUM' in permissions
        has_user = 'ROLE_USER' in permissions
        
        print("=" * 80)
        print("🔐 ROLE CHECKS:")
        print("=" * 80)
        print(f"✓ ADMIN: {has_admin}")
        print(f"✓ PREMIUM: {has_premium}")
        print(f"✓ USER: {has_user}")
        print()
        
        # Check video access
        can_access_video = has_admin or has_premium
        print("=" * 80)
        print("🎬 VIDEO FEATURE ACCESS:")
        print("=" * 80)
        print(f"Can access prompt-to-video: {can_access_video}")
        print(f"Can access image-to-video: {can_access_video}")
        print()
        
        return True
        
    except jwt.ExpiredSignatureError:
        print("❌ ERROR: Token has expired")
        return False
    except jwt.InvalidSignatureError:
        print("❌ ERROR: Invalid token signature")
        print(f"   Check if SECRET matches: '{SECRET}'")
        return False
    except jwt.InvalidIssuerError:
        print("❌ ERROR: Invalid token issuer")
        print(f"   Expected: '{ISSUER}'")
        return False
    except jwt.InvalidAudienceError:
        print("❌ ERROR: Invalid token audience")
        print(f"   Expected: '{AUDIENCE}'")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


if __name__ == "__main__":
    print("🔑 JWT Token Decoder & Role Checker")
    print()
    
    if len(sys.argv) < 2:
        print("Usage: python test_jwt_token.py <YOUR_JWT_TOKEN>")
        print()
        print("Example:")
        print("  python test_jwt_token.py eyJhbGciOiJIUzUxMi...")
        print()
        print("Or paste token when prompted:")
        token = input("Enter JWT token: ").strip()
    else:
        token = sys.argv[1].strip()
    
    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    decode_token(token)
