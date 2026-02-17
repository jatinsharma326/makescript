Write-Host "Setting up environment for Claude Code with RogueTokens..."

# Key validated via debug script
$MyRogueKey = "61246812d8774272868269c83ea87e93"

# Set the base URL for RogueTokens
$env:ANTHROPIC_BASE_URL = "https://api.roguetokens.ai/"

# Set BOTH variables to ensure compatibility
# The docs ask for ANTHROPIC_AUTH_TOKEN, so we set it explicitly.
$env:ANTHROPIC_AUTH_TOKEN = $MyRogueKey
$env:ANTHROPIC_API_KEY = $MyRogueKey

Write-Host "--------------------------------------------------"
Write-Host "Base URL:   $env:ANTHROPIC_BASE_URL"
Write-Host "Key Status: Validated (starts with 61246...)"
Write-Host "Variables:  ANTHROPIC_AUTH_TOKEN set."
Write-Host "            ANTHROPIC_API_KEY set."
Write-Host "--------------------------------------------------"

Write-Host "Starting Claude Code..."
claude
