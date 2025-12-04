"""
Galaksio CLI - Interact with the Galaksio backend using x402 payments
"""
import click
import cmd
import json
import os
import sys
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.columns import Columns
from eth_account import Account
from dotenv import load_dotenv
import asyncio
import httpx
from x402.clients.httpx import x402HttpxClient

load_dotenv()

console = Console()

# Configuration file path
CONFIG_DIR = Path.home() / ".galaksio"
CONFIG_FILE = CONFIG_DIR / "config.json"


def print_banner():
    """Print Galaksio welcome banner"""
    console.print("\nGALAKSIO", style="bold white", justify="center")
    console.print(
        "Multi-cloud orchestration powered by x402\n",
        style="white",
        justify="center"
    )


class GalaksioShell(cmd.Cmd):
    """Interactive shell for Galaksio CLI."""
    prompt = "galaksio> "

    def __init__(self):
        super().__init__()
        self.config = load_config()

    def postcmd(self, stop, line):
        """Add blank line after each command."""
        print()
        return stop

    def preloop(self):
        """Display welcome banner and status."""
        print_banner()
        console.print(self.render_status_panel())

    def render_status_panel(self):
        """Render current status information."""
        # Status column
        status_text = Text()
        status_text.append("Configuration\n", style="bold white")

        quote_server_url = self.config.get("quote_server_url", "Not configured")
        broker_url = self.config.get("broker_url", "Not configured")
        has_private_key = bool(self.config.get("private_key"))

        status_text.append("  Quote Server: ", style="dim")
        status_text.append(f"{quote_server_url}\n", style="cyan")

        status_text.append("  Broker: ", style="dim")
        status_text.append(f"{broker_url}\n", style="cyan")

        status_text.append("  Auth: ", style="dim")
        if has_private_key:
            account = Account.from_key(self.config["private_key"])
            status_text.append(f"{account.address[:10]}...\n", style="green")
        else:
            status_text.append("Not logged in\n", style="red")

        status_text.append("  Config: ", style="dim")
        status_text.append(f"{CONFIG_DIR}\n", style="cyan")

        return status_text

    def do_exit(self, arg):
        """Exit the shell"""
        console.print("Exiting Galaksio shell...")
        return True

    def do_quit(self, arg):
        """Exit the shell"""
        return self.do_exit(arg)

    def default(self, line):
        """Execute Galaksio CLI commands."""
        import shlex
        commands = [cmd.strip() for cmd in line.split("&&") if cmd.strip()]
        for cmd_line in commands:
            try:
                args = shlex.split(cmd_line)
                if not args:
                    continue
                cli.main(args=args, standalone_mode=False)
                # Reload config after command
                self.config = load_config()
            except SystemExit:
                pass
            except Exception as e:
                console.print(f"[red]Error:[/red] {e}")

    def do_help(self, arg):
        """Show help for Galaksio commands"""
        from io import StringIO
        import contextlib

        buf = StringIO()
        with contextlib.redirect_stdout(buf):
            try:
                cli.main(args=["--help"], standalone_mode=False)
            except SystemExit:
                pass
        output = buf.getvalue().strip()
        console.print(output or "No help available.")

    def do_status(self, arg):
        """Show current status"""
        console.print(self.render_status_panel())

    def do_refresh(self, arg):
        """Refresh configuration data"""
        self.config = load_config()
        console.print("[green]Configuration refreshed[/green]")
        console.print(self.render_status_panel())


def ensure_config_dir():
    """Ensure configuration directory exists."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    """Load configuration from file."""
    ensure_config_dir()
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {}


def save_config(config: dict):
    """Save configuration to file."""
    ensure_config_dir()
    CONFIG_FILE.write_text(json.dumps(config, indent=2))


def get_authenticated_client(base_url: str = None):
    """Get an authenticated x402 HTTP client."""
    config = load_config()

    if not config.get("private_key"):
        console.print("[red]Error:[/red] Not logged in. Use 'galaksio login' first.")
        raise click.Abort()

    if not base_url:
        console.print("[red]Error:[/red] Base URL not provided.")
        raise click.Abort()

    account = Account.from_key(config["private_key"])
    return x402HttpxClient(account=account, base_url=base_url)


def get_quote_server_client():
    """Get authenticated client for quote server."""
    config = load_config()

    if not config.get("quote_server_url"):
        console.print("[red]Error:[/red] Quote server URL not configured. Use 'galaksio login' first.")
        raise click.Abort()

    return get_authenticated_client(config["quote_server_url"])


def get_broker_client():
    """Get authenticated client for broker."""
    config = load_config()

    if not config.get("broker_url"):
        console.print("[red]Error:[/red] Broker URL not configured. Use 'galaksio login' first.")
        raise click.Abort()

    return get_authenticated_client(config["broker_url"])


@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx):
    """Galaksio CLI - Multi-cloud orchestration with x402 payments."""
    if ctx.invoked_subcommand is None:
        console.print("Entering interactive mode... (Ctrl+C or type 'exit' to quit)")
        GalaksioShell().cmdloop()


@cli.command()
@click.option("--private-key", "-k", type=str, required=True,
              help="EVM private key for x402 authentication")
@click.option("--quote-server", "-q", type=str, default="http://localhost:8081",
              help="Quote server URL (default: http://localhost:8081)")
@click.option("--broker", "-b", type=str, default="http://localhost:8080",
              help="Broker URL (default: http://localhost:8080)")
def login(private_key, quote_server, broker):
    """
    Login with EVM private key and configure Galaksio URLs.

    The private key will be used to sign x402 payment transactions.
    """
    try:
        # Validate private key
        account = Account.from_key(private_key)

        config = load_config()
        config["private_key"] = private_key
        config["quote_server_url"] = quote_server
        config["broker_url"] = broker
        save_config(config)

        console.print(Panel(
            f"[green]Login successful[/green]\n\n"
            f"Address: [bold]{account.address}[/bold]\n"
            f"Quote Server: {quote_server}\n"
            f"Broker: {broker}\n\n"
            f"Configuration saved to: {CONFIG_FILE}",
            title="Authentication",
            border_style="green"
        ))

    except Exception as e:
        console.print(f"[red]Error:[/red] Invalid private key: {e}")
        raise click.Abort()


@cli.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("--language", "-l", type=str, default="python",
              help="Programming language (default: python)")
def run(file_path, language):
    """
    Execute code via Galaksio run endpoint.

    Uploads and executes code file using x402 payment.

    Arguments:
        file_path: Path to the code file to execute
    """
    try:
        file_path = Path(file_path)

        if not file_path.exists():
            console.print(f"[red]Error:[/red] File not found: {file_path}")
            raise click.Abort()

        # Read file
        code_content = file_path.read_text()
        code_size = len(code_content.encode('utf-8'))

        console.print(f"[cyan]Reading file:[/cyan] {file_path}")
        console.print(f"[dim]Size: {code_size} bytes, Language: {language}[/dim]\n")

        # Get quote first
        config = load_config()
        with console.status("[bold green]Getting quote..."):
            quote_client = get_quote_server_client()
            broker_client = get_broker_client()

            # Run both operations in a single event loop
            async def run_operations():
                # First get quote from quote server
                quote_response = await _get_run_quote(quote_client, code_size, language)

                if "error" in quote_response:
                    return None, quote_response

                # Execute with payment on broker
                result = await _execute_run(broker_client, code_content, language)
                return quote_response, result

            quote_response, result = asyncio.run(run_operations())

            if quote_response is None:
                console.print(f"[red]Error getting quote:[/red] {result['error']}")
                raise click.Abort()

            console.print(Panel(
                f"Provider: {quote_response.get('provider', 'unknown')}\n"
                f"Price: ${quote_response.get('price_usd', 0):.6f} USD\n"
                f"Currency: {quote_response.get('currency', 'N/A')}\n"
                f"Network: {quote_response.get('network', 'N/A')}",
                title="Quote",
                border_style="yellow"
            ))

            # print(f'quote_response: {quote_response}')

            # payment_instructions = quote_response.get("metadata", {}).get("payment_instructions", {})

            # Execute with payment
            console.print("\n[cyan]Executing code with payment...[/cyan]")

            # print(json.dumps(result, indent=2))

            # console.print(Panel(
            #     str(result),
            #     title="Execution Result",
            #     border_style="green"
            # ))

            console.print("\n[bold green]Execution Result:[/bold green]")

            console.print_json(json.dumps(result, indent=4))


    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("--permanent", is_flag=True, default=False,
              help="Use permanent storage (default: temporary)")
@click.option("--ttl", type=int, default=3600,
              help="Time-to-live in seconds for temporary storage (default: 3600)")
def store(file_path, permanent, ttl):
    """
    Store file via Galaksio storage endpoint.

    Uploads file to decentralized storage using x402 payment.

    Arguments:
        file_path: Path to the file to store
    """
    try:
        file_path = Path(file_path)

        if not file_path.exists():
            console.print(f"[red]Error:[/red] File not found: {file_path}")
            raise click.Abort()

        # Read file
        file_content = file_path.read_bytes()
        file_size = len(file_content)

        console.print(f"[cyan]Reading file:[/cyan] {file_path}")
        console.print(f"[dim]Size: {file_size} bytes, Permanent: {permanent}, TTL: {ttl}s[/dim]\n")

        # Get quote first
        with console.status("[bold green]Getting storage quote..."):
            quote_client = get_quote_server_client()
            broker_client = get_broker_client()

            # Run both operations in a single event loop
            async def store_operations():
                # First get quote from quote server
                quote_response = await _get_store_quote(quote_client, file_size, permanent, ttl)

                if "error" in quote_response:
                    return None, quote_response

                # Upload with payment on broker
                result = await _execute_store(broker_client, file_content, permanent, ttl)
                return quote_response, result

            quote_response, result = asyncio.run(store_operations())

            if quote_response is None:
                console.print(f"[red]Error getting quote:[/red] {result['error']}")
                raise click.Abort()

            best_quote = quote_response.get('best', {})

            console.print(Panel(
                f"Provider: {best_quote.get('provider', 'unknown')}\n"
                f"Price: ${best_quote.get('price_usd', 0):.6f} USD\n"
                f"Currency: {best_quote.get('currency', 'N/A')}\n"
                f"Network: {best_quote.get('network', 'N/A')}",
                title="Storage Quote",
                border_style="yellow"
            ))

            # Upload with payment
            console.print("\n[cyan]Uploading file with payment...[/cyan]")

            console.print(Panel(
                f"Storage CID: {result.get('cid', 'N/A')}\n"
                f"Status: {result.get('status', 'unknown')}\n"
                f"Details: {json.dumps(result, indent=2)}",
                title="Storage Result",
                border_style="green"
            ))

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
@click.option("--region", "-r", type=str, default="us-east-1",
              help="Cache region (default: us-east-1)")
def cache(region):
    """
    Create cache instance via Galaksio cache endpoint.

    Creates a new cache instance using x402 payment.
    """
    try:
        console.print(f"[cyan]Creating cache in region:[/cyan] {region}\n")

        # Get quote first
        with console.status("[bold green]Getting cache quote..."):
            quote_client = get_quote_server_client()
            broker_client = get_broker_client()

            # Run both operations in a single event loop
            async def cache_operations():
                # First get quote from quote server
                quote_response = await _get_cache_quote(quote_client, region)

                if "error" in quote_response:
                    return None, quote_response

                # Create cache with payment on broker
                result = await _execute_cache(broker_client, region)
                return quote_response, result

            quote_response, result = asyncio.run(cache_operations())

            if quote_response is None:
                console.print(f"[red]Error getting quote:[/red] {result['error']}")
                raise click.Abort()

            console.print(Panel(
                f"Provider: {quote_response.get('provider', 'unknown')}\n"
                f"Price: ${quote_response.get('price_usd', 0):.6f} USD\n"
                f"Currency: {quote_response.get('currency', 'N/A')}\n"
                f"Network: {quote_response.get('network', 'N/A')}",
                title="Cache Quote",
                border_style="yellow"
            ))

            # Create cache with payment
            console.print("\n[cyan]Creating cache instance with payment...[/cyan]")

            console.print(Panel(
                f"Cache ID: {result.get('cache_id', 'N/A')}\n"
                f"Region: {result.get('region', region)}\n"
                f"Status: {result.get('status', 'unknown')}\n"
                f"Details: {json.dumps(result, indent=2)}",
                title="Cache Created",
                border_style="green"
            ))

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
def config():
    """Show current configuration."""
    cfg = load_config()

    if not cfg:
        console.print("[yellow]No configuration found. Use 'galaksio login' to set up.[/yellow]")
        return

    table = Table(title="Galaksio Configuration", show_header=True)
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Quote Server URL", cfg.get("quote_server_url", "Not set"))
    table.add_row("Broker URL", cfg.get("broker_url", "Not set"))

    if cfg.get("private_key"):
        account = Account.from_key(cfg["private_key"])
        table.add_row("Address", account.address)
    else:
        table.add_row("Address", "[red]Not logged in[/red]")

    table.add_row("Config File", str(CONFIG_FILE))

    console.print(table)


@cli.command()
def logout():
    """Clear stored credentials."""
    config = load_config()

    if "private_key" in config:
        del config["private_key"]

    save_config(config)
    console.print("[green]Logged out successfully[/green]")


# Async helper functions for API calls

async def _get_run_quote(client, code_size: int, language: str):
    """Get quote for run operation."""
    try:
        response = await client.post("/v2/quote/run", json={
            "codeSize": code_size,
            "language": language
        })
        return response.json()
    except Exception as e:
        return {"error": str(e)}


async def _execute_run(client, code: str, language: str):
    """Execute run operation with payment."""
    try:
        # First call to broker to get payment instructions
        response = await client.post("/run", json={
            "code": code,
            "language": language
        })

        # Log the raw response for debugging
        # print(f'Response status: {response.status_code}')
        # print(f'Response headers: {dict(response.headers)}')

        result = response.json()
        # print(f'Response body: {json.dumps(result, indent=2)}')

        # Check if we got payment instructions
        if result.get("status") == "instructions_provided":
            instructions = result.get("instructions", {})
            provider = result.get("provider")

            # Extract payment details from metadata (for merit-systems)
            metadata = result.get("metadata", {})
            x402_response = metadata.get("response", {})
            accepts = x402_response.get("accepts", [])

            if accepts and len(accepts) > 0:
                payment_details = accepts[0]
                resource_url = payment_details.get("url")

                # print(f'code: {code}')
                # print(f'type(code): {type(code)}')

                # For merit-systems, we need to pass the code as a string in the proper format
                payload = {
                    "snippet": code
                }

                # Make the actual payment and call the resource directly
                config = load_config()
                account = Account.from_key(config["private_key"])

                # Parse resource URL to extract base URL and full path
                from urllib.parse import urlparse
                parsed = urlparse(resource_url)
                base_url = f"{parsed.scheme}://{parsed.netloc}"
                # Add /resource/ prefix if not present in the path
                resource_path = parsed.path
                if not resource_path.startswith('/resource/'):
                    resource_path = '/resource' + resource_path

                # print(f"resource_url: {resource_url}")
                # print(f"base_url: {base_url}")
                # print(f'resource_path: {resource_path}')

                # Create x402 client with the base URL and make the request with retry logic
                async with x402HttpxClient(account=account, base_url=base_url) as resource_client:
                    max_retries = 3
                    for attempt in range(max_retries):
                        final_response = await resource_client.post(resource_path, json=payload)

                        # If not 402, we're done
                        if final_response.status_code != 402:
                            return final_response.json()

                        # If this was the last attempt, return the 402 response
                        if attempt == max_retries - 1:
                            console.print(f"[red]Received 402 response after {max_retries} attempts[/red]")
                            return final_response.json()

                        # Log that we're retrying
                        console.print(f"[yellow]Received 402 response, retrying... (attempt {attempt + 2}/{max_retries})[/yellow]")
                        await asyncio.sleep(1)  # Wait before retrying

                    # This shouldn't be reached, but just in case
                    return final_response.json()

        return result
    except Exception as e:
        import traceback
        error_details = {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        print(f'Exception in _execute_run: {json.dumps(error_details, indent=2)}')
        return error_details


async def _get_store_quote(client, file_size: int, permanent: bool, ttl: int):
    """Get quote for store operation."""
    try:
        response = await client.post("/v2/quote/store", json={
            "fileSize": file_size,
            "permanent": permanent,
            "ttl": ttl
        })
        return response.json()
    except Exception as e:
        return {"error": str(e)}


async def _execute_store(client, file_content: bytes, permanent: bool, ttl: int):
    """Execute store operation with payment."""
    try:
        # This would be the actual storage endpoint
        response = await client.post("/store",
            files={"file": file_content},
            data={
                "permanent": permanent,
                "ttl": ttl
            }
        )
        return response.json()
    except Exception as e:
        return {"error": str(e)}


async def _get_cache_quote(client, region: str):
    """Get quote for cache creation."""
    try:
        response = await client.post("/v2/quote/cache", json={
            "region": region
        })
        return response.json()
    except Exception as e:
        return {"error": str(e)}


async def _execute_cache(client, region: str):
    """Execute cache creation with payment."""
    try:
        # This would be the actual cache creation endpoint
        response = await client.post("/cache", json={
            "region": region
        })
        return response.json()
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    cli()
