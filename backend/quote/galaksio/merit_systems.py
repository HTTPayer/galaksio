from galaksio.x402_client import get_x402_quote
from galaksio.constants import constants
from typing import Dict

MERIT_SYSTEMS_URL = constants.get("MERIT_SYSTEMS_BASE_URL")


def get_merit_systems_quote(code_size_bytes: int = 1000, language: str = "python") -> Dict:
    """
    Get quote for E2B code execution via x402

    Args:
        code_size_bytes: Size of code to execute
        language: Programming language (python, javascript, etc.)

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions
    """
    url = MERIT_SYSTEMS_URL

    # Create minimal payload to trigger 402 response
    payload = {
        "snippet": "# test code for pricing",
        "language": language
    }

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'merit-systems'
        quote['code_size_bytes'] = code_size_bytes
        quote['language'] = language
        quote['operation'] = 'execute'
        return quote

    return {"error": "Failed to get quote from Merit Systems"}
