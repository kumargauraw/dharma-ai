import google.generativeai as genai
import time

API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"
CORPUS_ID = "bhagavad-gita-commentaries-fj3lqvggxy23"
NEW_PDF_PATH = "C:\\DharmaShastras\\Text-PDFs\\Bhagavad Gita With the Commentary of AdiShankaracharya.pdf"  # Update this path

genai.configure(api_key=API_KEY)

print("=== STEP 1: Check for Existing Files ===")
files_to_delete = []
for file in genai.list_files():
    print(f"- {file.display_name}: {file.name}")
    if "Shankaracharya" in file.display_name or "shankaracharya" in file.display_name.lower():
        files_to_delete.append(file)

if files_to_delete:
    print(f"\n=== STEP 2: Delete Existing Shankaracharya Files ===")
    for file in files_to_delete:
        print(f"Deleting: {file.display_name} ({file.name})")
        try:
            file.delete()
            print("✅ Deleted!")
        except Exception as e:
            print(f"⚠️ Could not delete: {e}")
else:
    print("\n=== STEP 2: No Existing Files to Delete ===")

print("\n=== STEP 3: Upload New Shankaracharya File ===")
try:
    new_file = genai.upload_file(
        path=NEW_PDF_PATH,
        display_name="Adi Shankaracharya - Gita Bhashya"
    )
    print(f"✅ Uploaded: {new_file.name}")
    print(f"   Display Name: {new_file.display_name}")
    print(f"   State: {new_file.state.name}")
except Exception as e:
    print(f"❌ Upload failed!")
    print(f"Error: {e}")
    exit()

# Wait for file to be ACTIVE
print("\nWaiting for file to be processed...")
while new_file.state.name == "PROCESSING":
    time.sleep(5)
    new_file = genai.get_file(new_file.name)
    print(f"   State: {new_file.state.name}")

if new_file.state.name == "FAILED":
    print("❌ File processing failed!")
    exit()

print(f"✅ File is {new_file.state.name}")

print("\n=== STEP 4: Add to Corpus ===")
import requests

corpus_url = f"https://generativelanguage.googleapis.com/v1beta/corpora/{CORPUS_ID}/documents"
headers = {
    "x-goog-api-key": API_KEY,
    "Content-Type": "application/json"
}

file_id = new_file.name.split('/')[-1]
response = requests.post(
    corpus_url,
    headers=headers,
    json={
        "name": f"corpora/{CORPUS_ID}/documents/{file_id}",
        "displayName": new_file.display_name
    }
)

if response.status_code in [200, 201]:
    print("✅ File added to corpus!")
else:
    print(f"⚠️ Response: {response.status_code}")
    print(response.text)

print("\n=== STEP 5: Verify Final State ===")
print("\nCurrent files:")
for file in genai.list_files():
    print(f"- {file.display_name}: {file.name}")

print(f"\n✅ COMPLETE!")
print(f"New file URI: {new_file.uri}")