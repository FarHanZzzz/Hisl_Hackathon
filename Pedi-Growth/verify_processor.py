try:
    from processor import GaitScanner
    scanner = GaitScanner()
    print("GaitScanner instantiated successfully.")
except Exception as e:
    print(f"Error: {e}")
