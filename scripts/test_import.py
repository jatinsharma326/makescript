try:
    import whisper
    import torch
    print("SUCCESS: Whisper and Torch imported")
except ImportError as e:
    print(f"ERROR: {e}")
except Exception as e:
    print(f"ERROR: {e}")
