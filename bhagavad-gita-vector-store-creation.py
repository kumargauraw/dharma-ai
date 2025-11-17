import google.generativeai as genai
from google.ai.generativelanguage import CreateCorpusRequest, Corpus
import google.ai.generativelanguage as glm
from google.api_core import client_options as client_options_lib

# Your API key
API_KEY = "AIzaSyDKDJuO9SWRGepXS12LNOdcm50Q-SXHsGY"
genai.configure(api_key=API_KEY)

# Create retriever client with API key
client_options = client_options_lib.ClientOptions(api_key=API_KEY)
retriever_service_client = glm.RetrieverServiceClient(client_options=client_options)

# Create Gita vector store (corpus)
corpus_request = CreateCorpusRequest(
    corpus=Corpus(
        display_name="Bhagavad Gita Commentaries"
    )
)

try:
    gita_store = retriever_service_client.create_corpus(corpus_request)
    print("Success! Created Gita Vector Store!")
    print(f"Store Name: {gita_store.name}")
    print(f"Store ID: {gita_store.name.split('/')[-1]}")
    print("\nSave this Store ID - you'll need it!")
except Exception as e:
    print(f"Error creating corpus: {e}")
    print("\nPossible issues:")
    print("1. API key may be invalid or incomplete")
    print("2. The Semantic Retriever API may require special access or might not be available in your region")
    print("3. You may need to enable the API at: https://makersuite.google.com/app/apikey")
    print("\nPlease verify your API key is correct and has the necessary permissions.")