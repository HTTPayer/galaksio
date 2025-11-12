# Galaksio CLI

Command-line interface for Galaksio multi-cloud orchestration with x402 payment integration.

## Table of Contents
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Interactive Shell](#interactive-shell)
- [Configuration](#configuration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Required
- **Python**: 3.10 or higher
- **pip** or **uv**: Python package manager

### Recommended
- Modern terminal with Unicode support for best visual experience
- Git (for development installation)

### Operating Systems
- Linux (Ubuntu 20.04+, Debian 11+, Fedora, etc.)
- macOS 11+ (Big Sur and later)
- Windows 10/11 (with WSL2 recommended for best experience)

## Installation

### Method 1: Using pip (Recommended)

```bash
# Clone or navigate to the CLI directory
cd cli/

# Install in editable mode
pip install -e .
```

### Method 2: Using uv (Faster)

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to CLI directory
cd cli/

# Install dependencies
uv pip install -e .
```

### Verify Installation

```bash
# Check if galaksio command is available
galaksio --help

# Should display the help menu with available commands
```

## Quick Start

### 1. Start the Galaksio Backend

Before using the CLI, ensure the Galaksio backend services are running (see [Backend README](../backend/README.md)).

Default backend URL: `http://localhost:8081`

### 2. Login with EVM Private Key

```bash
galaksio login --private-key YOUR_PRIVATE_KEY --url http://localhost:8081
```

**Security Note**: Your private key is stored locally in `~/.galaksio/config.json`. Ensure your system is secure.

### 3. Run Commands

**Execute Code:**
```bash
galaksio run path/to/script.py --language python
```

**Store Files:**
```bash
# Permanent storage
galaksio store path/to/file.txt --permanent

# Temporary storage with TTL
galaksio store path/to/file.txt --ttl 7200
```

**Create Cache:**
```bash
galaksio cache --region us-east-1
```

### 4. Interactive Shell Mode

```bash
galaksio
```

This launches an interactive shell where you can run commands without the `galaksio` prefix:

```
galaksio> login --private-key YOUR_KEY --url http://localhost:8081
galaksio> run script.py
galaksio> store data.json --permanent
galaksio> cache --region us-west-2
galaksio> status
galaksio> exit
```

## Commands

### `login`
Authenticate with an EVM private key and configure the Galaksio backend URL.

**Options:**
- `--private-key, -k`: EVM private key for x402 authentication (required)
- `--url, -u`: Galaksio backend URL (default: http://localhost:8081)

**Example:**
```bash
galaksio login -k 0x1234... -u https://galaksio.example.com
```

### `run`
Execute code via the Galaksio run endpoint.

**Arguments:**
- `file_path`: Path to the code file to execute

**Options:**
- `--language, -l`: Programming language (default: python)

**Example:**
```bash
galaksio run script.py --language python
galaksio run app.js --language javascript
```

### `store`
Store files via the Galaksio storage endpoint.

**Arguments:**
- `file_path`: Path to the file to store

**Options:**
- `--permanent`: Use permanent storage (default: temporary)
- `--ttl`: Time-to-live in seconds for temporary storage (default: 3600)

**Example:**
```bash
galaksio store document.pdf --permanent
galaksio store temp-data.json --ttl 7200
```

### `cache`
Create a cache instance via the Galaksio cache endpoint.

**Options:**
- `--region, -r`: Cache region (default: us-east-1)

**Example:**
```bash
galaksio cache --region us-west-2
galaksio cache --region eu-central-1
```

### `config`
Display current configuration.

**Example:**
```bash
galaksio config
```

**Output:**
```
Current Configuration:
  Backend URL: http://localhost:8081
  Private Key: 0x1234...
  Authenticated: Yes
```

### `logout`
Clear stored credentials.

**Example:**
```bash
galaksio logout
```

## Interactive Shell

The interactive shell provides a streamlined experience with:

- **Welcome Banner**: ASCII art cloud graphic
- **Status Display**: Current configuration and authentication status
- **Command History**: Navigate previous commands with arrow keys
- **Tab Completion**: Auto-complete commands (if supported by your terminal)

**Shell-Specific Commands:**
- `status`: Show current configuration
- `refresh`: Reload configuration
- `help`: Display help information
- `exit` or `quit`: Exit the shell

**Example Session:**
```bash
$ galaksio

   ___       _       _        _
  / _ \  __ _| | __ _| | _____(_) ___
 / /_\/ / _` | |/ _` | |/ / __| |/ _ \
/ /_\\ | (_| | | (_| |   <\__ \ | (_) |
\____/  \__,_|_|\__,_|_|\_\___/_|\___/

Welcome to Galaksio Interactive Shell
Type 'help' for available commands or 'exit' to quit

galaksio> status
Status: Not logged in
Backend URL: http://localhost:8081

galaksio> login -k 0xYOUR_KEY
✓ Login successful

galaksio> run hello.py
✓ Execution complete
Output: Hello, Galaksio!

galaksio> exit
Goodbye!
```

## Configuration

Configuration is stored in `~/.galaksio/config.json`:

```json
{
  "private_key": "0x...",
  "galaksio_url": "http://localhost:8081"
}
```

**Configuration Locations:**
- **Linux/macOS**: `~/.galaksio/config.json`
- **Windows**: `%USERPROFILE%\.galaksio\config.json`

**Security Considerations:**
- The private key is stored in plaintext locally
- Ensure file permissions are restrictive (chmod 600 on Unix-like systems)
- Consider using environment variables for CI/CD deployments
- Never commit config.json to version control

## x402 Payment Protocol

The CLI uses the x402 payment protocol for micropayments:

1. **Quote Phase**: Request pricing information before execution
2. **Payment Phase**: Automatically sign and submit payment using your EVM private key
3. **Execution Phase**: Service executes the request after payment verification

All payments are handled transparently by the x402 SDK.

**Supported Blockchains:**
- Ethereum (Mainnet, Sepolia, etc.)
- Other EVM-compatible chains

## Architecture

```
galaksio_cli/
├── __init__.py          # Package initialization
└── cli.py               # Main CLI implementation with Click framework
```

**Key Technologies:**
- **Click**: Command-line argument parsing and interface
- **Rich**: Beautiful terminal formatting and display
- **x402**: Payment protocol integration
- **eth-account**: EVM key management and signing
- **httpx**: Async HTTP client for API requests

## Examples

### Workflow Example 1: Code Execution

```bash
# Login to Galaksio
galaksio login -k 0xYOUR_PRIVATE_KEY -u http://localhost:8081

# Check configuration
galaksio config

# Execute a Python script
galaksio run analyze_data.py

# Store results permanently
galaksio store results.json --permanent

# Logout when done
galaksio logout
```

### Workflow Example 2: Batch Processing

```bash
# Enter interactive mode
galaksio

# Inside the shell
galaksio> login -k 0xYOUR_KEY -u http://localhost:8081
galaksio> run process1.py
galaksio> run process2.py
galaksio> run process3.py
galaksio> cache --region us-east-1
galaksio> store output.csv --permanent
galaksio> exit
```

### Workflow Example 3: Temporary File Storage

```bash
# Store a file for 2 hours (7200 seconds)
galaksio store temp_cache.json --ttl 7200

# Store for 24 hours
galaksio store daily_report.pdf --ttl 86400
```

## Development

### Install in Development Mode

```bash
# Clone the repository
git clone <repository-url>
cd galaksio/cli

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in editable mode with dev dependencies
pip install -e ".[dev]"
```

### Project Structure

```
cli/
├── galaksio_cli/
│   ├── __init__.py       # Package initialization
│   └── cli.py            # Main CLI implementation
├── pyproject.toml        # Project metadata and dependencies
├── uv.lock              # Lock file for uv package manager
├── README.md            # This file
└── .env.example         # Example environment variables
```

### Running Tests

```bash
# Run CLI in development
python -m galaksio_cli.cli --help

# Test specific commands
python -m galaksio_cli.cli config
```

## Troubleshooting

### "Not logged in" error

**Problem**: Commands fail with authentication error.

**Solution**: Run `galaksio login` with your private key first:
```bash
galaksio login -k YOUR_PRIVATE_KEY -u http://localhost:8081
```

### Connection errors

**Problem**: Unable to connect to Galaksio backend.

**Solutions**:
1. Verify the backend is running:
   ```bash
   curl http://localhost:8081/health
   ```
2. Check the URL in your configuration:
   ```bash
   galaksio config
   ```
3. Update the URL if needed:
   ```bash
   galaksio login -k YOUR_KEY -u http://correct-url:8081
   ```

### Payment failures

**Problem**: x402 payment transactions fail.

**Solutions**:
- Ensure your wallet has sufficient funds for gas and payment
- Check network connectivity
- Verify you're connected to the correct blockchain network
- Check that your private key is valid and has the necessary permissions

### Command not found: galaksio

**Problem**: Shell cannot find the `galaksio` command after installation.

**Solutions**:
1. Ensure Python's script directory is in your PATH:
   ```bash
   # Linux/macOS
   export PATH="$HOME/.local/bin:$PATH"

   # Windows (PowerShell)
   $env:PATH += ";$HOME\AppData\Local\Programs\Python\Python310\Scripts"
   ```
2. Reinstall the package:
   ```bash
   pip install -e . --force-reinstall
   ```
3. Use Python module syntax as fallback:
   ```bash
   python -m galaksio_cli.cli
   ```

### Unicode/Display Issues

**Problem**: ASCII art or formatting appears broken.

**Solutions**:
- Use a modern terminal with Unicode support (e.g., Windows Terminal, iTerm2, GNOME Terminal)
- Set UTF-8 encoding:
  ```bash
  export LANG=en_US.UTF-8
  export LC_ALL=en_US.UTF-8
  ```

### Permission Denied on Windows

**Problem**: Installation fails with permission errors.

**Solutions**:
- Run terminal as Administrator
- Use `pip install --user -e .`
- Install in a virtual environment

## Support

For issues, questions, or contributions:
- GitHub Issues: [Repository Issues Page]
- Documentation: [Project Documentation]

## License

Apache-2.0
