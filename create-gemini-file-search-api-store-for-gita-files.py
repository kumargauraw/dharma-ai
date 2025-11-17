from google import genai
import time

API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"  # Replace with your actual key

client = genai.Client(api_key=API_KEY)

print("Creating Bhagavad Gita File Search Store...")

# Create store
gita_store = client.file_search_stores.create(
    config={'display_name': 'Bhagavad_Gita_Complete'}
)

print(f"✅ Store created: {gita_store.name}\n")

# Upload files
files = [
    {
        'path': r'C:\DharmaShastras\Text-PDFs\Bhagavad Gita Bhashya and Tatparya Nirnaya by Madhvacharya-Hindi-English-Sanskrit-Mix.md',
        'name': 'Madhvacharya Bhashya'
    },
    {
        'path': r'C:\DharmaShastras\Text-PDFs\Bhagavad Gita With the Commentary of AdiShankaracharya Hindi.md',
        'name': 'Shankaracharya Bhashya'
    },
    {
        'path': r'C:\DharmaShastras\Text-PDFs\Srimad Bhagavad Geeta Hindi All 18 Chapters - Hindi Meaning-Translation of All Shlokas Only.txt',
        'name': 'Gita Hindi Translation'
    },
    {
        'path': r'C:\DharmaShastras\Text-PDFs\Srimad Bhagavad Geeta Sanskrit All 18 Chapters - Original Shlokas Verses Only.txt',
        'name': 'Gita Sanskrit Verses'
    }
]

for file_info in files:
    print(f"Uploading: {file_info['name']}...")
    
    operation = client.file_search_stores.upload_to_file_search_store(
        file=file_info['path'],
        file_search_store_name=gita_store.name,
        config={'display_name': file_info['name']}
    )
    
    while not operation.done:
        time.sleep(3)
        operation = client.operations.get(operation=operation)
    
    print(f"✅ {file_info['name']} indexed\n")

print("=" * 60)
print(f"STORE NAME: {gita_store.name}")
print("=" * 60)
print("Save this store name for your Next.js app!")