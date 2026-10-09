import re

def normalize_tag(tag: str) -> str:
    """
    Normalizes engineering tags into a canonical uppercase format.
    
    Examples:
        "CB-43"   -> "CB43"
        "CB 43"   -> "CB43"
        "cb43"    -> "CB43"
        "1CBP-03" -> "1CBP03"
        "PS-12"   -> "PS12"
        "X-3"     -> "X3"
    """
    if not tag:
        return ""
    
    cleaned = tag.strip().upper()
    
    # Standard engineering prefix patterns: remove hyphens/spaces between prefix and numbers
    # Pattern: Letters/Digits followed by hyphen or space followed by numbers
    normalized = re.sub(r'([A-Z0-9]+)[\s\-]+(\d+)', r'\1\2', cleaned)
    
    return normalized

def infer_component_type(tag: str) -> str:
    """
    Infers component type classification from tag prefix.
    """
    norm = normalize_tag(tag)
    if re.match(r'^PS\d+', norm):
        return "POWER_SUPPLY"
    elif re.match(r'^CB\d+', norm):
        return "CIRCUIT_BREAKER"
    elif re.match(r'^MCB\d+', norm):
        return "CIRCUIT_BREAKER"
    elif re.match(r'^TB\d+', norm) or re.match(r'^X\d+', norm):
        return "TERMINAL_BLOCK"
    elif re.match(r'^\d*CBP\d+', norm):
        return "COMPONENT_LABEL"
    elif re.match(r'^PLC\d+', norm) or re.match(r'^CPU\d+', norm):
        return "CONTROLLER"
    elif re.match(r'^KM\d+', norm) or re.match(r'^K\d+', norm):
        return "CONTACTOR"
    return "GENERIC_COMPONENT"
