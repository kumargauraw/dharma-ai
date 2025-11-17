import google.generativeai as genai
import time
import os

# Your API key and Store ID
API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"  # Replace
GITA_STORE_ID = "bhagavad-gita-commentaries-fj3lqvggxy23"  # Replace with Store ID from previous step

# Update these paths to your actual directory
FILES_DIR = "C:\\DharmaShastras\\Text-PDFs"

FILES_TO_UPLOAD = [
    {
        "path": "Srimad Bhagavad Geeta Sanskrit All 18 Chapters - Original Shlokas Verses Only.txt",
        "display_name": "Bhagavad Gita - Sanskrit Verses (All 700)",
        "type": "verses"
    },
    {
        "path": "Srimad Bhagavad Geeta Hindi All 18 Chapters - Hindi Meaning-Translation of All Shlokas Only.txt",
        "display_name": "Bhagavad Gita - Hindi Meanings (All 700)",
        "type": "meanings"
    },
    {
        "path": "Bhagavad Gita Bhashya and Tatparya Nirnaya by Madhvacharya-Hindi-English-Sanskrit-Mix.md",
        "display_name": "Madhvacharya - Gita Bhashya (Dvaita)",
        "type": "commentary"
    },
    {
        "path": "Bhagavad Gita With the Commentary of AdiShankaracharya Hindi.md",
        "display_name": "Adi Shankaracharya - Gita Bhashya (Advaita)",
        "type": "commentary"
    }
]

genai.configure(api_key=API_KEY)

print("=" * 70)
print("UPLOADING BHAGAVAD GITA CORPUS - 4 FILES")
print("=" * 70)

uploaded_files = []

for idx, file_info in enumerate(FILES_TO_UPLOAD, 1):
    file_path = os.path.join(FILES_DIR, file_info["path"])
    
    print(f"\n=== FILE {idx}/4: {file_info['display_name']} ===")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        continue
    
    # Get file size
    file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
    print(f"File size: {file_size:.2f} MB")
    
    try:
        # Upload file
        print("Uploading...", end=" ")
        new_file = genai.upload_file(
            path=file_path,
            display_name=file_info["display_name"]
        )
        print(f"✅ Uploaded")
        print(f"URI: {new_file.uri}")
        print(f"Name: {new_file.name}")
        print(f"State: {new_file.state.name}")
        
        # Wait for processing
        if new_file.state.name == "PROCESSING":
            print("Processing...", end=" ")
            max_wait = 120  # 2 minutes max
            waited = 0
            while new_file.state.name == "PROCESSING" and waited < max_wait:
                time.sleep(5)
                waited += 5
                new_file = genai.get_file(new_file.name)
                print(".", end="", flush=True)
            print()
        
        if new_file.state.name == "ACTIVE":
            print(f"✅ File is ACTIVE and ready")
            uploaded_files.append({
                "display_name": file_info["display_name"],
                "uri": new_file.uri,
                "name": new_file.name,
                "type": file_info["type"]
            })
        else:
            print(f"❌ File processing failed: {new_file.state.name}")
            
    except Exception as e:
        print(f"❌ Upload failed: {e}")

# Summary
print("\n" + "=" * 70)
print("UPLOAD SUMMARY")
print("=" * 70)
print(f"Successfully uploaded: {len(uploaded_files)}/4 files\n")

if uploaded_files:
    print("Files in Vector Store:")
    for file in uploaded_files:
        print(f"\n📄 {file['display_name']}")
        print(f"   Type: {file['type']}")
        print(f"   URI: {file['uri']}")

print("\n" + "=" * 70)
print("✅ UPLOAD COMPLETE")
print("=" * 70)

# Save URIs for reference
print("\n💾 Saving file URIs to file...")
with open("vector_store_files.txt", "w", encoding="utf-8") as f:
    f.write("Bhagavad Gita Vector Store Files\n")
    f.write("=" * 70 + "\n\n")
    for file in uploaded_files:
        f.write(f"Name: {file['display_name']}\n")
        f.write(f"Type: {file['type']}\n")
        f.write(f"URI: {file['uri']}\n")
        f.write(f"File Name: {file['name']}\n")
        f.write("-" * 70 + "\n\n")

print("✅ URIs saved to: vector_store_files.txt")