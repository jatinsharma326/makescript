# Debug Script for RogueTokens V2
# Tests both raw key and 'ant_' prefixed key

$BaseUrl = "https://api.roguetokens.ai/"
$RawKey = "61246812d8774272868269c83ea87e93"
$KeysToTest = @(
    @{ Name = "Raw Key"; Key = $RawKey },
    @{ Name = "Prefixed Key"; Key = "ant_$RawKey" }
)

function Test-Key {
    param($KeyName, $ApiKey)
    
    Write-Host "Testing $KeyName..." -NoNewline
    
    $body = @{
        model = "claude-3-haiku-20240307"
        max_tokens = 10
        messages = @(
            @{ role = "user"; content = "Hello" }
        )
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod -Uri "${BaseUrl}v1/messages" `
            -Method Post `
            -Headers @{
                "x-api-key" = $ApiKey
                "anthropic-version" = "2023-06-01"
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -ErrorAction Stop

        Write-Host " SUCCESS!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " FAILED." -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkGray
        return $false
    }
}

Write-Host "Starting RogueTokens Key Validation..."
Write-Host "Base URL: $BaseUrl"
Write-Host ""

$WorkingKey = $null

foreach ($item in $KeysToTest) {
    if (Test-Key -KeyName $item.Name -ApiKey $item.Key) {
        $WorkingKey = $item.Key
        break
    }
}

if ($WorkingKey) {
    Write-Host "`nFOUND WORKING KEY: $WorkingKey" -ForegroundColor Cyan
    Write-Host "Updating start-claude-rogue.ps1 with this key..."
} else {
    Write-Host "`nALL KEYS FAILED." -ForegroundColor Red
    Write-Host "Please check your dashboard for the correct 'ant_' key."
}
