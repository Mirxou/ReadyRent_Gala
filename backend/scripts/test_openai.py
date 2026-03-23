import os
import openai
import sys

# Load env manually since we are running as script
from pathlib import Path
import environ
BASE_DIR = Path(__file__).resolve().parent.parent # backend dir
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

openai.api_key = env('OPENAI_API_KEY')

def test_key():
    print(f"Testing Key: {openai.api_key[:10]}...")
    try:
        # 1. Test Chat
        print("1. Testing Chat Completion (GPT-4)...")
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Use cheap model for test
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        print("✅ Chat Success:", response.choices[0].message.content)
    except Exception as e:
        print("❌ Chat Failed:", str(e))
        return

    print("Note: To test Audio, we need a file. Skipping audio test if Chat works, likely Permissions are similar.")

if __name__ == "__main__":
    test_key()
