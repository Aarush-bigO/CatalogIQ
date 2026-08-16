"""Text processing utilities."""

import html
import re
from typing import List


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    
    # Unescape HTML entities
    text = html.unescape(text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    return text.strip()


def truncate_text(text: str, max_length: int = 200, suffix: str = "...") -> str:
    """Truncate text to max length with suffix."""
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)].rsplit(" ", 1)[0] + suffix


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """Extract keywords from text using simple frequency."""
    # Simple keyword extraction - in production use TF-IDF or KeyBERT
    words = re.findall(r'\b[A-Za-z][A-Za-z0-9+\-/]*\b', text.lower())
    
    # Filter common stopwords
    stopwords = {
        "the", "a", "an", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "must", "shall",
        "can", "need", "dare", "ought", "used", "to", "of", "in",
        "for", "on", "with", "at", "by", "from", "as", "into",
        "through", "during", "before", "after", "above", "below",
        "between", "under", "and", "but", "or", "yet", "so",
        "if", "because", "although", "though", "while", "where",
        "when", "that", "which", "who", "whom", "whose", "what",
        "this", "these", "those", "i", "you", "he", "she", "it",
        "we", "they", "me", "him", "her", "us", "them",
    }
    
    filtered = [w for w in words if w not in stopwords and len(w) > 2]
    
    # Count frequency
    from collections import Counter
    freq = Counter(filtered)
    
    return [word for word, _ in freq.most_common(top_n)]


def normalize_sku(sku: str) -> str:
    """Normalize SKU format."""
    if not sku:
        return ""
    # Remove whitespace, convert to uppercase
    sku = re.sub(r'\s+', '', sku).upper()
    # Remove special characters except dash, underscore, dot
    sku = re.sub(r'[^A-Z0-9\-_\.]', '', sku)
    return sku


def split_sentences(text: str) -> List[str]:
    """Split text into sentences."""
    # Simple sentence splitting
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate Jaccard similarity between two texts."""
    set1 = set(text1.lower().split())
    set2 = set(text2.lower().split())
    
    if not set1 or not set2:
        return 0.0
    
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    
    return intersection / union if union > 0 else 0.0
