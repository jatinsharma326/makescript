from openai import OpenAI

client = OpenAI(
    base_url='https://api-inference.modelscope.ai/v1',
    api_key='ms-692f5732-147d-40f9-be6f-72df23f95bb0',
)

print('Testing ModelScope API...')
print('=' * 50)

try:
    response = client.chat.completions.create(
        model='MiniMax/MiniMax-M2.7',
        messages=[
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': 'Hey how r u r u good?'}
        ],
        stream=True
    )
    
    print('Response streaming...')
    print('-' * 50)
    
    full_response = ''
    for chunk in response:
        if chunk.choices:
            content = chunk.choices[0].delta.content
            if content:
                print(content, end='', flush=True)
                full_response += content
    
    print()
    print('-' * 50)
    print(f'Full response length: {len(full_response)} characters')
    print('API test: SUCCESS')
    
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
    print('API test: FAILED')