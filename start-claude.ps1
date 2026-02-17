Write-Host "Setting up environment for Claude Code with Ollama..."
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:11434"
$env:ANTHROPIC_API_KEY = "ollama"

# Check if Qwen models are available
$qwen25 = ollama list | Select-String "qwen2.5-coder:latest"
$qwen3 = ollama list | Select-String "qwen3-coder:latest"

Write-Host "Available Models:"
if ($qwen25) { Write-Host " - qwen2.5-coder:latest (Ready)" -ForegroundColor Green }
if ($qwen3) { Write-Host " - qwen3-coder:latest (Ready)" -ForegroundColor Green }
else { Write-Host " - qwen3-coder:latest (Still downloading or not found)" -ForegroundColor Yellow }

Write-Host "`nStarting Claude Code..."
Write-Host "Note: Claude will try to connect to Ollama. If it asks for a model, try 'qwen2.5-coder' or 'qwen3-coder'."
claude
