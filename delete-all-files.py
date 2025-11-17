import google.generativeai as genai

# Your API key
API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"

genai.configure(api_key=API_KEY)

print("Fetching all uploaded files...")
print("=" * 60)

try:
    all_files = list(genai.list_files())

    if not all_files:
        print("No files found in your account. Nothing to delete.")
    else:
        print(f"Found {len(all_files)} file(s) to delete:\n")

        for i, file in enumerate(all_files, 1):
            print(f"{i}. {file.display_name}")
            print(f"   Name: {file.name}")
            print(f"   State: {file.state.name}")

        print("\n" + "=" * 60)
        print("Deleting files...")
        print("-" * 60)

        for i, file in enumerate(all_files, 1):
            try:
                genai.delete_file(file.name)
                print(f"Deleted {i}/{len(all_files)}: {file.display_name}")
            except Exception as e:
                print(f"Failed to delete {file.display_name}: {e}")

        print("\n" + "=" * 60)
        print("Done! All files have been deleted.")
        print("You can now do a fresh upload.")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
