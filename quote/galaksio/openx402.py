from galaksio.x402_client import get_x402_quote
from galaksio.constants import constants
import json
import base64

OPENX402_BASE_URL = constants.get("OPENX402_BASE_URL")


def detect_json_file(file_name: str = None, file_content: str = None) -> bool:
    """
    Detect if a file is a JSON file based on extension or content

    Args:
        file_name: Optional file name to check extension
        file_content: Optional file content to validate as JSON

    Returns:
        bool: True if file is JSON, False otherwise
    """
    # Check file extension
    if file_name and file_name.lower().endswith('.json'):
        return True

    # Try to parse content as JSON
    if file_content:
        try:
            # Try to decode base64 first
            try:
                decoded = base64.b64decode(file_content).decode('utf-8')
            except:
                decoded = file_content

            # Try to parse as JSON
            json.loads(decoded)
            return True
        except:
            return False

    return False


def get_openx402_storage_quote(
    file_size_bytes: int = 1_000_000,
    file_name: str = None,
    file_content: str = None
) -> dict:
    """
    Get quote for IPFS storage via x402
    Automatically detects JSON files and uses appropriate endpoint

    Args:
        file_size_bytes: Size of file to store
        file_name: Optional file name for JSON detection
        file_content: Optional file content for JSON validation

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions
    """
    # Detect if this is a JSON file
    is_json = detect_json_file(file_name, file_content)

    if is_json:
        # Use pin/json endpoint for JSON files (0.01 USDC)
        url = f"{OPENX402_BASE_URL}pin/json"

        # Create minimal JSON payload to trigger 402 response
        payload = {
            "name": "Quote Request",
            "fileSize": file_size_bytes
        }

        quote = get_x402_quote(url, payload, method='POST')

        if quote:
            quote['provider'] = 'openx402'
            quote['file_size_bytes'] = file_size_bytes
            quote['file_size_mb'] = round(file_size_bytes / 1_000_000, 2)
            quote['endpoint'] = '/pin/json'
            quote['file_type'] = 'json'
            # JSON endpoint has fixed pricing of 0.01 USDC
            if 'price_usd' not in quote:
                quote['price_usd'] = 0.01
            return quote
    else:
        # Use pin/file endpoint for direct IPFS pinning
        url = f"{OPENX402_BASE_URL}pin/file"

        # Create minimal payload to trigger 402 response
        payload = {
            "fileSize": file_size_bytes,
        }

        quote = get_x402_quote(url, payload, method='POST')

        if quote:
            quote['provider'] = 'openx402'
            quote['file_size_bytes'] = file_size_bytes
            quote['file_size_mb'] = round(file_size_bytes / 1_000_000, 2)
            quote['endpoint'] = '/pin/file'
            quote['file_type'] = 'binary'
            return quote

    return {"error": "Failed to get quote from OpenX402"}
