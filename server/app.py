import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI,
)
from langchain_pinecone import PineconeVectorStore

from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv(override=True)


app = Flask(__name__)
CORS(app)

# ================== ENV ==================
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
PINECONE_INDEX_NAME = "respi-guard"

# print("GOOGLE_API_KEY:", GOOGLE_API_KEY if GOOGLE_API_KEY else "NOT FOUND")

# ================== VECTOR STORE ==================
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

vectorstore = PineconeVectorStore(
    index_name=PINECONE_INDEX_NAME,
    embedding=embeddings,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# ================== LLM ==================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
)

# ===============The "Smart" AQI Converter (Backend) ==================
def calculate_indian_aqi(pm2_5):
    """
    Calculates India's National Air Quality Index (NAQI) for PM2.5
    Based on CPCB (Central Pollution Control Board) breakpoints.
    """
    c = float(pm2_5)
    
    # Linear interpolation formula: 
    # I = I_low + ( (I_high - I_low) / (C_high - C_low) ) * (C - C_low)
    
    if c <= 30: # Good (0-50)
        return round(0 + (50 - 0) / (30 - 0) * (c - 0))
    elif c <= 60: # Satisfactory (51-100)
        return round(51 + (100 - 51) / (60 - 30) * (c - 30))
    elif c <= 90: # Moderate (101-200)
        return round(101 + (200 - 101) / (90 - 60) * (c - 60))
    elif c <= 120: # Poor (201-300)
        return round(201 + (300 - 201) / (120 - 90) * (c - 90))
    elif c <= 250: # Very Poor (301-400)
        return round(301 + (400 - 301) / (250 - 120) * (c - 120))
    else: # Severe (401-500+)
        return 401 + int(c - 250) # Rough linear extrapolation for severe

def get_indian_aqi_category(aqi):
    """Returns the official CPCB category label."""
    if aqi <= 50: return "Good"
    elif aqi <= 100: return "Satisfactory"
    elif aqi <= 200: return "Moderate"
    elif aqi <= 300: return "Poor"
    elif aqi <= 400: return "Very Poor"
    else: return "Severe"



# ================== AQI HELPER FUNCTION ==================
def get_live_aqi(lat, lon):
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except ValueError:
        print("❌ [AQI ERROR]: Invalid coordinates format")
        return None
    
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat_f}&lon={lon_f}&appid={OPENWEATHER_API_KEY}"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        if response.status_code != 200 or "list" not in data:
            print(f"❌ OpenWeather Error: {data.get('message', 'Unknown Error')}")
            # Mock fallback for hackathon safety
            return {"aqi_index": 5, "pm2_5": 75.4, "indian_aqi": 151} 

        # Extract Raw Data
        aqi_index = data["list"][0]["main"]["aqi"] # 1-5 Scale (Internal use only)
        pm2_5 = data["list"][0]["components"]["pm2_5"] # Raw Concentration

        # Calculate Indian AQI
        indian_aqi = calculate_indian_aqi(pm2_5)

        return {
            "aqi_index": aqi_index, 
            "pm2_5": pm2_5,
            "indian_aqi": indian_aqi  # <--- Sends Indian Standard
        }

    except Exception as e:
        print(f"❌ [AQI HELPER CRASH]: {e}")
        return None
    
    



## 1st retrieve ->  format -> send to LLM! ### 

# ================== HELPER FUNCTION FOR CONTEXT ==================
def format_docs(docs):
    # This combines the JSON chunks and adds the source tag for the LLM
    formatted = []
    for doc in docs:
        source = doc.metadata.get("source", "Unknown Source")
        formatted.append(f"CONTENT: {doc.page_content}\nSOURCE: {source}\n---")
    return "\n".join(formatted)





# ================== PROMPT ==================

ADVISORY_PROMPT = PromptTemplate.from_template(
    """
You are Respi-Guard. Analyze the Indian Air Quality (NAQI) and user health.
Return your response in strictly VALID JSON format (no markdown code blocks).

Structure:
{{
  "advisory_text": "A 2-sentence medical warning citing sources.",
  "activities": {{
     "outdoor_exercise": {{"status": "Avoid", "color": "red"}},
     "light_walk": {{"status": "Caution", "color": "yellow"}},
     "indoor_ventilation": {{"status": "Safe", "color": "green"}}
  }}
}}

CONTEXT:
{context}

USER PROFILE:
{user_profile}

LIVE AIR QUALITY:
{aqi_data}
(Note: 'indian_aqi' follows CPCB standards. >300 is Very Poor.)

INSTRUCTIONS:
1. Use specific limits/treatments from context.
2. ALWAYS cite the source (e.g., "According to GINA...").
3. Be empathetic but professional.

RESPONSE:
"""
)


CHAT_PROMPT = PromptTemplate.from_template(
    """
You are Respi-Guard, an expert medical AI assistant.
Answer the user's question clearly and empathetically using the provided context.
Do NOT use JSON format. Just write a helpful paragraph.

CONTEXT:
{context}

USER PROFILE:
{user_profile}

CURRENT AIR QUALITY:
{aqi_data}

QUESTION:
{question}

INSTRUCTIONS:
1. Answer strictly based on the provided medical docs.
2. Cite your sources explicitly (e.g., "The WHO Guidelines state...").
3. If you don't know, say so.

RESPONSE:
"""
)


# ================== RAG CHAIN updated to latest, ig, ig ==================
def build_advisory_chain(user_profile, aqi_data):
    return (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough(), # Questions are hardcoded in the route
            "user_profile": lambda _: user_profile,
            "aqi_data": lambda _: aqi_data,
        }
        | ADVISORY_PROMPT
        | llm
        | StrOutputParser()
    )

def build_chat_chain(user_profile, aqi_data):
    return (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough(),
            "user_profile": lambda _: user_profile,
            "aqi_data": lambda _: aqi_data,
        }
        | CHAT_PROMPT  # <--- Uses the normal chat prompt
        | llm
        | StrOutputParser()
    )




                                                               ####### ROUTES ##########
# =========================
# API 1: MORNING ADVISORY
# =========================

@app.route("/get-advisory", methods=["POST"])
def get_advisory():
    data = request.json

    lat = data.get("lat")
    lon = data.get("lon")
    user_profile = data.get("user_profile", "Healthy, no conditions")

    aqi_data = get_live_aqi(lat, lon)
    if not aqi_data:
        return jsonify({"error": "Failed to fetch AQI data"}), 500

    # Determine Category for context
    category = get_indian_aqi_category(aqi_data['indian_aqi'])

    # Construct the query to trigger the RAG retrieval
    query = (
        f"Current Status: Indian NAQI is {aqi_data['indian_aqi']} (Category: {category}). "
        f"PM2.5 concentration is {aqi_data['pm2_5']} µg/m³. "
        f"Patient Profile: {user_profile}. "
        f"QUESTION: Based on the provided guidelines, what specific health precautions and activity restrictions should be taken?"
    )

    # USE THE ADVISORY CHAIN (Uses the JSON Prompt)
    rag_chain = build_advisory_chain(
        user_profile=str(user_profile),
        aqi_data=str(aqi_data),
    )

    raw_response = rag_chain.invoke(query)

    # === JSON PARSING LOGIC ===
    try:
        # Gemini sometimes wraps JSON in ```json ... ``` markdown. Remove it.
        cleaned_response = raw_response.replace("```json", "").replace("```", "").strip()
        advisory_json = json.loads(cleaned_response)
    except Exception as e:
        print(f"⚠️ JSON Parse Failed: {e}")
        # Fallback ensures Frontend doesn't crash
        advisory_json = {
            "advisory_text": raw_response,
            "activities": {} 
        }

    return jsonify({
        "aqi": aqi_data,
        "advisory": advisory_json 
    })




# =========================
# API 2: ASK DOCTOR (CHAT) 
# =========================

@app.route("/ask-doctor", methods=["POST"])
def ask_doctor():
    data = request.json

    question = data.get("query")
    user_profile = data.get("user_profile", "General Public")
    aqi_context = data.get("aqi_context", "Unknown")

    # USE THE CHAT CHAIN (Uses the Text/Conversation Prompt)
    rag_chain = build_chat_chain(
        user_profile=str(user_profile),
        aqi_data=str(aqi_context),
    )

    response = rag_chain.invoke(question)

    # Return simple JSON with just the text response
    return jsonify({"response": response})



import features
features.register_routes(app, retriever, llm)


if __name__ == "__main__":
    app.run(debug=True, port=5000)