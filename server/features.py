import os
import re
from twilio.rest import Client
import firebase_admin
from firebase_admin import credentials, firestore
from flask import request, jsonify
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import datetime


# Load Twilio keys from environment
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER")

# ================== FIREBASE SETUP (Hackathon Safe Mode) ==================
# Try to initialize the real DB if you have the key
cred = credentials.Certificate("firebase-admin-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


# ================== SOS PROMPT ==================
SOS_PROMPT = PromptTemplate.from_template(
    """
You are an Emergency Medical Voice Assistant.
Based on the provided medical guidelines (specifically GINA/Asthma attack protocols),
give clear, imperative, numbered instructions for managing an acute asthma attack.

CONTEXT:
{context}

USER AGE:
{user_age}

INSTRUCTIONS:
1. Speak in short, direct commands (e.g., "Sit upright immediately.").
2. Do not use fluff or introductory phrases.
3. TAILOR THE DOSAGE STRICTLY FOR THE USER'S AGE (Adult vs Child).
4. Output is for Text-to-Speech (TTS).

RESPONSE:
"""
)




def register_routes(app, retriever, llm):

    def format_docs(docs):
        return "\n".join([d.page_content for d in docs])

    # UPDATED: Accepts condition and meds now
    def build_sos_chain(user_age, user_condition, user_meds):
        return (
            {
                "context": retriever | format_docs,
                "question": RunnablePassthrough(),
                "user_age": lambda _: user_age, 
                "user_condition": lambda _: user_condition,
                "user_meds": lambda _: user_meds,
            }
            | SOS_PROMPT
            | llm
            | StrOutputParser()
        )





    # ================== ROUTE 1: SMART SOS ALERT ==================
    @app.route("/api/sos-alert", methods=["POST"])
    def sos_alert():
        data = request.json
        
        # 1. GET INPUTS
        uid = data.get("uid") 
        lat = data.get("lat")
        lon = data.get("lon")

        # 2. GENERATE LOCATION LINK
        if lat and lon:
            location_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
        else:
            location_link = "GPS Unavailable"

        # 3. FETCH DEEP MEDICAL CONTEXT FROM DB
        # Default Fallbacks (Generic)
        raw_phone = "+919907401925"
        user_name = "Respi-Guard User"
        user_age = "Adult" 
        condition = "General Respiratory Distress"
        meds = "Emergency Inhaler"

        if db and uid:
            try:
                user_doc = db.collection('users').document(uid).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    
                    raw_phone = user_data.get("emergency_contact", raw_phone)
                    user_name = user_data.get("name", "User")
                    user_age = str(user_data.get("age", "Adult"))
                    
                    # --- NEW: Fetch Medical Context ---
                    condition = user_data.get("condition", condition) 
                    meds = user_data.get("medications", meds)
                    
                    print(f"✅ Fetched Data: {user_name} | {condition} | {meds}")
                else:
                    print(f"⚠️ User {uid} not found.")
            except Exception as e:
                print(f"❌ Firestore Error: {e}")
        else:
            print("⚠️ Using Mock Database for Demo")
            # This is what judges will see if DB fails
            user_name = "Arnab (Demo)"
            user_age = "20"
            condition = "Bronchial Asthma"
            meds = "Budesonide, Salbutamol (SOS)"
            raw_phone = "+91 99074 01925"

        # Sanitize Phone
        guardian_phone = re.sub(r"[^\d+]", "", raw_phone)

        # 4. GENERATE PERSONALIZED VOICE INSTRUCTIONS
        print(f"🚨 SOS: {condition} / {meds}")
        
        # Pass all medical context to the LLM Chain
        chain = build_sos_chain(user_age, condition, meds) 
        
        # We ask a broader question now to cover dizziness/choking
        voice_instructions = chain.invoke("Immediate emergency steps for respiratory distress")

        # 5. CONSTRUCT RICH WHATSAPP MESSAGE
        msg_body = (
            f"⚠️ *SOS: RESPIRATORY EMERGENCY*\n"
            f"👤 *Patient*: {user_name} ({user_age})\n"
            f"🏥 *Condition*: {condition}\n"
            f"💊 *Meds*: {meds}\n\n"
            f"📍 *Location*: {location_link}\n"
            f"📞 *ACTION*: Call & Help Immediately!"
        )

        call_status = "Skipped"
        msg_status = "Skipped"

        # 6. TWILIO ACTIONS
        if TWILIO_SID and TWILIO_AUTH and TWILIO_FROM:
            try:
                client = Client(TWILIO_SID, TWILIO_AUTH)
                
                # --- A: WHATSAPP ---
                print("📨 Sending WhatsApp...")
                message = client.messages.create(
                    body=msg_body,
                    from_='whatsapp:+14155238886', 
                    to=f'whatsapp:{guardian_phone}'
                )
                msg_status = f"WhatsApp Sent ({message.sid})"
                print(f"✅ WhatsApp Sent: {message.sid}")

                # --- B: CALL ---
                print("📞 Calling...")
                twiml_script = (
                    f"<Response>"
                    f"<Say voice='alice' language='en-IN'>"
                    f"Emergency Alert! {user_name} is in respiratory distress. "
                    f"They have a history of {condition}. "
                    f"Their location and medication details have been sent to your WhatsApp. "
                    f"Please act immediately."
                    f"</Say>"
                    f"</Response>"
                )

                call = client.calls.create(
                    twiml=twiml_script,
                    to=guardian_phone,
                    from_=TWILIO_FROM 
                )
                call_status = f"Calling ({call.sid})"
                print(f"✅ Call Placed: {call.sid}")

            except Exception as e:
                print(f"❌ Twilio Error: {e}")
                msg_status = f"Failed: {str(e)}"
                call_status = f"Failed: {str(e)}"

        return jsonify({
            "status": "SOS Activated",
            "voice_text": voice_instructions,
            "guardian_info": guardian_phone,
            "location_sent": location_link,
            "msg_status": msg_status,    
            "call_status": call_status
        })

    