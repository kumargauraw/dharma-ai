import google.generativeai as genai

API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"
genai.configure(api_key=API_KEY)

# Get your files
files = list(genai.list_files())
file_uris = [f.uri for f in files if f.state.name == "ACTIVE"]

print(f"Found {len(file_uris)} files")

# Test with GenerativeModel and grounding
model = genai.GenerativeModel(
    model_name='gemini-2.0-flash-exp',
    tools='google_search_retrieval'  # This might enable grounding
)

# Try a query
response = model.generate_content([
    "Find and explain this verse: तमुवाच हृषीकेशः प्रहसन्निव भारत"
])

print(response.text)