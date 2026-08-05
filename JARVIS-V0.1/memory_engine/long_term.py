import os
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings

class MemoryEngine:
    def __init__(self, vault_path: str):
        self.vault_path = vault_path
        # Switch from Google Gemini to local Ollama Embeddings
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.vectorstore = None
        self._load_vault()

    def _load_vault(self):
        """Loads all markdown files in the vault path into the vectorstore."""
        if not os.path.exists(self.vault_path):
            os.makedirs(self.vault_path)

        docs = []
        for filename in os.listdir(self.vault_path):
            if filename.endswith(".md"):
                file_path = os.path.join(self.vault_path, filename)
                loader = TextLoader(file_path)
                try:
                    docs.extend(loader.load())
                except Exception as e:
                    print(f"Error loading {filename}: {e}")

        if docs:
            self.vectorstore = FAISS.from_documents(docs, self.embeddings)
        else:
            self.vectorstore = None

    def refresh(self):
        self._load_vault()

    def search(self, query: str, k: int = 3) -> str:
        """Searches the memory vault and returns a formatted summary of findings."""
        if not self.vectorstore:
            return "Memory vault is currently empty."

        try:
            results = self.vectorstore.similarity_search(query, k=k)
            if not results:
                return "No relevant memories found."

            formatted_results = "\n\n".join([f"Source: {res.metadata.get('source', 'Unknown')}\nContent: {res.page_content}" for res in results])
            return f"Found the following relevant memories:\n{formatted_results}"
        except Exception as e:
            return f"Error searching memory: {e}"
