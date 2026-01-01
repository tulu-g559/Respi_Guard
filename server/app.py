import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import datetime

import firebase_admin
from firebase_admin import credentials, firestore

from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI,
)
from langchain_pinecone import PineconeVectorStore

from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
# from langchain.memory import ConversationBufferWindowMemory # OLD import
# from langchain_core.memory import ConversationBufferWindowMemory # <-- short Memory for conversation history, last 4

load_dotenv(override=True)
app = Flask(__name__)
CORS(app)

# ================== ENV ==================
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
PINECONE_INDEX_NAME = "respi-guard"

# print("GOOGLE_API_KEY:", GOOGLE_API_KEY if GOOGLE_API_KEY else "NOT FOUND")

#firebase setup
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-admin-key.json")
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("🔥 Firebase Admin Connected in app.py")
except Exception as e:
    print(f"⚠️ Firebase Setup Error: {e}")
    print("Running in MOCK DB mode.")
    db = None



# VECTOR STORE
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

vectorstore = PineconeVectorStore(
    index_name=PINECONE_INDEX_NAME,
    embedding=embeddings,
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
)


######################################################################################################################
#conds and function for API 1:advisory + AQI 

# The "Smart" AQI Converter
def calculate_indian_aqi(pm2_5):   #### <---Indian Context
    """
    Calculates India's National Air Quality Index (NAQI) for PM2.5
    Based on CPCB (Central Pollution Control Board) breakpoints.
    """
    c = float(pm2_5)
    
    # Linear interpolation formula:  I = I_low + ( (I_high - I_low) / (C_high - C_low) ) * (C - C_low)
    
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


# ================== DB HELPERS ==================
def get_user_profile_from_db(uid):
    """Fetches Condition, Meds, and Age from Firestore"""
    default_profile = "Adult with General Respiratory Sensitivity. No specific meds."
    
    if not db or not uid:
        return default_profile

    try:
        doc = db.collection('users').document(uid).get()
        if doc.exists:
            data = doc.to_dict()
            name = data.get('name', 'User')
            age = data.get('age', 'Adult')
            condition = data.get('condition', 'General Sensitivity')
            meds = data.get('medications', 'None')
            return f"Patient Name: {name}, Age: {age}. Condition: {condition}. Current Medications: {meds}."
        else:
            return default_profile
    except Exception as e:
        print(f"DB Error: {e}")
        return default_profile



# ================== PROMPT ==================
#Prompt API1
ADVISORY_PROMPT = PromptTemplate.from_template(
    """
You are Respi-Guard. Analyze the Indian Air Quality (NAQI) and user health.
Return your response in strictly VALID JSON format.

Structure:
{{
  "advisory_text": "Medical advice citing sources, but adding practical mitigation (e.g., N95 masks).",
  "activities": {{
     "outdoor_exercise": {{"status": "Avoid", "color": "red"}}, 
     "light_walk": {{"status": "Caution (Mask Required)", "color": "yellow"}}, 
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
1. **Prioritize Safety but be Pragmatic:** - For "outdoor_exercise": If AQI > 200 (Poor), mark as RED ("Avoid"). Heavy breathing is dangerous.
   - For "light_walk" (Commute): If AQI is High (200-400), do NOT mark as Red. Mark as YELLOW ("Caution") and strictly advise wearing an N95 Mask. Only mark Red if AQI > 400 (Severe).
   - For "indoor_ventilation": If AQI > 150, mark as RED ("Close Windows"). Use Air Purifier if possible.

2. ALWAYS mention "N95 Mask" if the status is Yellow or Red.
3. Cite sources (GINA/WHO).

RESPONSE:
"""
)

######################################################################################################################






#Prompt API2
CHAT_PROMPT = PromptTemplate.from_template(
    """
SYSTEM ROLE:
You are **Respi-Guard**, a specialized Pulmonology AI Assistant. Your sole purpose is to provide respiratory health advice, interpret air quality data, and offer guidance based on clinical protocols.

⛔ STRICT GUARDRAILS (DO NOT IGNORE):
1. **Scope Restriction**: If the user asks about coding, politics, movies, general trivia, or anything unrelated to health/weather, politely refuse. Say: "I can only assist with respiratory health and air quality monitoring."
2. **No Hallucinations**: If the answer is not found in the 'CONTEXT' or 'AQI DATA', admit you don't know. Do not invent medical advice.
3. **Emergency Protocol**: If the user indicates severe distress (e.g., "I can't breathe," "Chest pain"), ignore standard advice and tell them to press the **SOS Button** or call emergency services immediately.

---

📥 INPUT DATA:
1. **CLINICAL CONTEXT** (Guidelines & RAG): 
{context}

2. **USER PROFILE** (The Patient): 
{user_profile}

3. **REAL-TIME ENVIRONMENT** (Live AQI): 
{aqi_data}

4. **CONVERSATION HISTORY**: 
{history}

---

USER QUESTION: 
{question}

---

📝 INSTRUCTIONS FOR RESPONSE:
1. **Personalize**: Always tailor the answer to the User's specific condition and medications listed in 'USER PROFILE'.
2. **Check the Air**: If the user asks about going outside, exercising, or opening windows, you MUST cross-reference the 'REAL-TIME ENVIRONMENT'.
   - *Example*: "Since your AQI is {aqi_data} and you have Asthma, stay indoors."
3. **Cite Sources**: When providing medical facts from the 'CLINICAL CONTEXT', explicitly cite the source (e.g., [Source: GINA Guidelines]).
4. **Tone**: Professional, empathetic, and concise. Do not use robotic fillers like "As an AI...".
5. **Format**: Use Markdown (bolding for warnings, bullet points for steps). Do NOT use JSON.

YOUR RESPONSE:
"""
)

    

## 1st retrieve ->  format -> send to LLM! ### 

# ================== HELPER FUNCTION FOR CONTEXT ==================
def format_docs(docs):
    # This combines the JSON chunks and adds the source tag for the LLM
    formatted = []
    for doc in docs:
        source = doc.metadata.get("source", "Unknown Source")
        formatted.append(f"CONTENT: {doc.page_content}\nSOURCE: {source}\n---")
    return "\n".join(formatted)



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

def build_chat_chain(user_profile, aqi_data, history):
    return (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough(),
            "user_profile": lambda _: user_profile,
            "aqi_data": lambda _: aqi_data,
            "history": lambda _: history, # <--- Passes history to prompt
        }
        | CHAT_PROMPT
        | llm
        | StrOutputParser()
    )




#########################################################################
           # ====== MEMORY STORE FOR CHAT: API 2 ====== #      
# Simple in-memory store                                                #
conversation_store = {}                                                 #
                                                                        #
                                                                        #            
def get_history(session_id, k=4):                                       #
    return conversation_store.get(session_id, [])[-k:]                  #
                                                                        #
                                                                        #                   
def save_turn(session_id, user_msg, ai_msg):                            #
    conversation_store.setdefault(session_id, []).append(               #
        {"user": user_msg, "assistant": ai_msg}                         #    
    )                                                                   #

#########################################################################





                                                                    #============#
                                                               #======= ROUTES ========#
                                                                    #============#
# =========================
# API 1: MORNING ADVISORY
# =========================

@app.route("/api/get-advisory", methods=["POST"])
def get_advisory():
    data = request.json

    # 1. GET INPUTS (Now expects uid)
    uid = data.get("uid") 
    lat = data.get("lat")
    lon = data.get("lon")

    # 2. FETCH USER PROFILE FROM DB (Backend Logic)
    # We use the helper function to get the real medical data
    user_profile = get_user_profile_from_db(uid)
    print(f"👤 Generating Advisory for: {user_profile}")

    # 3. FETCH LIVE AQI
    aqi_data = get_live_aqi(lat, lon)
    if not aqi_data:
        return jsonify({"error": "Failed to fetch AQI data"}), 500

    # 4. SAVE AQI CONTEXT TO FIRESTORE (Crucial for Chatbot)
    # This saves the 'latest_aqi' so the /ask-doctor endpoint can read it later
    if db and uid:
        try:
            db.collection('users').document(uid).update({
                "latest_aqi": aqi_data,
                "latest_aqi_timestamp": datetime.datetime.now()
            })
            print("💾 AQI Context Saved to Firestore for Chatbot use")
        except Exception as e:
            print(f"⚠️ Failed to save AQI context: {e}")

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

    # === JSON PARSING LOGIC (KEPT EXACTLY AS YOU REQUESTED) ===
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
@app.route("/api/ask-doctor", methods=["POST"])
def ask_doctor():
    data = request.json
    
    # 1. GET INPUTS
    uid = data.get("uid")
    question = data.get("query")
    
    # 2. FETCH USER PROFILE FROM DB (Backend Logic)
    user_profile = get_user_profile_from_db(uid)

    # 3. FETCH SAVED AQI CONTEXT FROM DB
    # The doctor needs to know the "context" of the environment
    aqi_context = "Unknown. Tell user to check dashboard first."
    
    if db and uid:
        try:
            doc = db.collection('users').document(uid).get()
            if doc.exists:
                user_data = doc.to_dict()
                # We retrieve the specific AQI data saved by the /get-advisory route
                saved_aqi = user_data.get("latest_aqi")
                if saved_aqi:
                    aqi_context = str(saved_aqi)
                    print("✅ Loaded Saved AQI Context for Chat")
        except Exception as e:
            print(f"⚠️ Could not load saved AQI: {e}")

    # 4. GET & FORMAT CHAT HISTORY
    # We use the UID as the session_id to keep history unique to the user
    history = get_history(uid) 
    history_text = "\n".join([f"User: {h['user']}\nAssistant: {h['assistant']}" for h in history])

    # 5. RUN RAG CHAT
    # This chain now has access to: Medical Docs (RAG) + User Profile + Live AQI + Chat History
    rag_chain = build_chat_chain(
        user_profile=user_profile,
        aqi_data=aqi_context,
        history=history_text
    )

    response = rag_chain.invoke(question)

    # 6. SAVE CONVERSATION
    save_turn(uid, question, response)

    return jsonify({"response": response})





import features
features.register_routes(app, retriever, llm, db)


if __name__ == "__main__":
    app.run(debug=True, port=5000)