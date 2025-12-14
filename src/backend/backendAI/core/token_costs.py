"""
Token costs for AI features
Centralized pricing configuration
"""

# Token costs per feature (adjust according to your pricing model)
TOKEN_COSTS = {
    'image_generation': 10,
    'upscale': 5,
    'remove_background': 3,
    'relight': 8,
    'style_transfer': 12,
    'reimagine': 15,
    'image_expand': 10,
}

# Bulk operation discounts
BULK_DISCOUNT_THRESHOLDS = {
    5: 0.95,   # 5% off for 5+ images
    10: 0.90,  # 10% off for 10+ images
    20: 0.85,  # 15% off for 20+ images
}
