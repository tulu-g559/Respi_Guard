import os
import json
import hashlib
from typing import List

from dotenv import load_dotenv
load_dotenv(override=True)

from langchain_core.documents import Document
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# ================== CONFIG ==================
DOCS_FOLDER = "medical_docs"
INDEX_NAME = "respi-guard"

# KEEPING YOUR MODEL AS REQUESTED
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004" 
)

# ================== INGEST LOGIC ==================

def make_doc(text: str, metadata: dict) -> Document:
    # Create a stable ID so we don't re-ingest duplicates
    doc_id = hashlib.sha256(
        (metadata["source"] + text).encode()
    ).hexdigest()
    
    # Add doc_id to metadata just in case
    metadata["doc_id"] = doc_id
    return Document(page_content=text, metadata=metadata)

def ingest_docs():
    print("🚀 Starting Smart Contextual Ingestion...")
    
    documents: List[Document] = []

    for filename in os.listdir(DOCS_FOLDER):
        if not filename.endswith(".json"):
            continue

        path = os.path.join(DOCS_FOLDER, filename)
        print(f"📦 Processing {filename}...")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # ---------------------------------------------------------
        # THE FIX: Iterate over TOP-LEVEL keys only.
        # This keeps the hierarchy intact.
        # ---------------------------------------------------------
        if isinstance(data, dict):
            for section, content in data.items():
                # Skip tiny metadata keys if they aren't useful content
                if section in ["document_metadata", "document_info", "meta_info"]:
                    # Optional: Include them if you want, but usually we want the DATA.
                    # Let's stringify the whole metadata block just in case.
                    pass 

                # Convert the ENTIRE sub-tree to a string.
                # This ensures "Agitated" appears right next to "Severe Exacerbation"
                text_content = f"SECTION: {section}\nCONTENT: {json.dumps(content, indent=2)}"
                
                metadata = {
                    "source": filename,
                    "doc_type": infer_doc_type(filename),
                    "section": section
                }
                
                documents.append(make_doc(text_content, metadata))
        
        elif isinstance(data, list):
             # If the JSON is just a list of objects, ingest each object
            for i, item in enumerate(data):
                text_content = json.dumps(item, indent=2)
                metadata = {
                    "source": filename, 
                    "doc_type": infer_doc_type(filename),
                    "item_index": i
                }
                documents.append(make_doc(text_content, metadata))

    print(f"📄 Created {len(documents)} Context-Rich Documents.")
    
    # Optional: If a section is HUGE, we might want to split it.
    # But usually JSON sub-sections fit in the 8k context window of Gemini Flash.
    # We will upload as-is for maximum context.

    print("⏳ Uploading to Pinecone...")
    vectorstore = PineconeVectorStore(
        index_name=INDEX_NAME,
        embedding=embeddings,
    )

    vectorstore.add_documents(
        documents=documents,
        ids=[d.metadata["doc_id"] for d in documents],
    )

    print("✅ Pinecone ingestion complete.")

    

# ================== HELPERS ==================

def infer_doc_type(filename: str) -> str:
    name = filename.lower()
    if "air" in name or "particulate" in name or "atsdr" in name or "who" in name:
        return "Environmental_Guideline"
    if "asthma" in name or "gina" in name:
        return "Clinical_Guideline"
    if "international" in name or "ihr" in name:
        return "Public_Health_Regulation"
    return "Medical_Reference"

if __name__ == "__main__":
    ingest_docs()