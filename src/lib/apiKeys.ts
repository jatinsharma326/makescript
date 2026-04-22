// ═══════════════════════════════════════════════════════════════════════
// CUSTOM API CONFIGURATION
// Add your own API endpoints, model names, and keys here
// Format: { id: 'unique-id', name: 'Display Name', baseUrl: 'https://api...', apiKey: 'your-key', model: 'model-name' }
// ═══════════════════════════════════════════════════════════════════════

export interface CustomAPIConfig {
    id: string;           // Unique identifier (e.g., 'my-openai', 'custom-kimi')
    name: string;         // Display name in the dropdown
    baseUrl: string;      // API endpoint base URL
    apiKey: string;       // API key for authentication
    model: string;        // Model name to use
    authHeader?: string;  // Custom auth header name (default: 'Authorization')
    authPrefix?: string;  // Auth prefix (e.g., 'Bearer', 'Api-Key')
}

// Add your custom API configurations here
export const CUSTOM_APIS: CustomAPIConfig[] = [
    // ═══════════════════════════════════════════════════════════════════
    // MODELSCOPE APIS - Added from your config
    // ═══════════════════════════════════════════════════════════════════
    
    // GLM-5 via ModelScope
    {
        id: 'modelscope-glm5',
        name: 'GLM-5 (ModelScope)',
        baseUrl: 'https://api-inference.modelscope.ai/v1',
        apiKey: 'ms-692f5732-147d-40f9-be6f-72df23f95bb0',
        model: 'zai-org/GLM-5',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
    },
    
    // MiniMax M2.7 via ModelScope
    {
        id: 'modelscope-minimax',
        name: 'MiniMax M2.7 (ModelScope)',
        baseUrl: 'https://api-inference.modelscope.ai/v1',
        apiKey: 'ms-692f5732-147d-40f9-be6f-72df23f95bb0',
        model: 'MiniMax/MiniMax-M2.7',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
    },
    
    // MiniMax M2.5 via ModelScope
    {
        id: 'modelscope-minimaxtwo',
        name: 'MiniMax M2.5 (ModelScope)',
        baseUrl: 'https://api-inference.modelscope.ai/v1',
        apiKey: 'ms-692f5732-147d-40f9-be6f-72df23f95bb0',
        model: 'MiniMax/MiniMax-M2.5',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // EXAMPLES - Add more custom APIs below:
    // ═══════════════════════════════════════════════════════════════════
    
    // Example: OpenAI compatible API (like OpenRouter, Together AI, etc.)
    // {
    //     id: 'openrouter',
    //     name: 'OpenRouter (GPT-4)',
    //     baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    //     apiKey: 'sk-or-your-key-here',
    //     model: 'openai/gpt-4',
    //     authHeader: 'Authorization',
    //     authPrefix: 'Bearer',
    // },
    
    // Example: Groq API (fast inference)
    // {
    //     id: 'groq',
    //     name: 'Groq (Llama)',
    //     baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    //     apiKey: 'gsk_your-groq-key',
    //     model: 'llama-3.3-70b-versatile',
    //     authHeader: 'Authorization',
    //     authPrefix: 'Bearer',
    // },
    
    // Example: xAI Grok
    // {
    //     id: 'xai',
    //     name: 'xAI Grok',
    //     baseUrl: 'https://api.x.ai/v1/chat/completions',
    //     apiKey: 'your-xai-key',
    //     model: 'grok-2-1212',
    //     authHeader: 'Authorization',
    //     authPrefix: 'Bearer',
    // },
    
    // Example: Ollama (local)
    // {
    //     id: 'ollama',
    //     name: 'Ollama (Local)',
    //     baseUrl: 'http://localhost:11434/api/chat',
    //     apiKey: '',  // No key needed for local
    //     model: 'llama3',
    //     authHeader: '',
    //     authPrefix: '',
    // },
];

// Default provider API configurations
export const DEFAULT_PROVIDERS = {
    // Anthropic - for Claude models
    // anthropic: {
    //     baseUrl: 'https://api.anthropic.com/v1/messages',
    //     authHeader: 'x-api-key',
    //     authPrefix: '',
    // },
    
    // // Moonshot AI - for Kimi models
    // moonshot: {
    //     baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    //     authHeader: 'Authorization',
    //     authPrefix: 'Bearer',
    // },
    
    // // OpenAI - for GPT models
    // openai: {
    //     baseUrl: 'https://api.openai.com/v1/chat/completions',
    //     authHeader: 'Authorization',
    //     authPrefix: 'Bearer',
    // },
    
    // // Google - for Gemini models
    // google: {
    //     baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    //     authHeader: '',
    //     authPrefix: '',
    // },
    
    // // DeepSeek
    // deepseek: {
    //     baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    //     authHeader: 'Authorization',
    //     authPrefix: 'Bearer',
    // },
    
    // Lightning AI
    lightning: {
        baseUrl: process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
    },
};

// Legacy support - map model IDs to their provider
export const MODEL_PROVIDER_MAP: Record<string, string> = {
    // Anthropic models
    'anthropic/claude-sonnet-4-20250514': 'anthropic',
    'anthropic/claude-sonnet-4-6': 'anthropic',
    'anthropic/claude-opus-4-6': 'anthropic',
    'anthropic/claude-haiku-4-5-20251001': 'anthropic',
    
    // Moonshot/Kimi models
    'lightning-ai/kimi-k2.5': 'moonshot',
    'moonshot/kimi-k2.5': 'moonshot',
    
    // OpenAI models
    'openai/gpt-5-nano': 'openai',
    'openai/gpt-5': 'openai',
    'openai/gpt-5.2-2025-12-11': 'openai',
    'openai/o3': 'openai',
    'openai/o4-mini': 'openai',
    
    // Google/Gemini models
    'google/gemini-3-flash-preview': 'google',
    'google/gemini-3-pro-preview': 'google',
    
    // DeepSeek models
    'lightning-ai/DeepSeek-V3.1': 'deepseek',
    'deepseek/deepseek-v3': 'deepseek',
    
    // Lightning AI models
    'lightning-ai/llama-3.3-70b': 'lightning',
};

// Get provider for a model ID
export function getModelProvider(modelId: string): string {
    // Check if it's a custom API
    const customApi = CUSTOM_APIS.find(api => api.id === modelId || api.model === modelId);
    if (customApi) return 'custom';
    
    return MODEL_PROVIDER_MAP[modelId] || 'lightning';
}

// Get custom API config by ID
export function getCustomApiConfig(id: string): CustomAPIConfig | undefined {
    return CUSTOM_APIS.find(api => api.id === id);
}

// Legacy: Get API key for a provider
export function getApiKey(provider: string): string {
    if (provider === 'custom') return '';
    const keys: Record<string, string> = {
        anthropic: process.env.ANTHROPIC_API_KEY || '',
        moonshot: process.env.MOONSHOT_API_KEY || '',
        openai: process.env.OPENAI_API_KEY || '',
        google: process.env.GOOGLE_API_KEY || '',
        deepseek: process.env.DEEPSEEK_API_KEY || '',
        lightning: process.env.LIGHTNING_API_KEY || '',
    };
    const key = keys[provider];
    if (!key) {
        console.warn(`[API Keys] No API key configured for provider: ${provider}`);
    }
    return key;
}

// Legacy: Get API endpoint for a provider
export function getApiEndpoint(provider: string): string {
    if (provider === 'custom') return '';
    return DEFAULT_PROVIDERS[provider as keyof typeof DEFAULT_PROVIDERS]?.baseUrl || DEFAULT_PROVIDERS.lightning.baseUrl;
}
