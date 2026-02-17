Write-Host "Debugging RogueTokens Connection..."

# Ensure we have the base URL
$env:ANTHROPIC_BASE_URL = "https://api.roguetokens.ai/"

# Get the key
if (-not $env:ANTHROPIC_API_KEY -or -not $env:ANTHROPIC_API_KEY.StartsWith("ant_")) {
    $apiKey = Read-Host "Please enter your full Anthropic Proxy Key (starts with ant_)"
    if ($apiKey) {
        $env:ANTHROPIC_API_KEY = $apiKey.Trim()
    }
}

if (-not $env:ANTHROPIC_API_KEY) {
    Write-Error "No API key available to test."
    exit
}

# 1. Print current settings (masked key)
Write-Host "--------------------------------------------------"
Write-Host "Base URL: $env:ANTHROPIC_BASE_URL"
$masked = $env:ANTHROPIC_API_KEY.Substring(0, 7) + "..."
Write-Host "API Key Start: $masked"
Write-Host "--------------------------------------------------"

# 2. Test connectivity with curl
Write-Host "Testing API Key with a simple request..."
try {
    # Construct a simple messages API call
    $body = @{
        model = "claude-3-haiku-20240307"
        max_tokens = 10
        messages = @(
            @{ role = "user"; content = "Hello" }
        )
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri "$($env:ANTHROPIC_BASE_URL)v1/messages" `
        -Method Post `
        -Headers @{
            "x-api-key" = $env:ANTHROPIC_API_KEY
            "anthropic-version" = "2023-06-01"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "SUCCESS! The API key works." -ForegroundColor Green
    Write-Host "Response: $($response.content[0].text)" -ForegroundColor Gray
    
    # If successful, launch Claude
    Write-Host "`nLaunching Claude Code now..."
    claude
}
catch {
    Write-Host "FAILED to connect or authenticate." -ForegroundColor Red
    Write-Host "Error Details:"
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host "Server Response: $respBody" -ForegroundColor Yellow
    }
}
