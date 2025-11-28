"""
Prompt Refinement Service - Core Logic (NO DATABASE)

Pure stateless service - only processes requests and returns responses
"""
import logging
import time
import re
from typing import Dict, List

logger = logging.getLogger(__name__)


class PromptRefinementService:
    """Stateless service để refine/improve user prompts"""
    
    def __init__(self):
        # Quality enhancement keywords
        self.quality_keywords = [
            'high quality', 'detailed', 'masterpiece', '8k', '4k',
            'professional', 'award winning', 'trending on artstation',
            'highly detailed', 'intricate details', 'sharp focus'
        ]
        
        # Style keywords by category
        self.style_keywords = {
            'portrait': ['studio lighting', 'soft focus', 'bokeh', 'professional headshot'],
            'landscape': ['wide angle', 'cinematic composition', 'golden hour', 'panoramic'],
            'fantasy': ['magical', 'ethereal', 'mystical', 'enchanted', 'dreamlike'],
            'realistic': ['photorealistic', 'lifelike', 'natural lighting', 'authentic'],
            'artistic': ['painterly', 'expressive', 'stylized', 'artistic interpretation'],
        }
        
        # Default negative prompts
        self.default_negative = [
            'blurry', 'low quality', 'distorted', 'ugly', 'bad anatomy',
            'watermark', 'signature', 'text', 'logo', 'cropped', 'out of frame'
        ]
    
    def refine_prompt(
        self,
        original_prompt: str,
        context: Dict = None,
        method: str = 'auto'
    ) -> Dict:
        """
        Refine user prompt for better image generation
        
        Args:
            original_prompt: Original user input
            context: Additional context (style, quality, previous messages)
            method: 'rule_based', 'llm', or 'auto'
            
        Returns:
            dict: {
                'refined_prompt': str,
                'confidence_score': float,
                'method_used': str,
                'processing_time': float,
                'suggestions': List[str],
                'metadata': dict
            }
        """
        start_time = time.time()
        
        try:
            # Always use rule-based for now (LLM integration later)
            method_used = 'rule_based'
            
            # Refine the prompt
            refined = self._rule_based_refinement(original_prompt, context)
            
            # Calculate confidence
            confidence = self._calculate_confidence(original_prompt, refined)
            
            # Generate suggestions
            suggestions = self._generate_suggestions(original_prompt, refined, context)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            result = {
                'original_prompt': original_prompt,
                'refined_prompt': refined,
                'confidence_score': confidence,
                'method_used': method_used,
                'processing_time': processing_time,
                'suggestions': suggestions,
                'metadata': {
                    'context': context or {},
                    'original_length': len(original_prompt),
                    'refined_length': len(refined),
                }
            }
            
            logger.info(
                f"Prompt refined in {processing_time:.2f}s - "
                f"Method: {method_used}, Confidence: {confidence:.2f}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Prompt refinement error: {str(e)}", exc_info=True)
            return {
                'original_prompt': original_prompt,
                'refined_prompt': original_prompt,
                'confidence_score': 0.5,
                'method_used': 'fallback',
                'processing_time': time.time() - start_time,
                'suggestions': [],
                'metadata': {'error': str(e)}
            }
    
    def _rule_based_refinement(self, prompt: str, context: Dict = None) -> str:
        """Rule-based prompt enhancement"""
        refined = prompt.strip()
        
        # Add style keywords if specified
        if context and 'style' in context:
            style = context['style'].lower()
            if style in self.style_keywords:
                style_additions = ', '.join(self.style_keywords[style][:2])
                refined = f"{refined}, {style_additions}"
        
        # Add quality keywords
        if context and context.get('quality') == 'high':
            quality_additions = ', '.join(self.quality_keywords[:3])
            refined = f"{refined}, {quality_additions}"
        
        # Remove duplicate words
        words = refined.split(', ')
        refined = ', '.join(dict.fromkeys(words))
        
        return refined
    
    def _calculate_confidence(self, original: str, refined: str) -> float:
        """Calculate confidence score"""
        # Simple heuristic
        length_increase = len(refined) / max(len(original), 1)
        if length_increase > 1.5:
            return 0.85
        elif length_increase > 1.2:
            return 0.75
        else:
            return 0.6
    
    def _generate_suggestions(self, original: str, refined: str, context: Dict = None) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []
        
        if len(original.split()) < 5:
            suggestions.append("Consider adding more descriptive details")
        
        if context and 'style' not in context:
            suggestions.append("Specify an art style for better results")
        
        if 'quality' not in original.lower():
            suggestions.append("Add quality modifiers like 'high quality' or '8k'")
        
        return suggestions
    
    def validate_prompt(self, prompt: str) -> Dict:
        """
        Validate if a prompt is suitable for image generation
        
        Returns:
            dict: {
                'is_valid': bool,
                'issues': List[str],
                'suggestions': List[str]
            }
        """
        issues = []
        suggestions = []
        
        # Check minimum length
        if len(prompt.strip()) < 3:
            issues.append("Prompt too short (minimum 3 characters)")
        
        # Check maximum length
        if len(prompt) > 500:
            issues.append("Prompt too long (maximum 500 characters)")
        
        # Check for inappropriate content markers
        inappropriate_words = ['nsfw', 'explicit', 'nude', 'naked']
        if any(word in prompt.lower() for word in inappropriate_words):
            issues.append("Prompt contains inappropriate content")
        
        # Generate suggestions
        if len(prompt.split()) < 5:
            suggestions.append("Add more descriptive details")
        
        if ',' not in prompt:
            suggestions.append("Use commas to separate different aspects")
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'suggestions': suggestions
        }
    
    def extract_negative_prompt(self, prompt: str) -> tuple[str, str]:
        """
        Extract negative prompt components
        
        Returns:
            tuple: (positive_prompt, negative_prompt)
        """
        # Extract negative indicators
        negative_patterns = [
            r'NOT\s+(\w+)',
            r'WITHOUT\s+(\w+)',
            r'AVOID\s+(\w+)',
            r'NO\s+(\w+)'
        ]
        
        negative_terms = []
        positive = prompt
        
        for pattern in negative_patterns:
            matches = re.findall(pattern, prompt, re.IGNORECASE)
            negative_terms.extend(matches)
            positive = re.sub(pattern, '', positive, flags=re.IGNORECASE)
        
        # Clean up
        positive = re.sub(r'\s+', ' ', positive).strip()
        negative = ', '.join(set(negative_terms + self.default_negative[:3]))
        
        return positive, negative


# Singleton instance
_service_instance = None

def get_service() -> PromptRefinementService:
    """Get singleton service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = PromptRefinementService()
    return _service_instance
