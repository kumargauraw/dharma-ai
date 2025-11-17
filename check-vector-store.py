from google import genai

API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"
client = genai.Client(api_key=API_KEY)

store_name = 'fileSearchStores/bhagavadgitacomplete-1jvvdhtbnqja'

# Get store details
store = client.file_search_stores.get(name=store_name)
print(f"Store: {store.display_name}")
print(f"Name: {store.name}\n")

# List documents in store
print("Documents in store:")
for doc in client.file_search_stores.list_documents(file_search_store_name=store_name):
    print(f"  - {doc.display_name}")
    print(f"    ID: {doc.name}")
    print(f"    State: {doc.state}\n")