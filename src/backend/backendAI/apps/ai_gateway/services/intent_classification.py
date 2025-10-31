"""
Intent Classification Service

Phân loại ý định của user: muốn sinh ảnh, edit ảnh, face swap, etc.
"""
import logging
from typing import Dict, Tuple, List
import re

logger = logging.getLogger(__name__)


class IntentClassificationService:
    """Service để classify user intent từ message"""
    
    def __init__(self):
        # Keywords for different intents
        self.intent_keywords = {
            'image_generation': [
                'generate', 'create', 'make', 'draw', 'paint', 'design',
                'sinh', 'tạo', 'vẽ', 'thiết kế',
                'image of', 'picture of', 'photo of',
                'ảnh', 'hình',
            ],
            'face_swap': [
                'swap face', 'change face', 'replace face', 'face swap',
                'đổi mặt', 'thay mặt', 'hoán đổi khuôn mặt',
            ],
            'background_removal': [
                'remove background', 'delete background', 'erase background',
                'transparent background', 'cut out',
                'xóa phông', 'xóa nền', 'cắt nền',
            ],
            'image_edit': [
                'edit', 'modify', 'change', 'adjust', 'enhance',
                'chỉnh sửa', 'sửa', 'điều chỉnh', 'thay đổi',
                'resize', 'crop', 'rotate', 'filter',
            ],
            'style_transfer': [
                'style', 'artistic', 'painting style', 'art style',
                'phong cách', 'nghệ thuật',
            ],
        }
    
    def classify_intent(
        self,
        message: str,
        has_image: bool = False,
        context: Dict = None
    ) -> Tuple[str, float]:
        """
        Classify user intent from message
        
        Args:
            message: User message text
            has_image: Whether user attached an image
            context: Previous conversation context
            
        Returns:
            tuple: (intent_type, confidence_score)
        """
        message_lower = message.lower()
        
        # Calculate scores for each intent
        intent_scores = {}
        
        for intent, keywords in self.intent_keywords.items():
            score = self._calculate_intent_score(message_lower, keywords)
            intent_scores[intent] = score
        
        # Adjust scores based on context
        if has_image:
            # User uploaded image, likely wants editing
            intent_scores['image_edit'] *= 2
            intent_scores['face_swap'] *= 1.5
            intent_scores['background_removal'] *= 1.5
            intent_scores['image_generation'] *= 0.5
        else:
            # No image, likely wants generation
            intent_scores['image_generation'] *= 1.5
        
        # Get top intent
        if not intent_scores or max(intent_scores.values()) == 0:
            return 'general', 0.3
        
        top_intent = max(intent_scores, key=intent_scores.get)
        confidence = min(intent_scores[top_intent], 1.0)
        
        logger.info(f"Classified intent: {top_intent} (confidence: {confidence:.2f})")
        logger.debug(f"All scores: {intent_scores}")
        
        return top_intent, confidence
    
    def _calculate_intent_score(self, message: str, keywords: List[str]) -> float:
        """Calculate score for a specific intent based on keywords"""
        score = 0.0
        
        for keyword in keywords:
            if keyword in message:
                # Exact match
                score += 0.3
                
                # Word boundary match (more confident)
                if re.search(r'\b' + re.escape(keyword) + r'\b', message):
                    score += 0.2
        
        return min(score, 1.0)
    
    def extract_parameters(self, message: str, intent: str) -> Dict:
        """
        Extract parameters from message based on intent
        
        For example:
        - Image dimensions (512x512, 1024x1024)
        - Style preferences (realistic, anime, oil painting)
        - Quality settings (high quality, detailed)
        """
        params = {}
        
        # Extract dimensions
        dimension_pattern = r'(\d{3,4})\s*[x×]\s*(\d{3,4})'
        match = re.search(dimension_pattern, message)
        if match:
            params['width'] = int(match.group(1))
            params['height'] = int(match.group(2))
        
        # Extract style keywords
        style_keywords = {
            'realistic': 'realistic',
            'anime': 'anime',
            'cartoon': 'cartoon',
            'oil painting': 'oil_painting',
            'watercolor': 'watercolor',
            'digital art': 'digital_art',
        }
        
        for keyword, style in style_keywords.items():
            if keyword in message.lower():
                params['style'] = style
                break
        
        # Extract quality preference
        if any(word in message.lower() for word in ['high quality', 'detailed', 'professional']):
            params['quality'] = 'high'
        
        return params
