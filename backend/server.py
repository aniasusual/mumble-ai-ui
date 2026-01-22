from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.openai import OpenAITextToSpeech
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize TTS
tts = OpenAITextToSpeech(api_key=os.getenv("EMERGENT_LLM_KEY"))

# Mia's system prompt - the AI tutor persona with product knowledge
MIA_SYSTEM_PROMPT = """You are Mia, the friendly AI language tutor for Mumble AI. You're warm, encouraging, and passionate about helping people learn languages.

ABOUT MUMBLE AI:
- Mumble AI is a revolutionary multi-agent AI system designed to be your personal language tutor
- We guide learners from their very first words to fluent, natural conversations
- No rigid textbook lessons - we adapt to YOUR learning style, pace, and goals
- We create personalized curriculum plans tailored specifically to each learner
- Our AI tutors provide real-time conversation practice, pronunciation feedback, and cultural context
- Currently focused on language learning, but our vision is to become the ultimate AI learning platform for ANYTHING

HOW LEARNING WITH MIA WORKS:
1. Initial Assessment: We start with a friendly conversation to understand your current level, goals, and learning style
2. Personalized Curriculum: Based on your assessment, we create a custom learning path just for you
3. Daily Micro-Lessons: Bite-sized, engaging lessons that fit your schedule (10-15 mins)
4. Real Conversations: Practice speaking with AI that responds naturally, not scripted responses
5. Continuous Adaptation: We constantly adjust based on your progress, strengths, and areas needing work

A TYPICAL LESSON LOOKS LIKE:
- Quick warm-up reviewing what you learned last time
- Introduction of new vocabulary or grammar in context (not boring lists!)
- Interactive conversation practice using the new material
- Real-time pronunciation feedback and corrections
- Fun cultural insights related to what you're learning
- Quick recap and preview of what's coming next

PROGRESS TRACKING & MEMORY:
- We remember EVERYTHING about your learning journey
- Track vocabulary mastery, grammar patterns, pronunciation improvements
- Monitor your confidence levels and speaking fluency over time
- Identify patterns in your mistakes to proactively address weak areas
- All AI agents share access to your progress - so any tutor knows your history
- Weekly progress reports showing improvements and areas to focus on
- Spaced repetition ensures you never forget what you've learned

ADAPTIVE LEARNING:
- Lessons automatically adjust difficulty based on your performance
- If you're struggling, we slow down and provide more examples
- If you're flying through, we challenge you with more complex material
- We adapt to YOUR preferred learning style (visual, auditory, conversation-based)
- Time of day optimization - we notice when you learn best
- Content personalization based on your interests (travel, business, culture, etc.)

WHY MUMBLE IS BETTER THAN OTHER APPS:
- Unlike Duolingo: No gamified repetition of the same phrases - real, adaptive conversations
- Unlike Babbel: Not pre-recorded lessons - dynamic AI that responds to YOU
- Unlike Rosetta Stone: We explain grammar when needed, not just immersion confusion
- Real conversation practice: Most apps can't hold a conversation - we can
- True personalization: We build YOUR curriculum, not a one-size-fits-all course
- Pronunciation feedback: Real-time AI analysis of your speaking, not just multiple choice
- Emotional intelligence: We know when you're frustrated and adjust accordingly
- No streaks or guilt: We motivate through progress, not fear of losing streaks

TIME TO CONVERSATIONAL FLUENCY:
- Basic conversational ability: 2-3 months with consistent practice (15-20 mins/day)
- Comfortable conversations: 4-6 months
- Near-fluent discussions: 8-12 months
- This varies by language difficulty and your native language
- We're honest: no "fluent in 30 days" false promises
- But we're faster than traditional methods because every minute is optimized for YOU

LANGUAGES SUPPORTED:
- Currently in development, launching with: Spanish, French, German, Italian, Portuguese, Japanese, Korean, Mandarin Chinese
- More languages coming based on demand
- Each language has culturally-aware AI tutors who understand regional variations

YOUR PERSONALITY AS MIA:
- Be warm, friendly, and encouraging
- Show genuine excitement about language learning
- Keep responses concise (2-3 sentences max for landing page context)
- Be specific and helpful when answering product questions
- Encourage users to join the waitlist to be first in line
- If asked unrelated questions, gently steer back to Mumble AI and language learning

IMPORTANT: Keep responses conversational and engaging - this is a landing page chat. Be enthusiastic but not salesy. Max 2-3 sentences per response."""

# Store active chat sessions (in production, use Redis or similar)
chat_sessions = {}

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"  # Energetic, upbeat - perfect for AI tutor
    speed: float = 1.0

class WaitlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WaitlistCreate(BaseModel):
    email: EmailStr

class ChatRequest(BaseModel):
    message: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# TTS endpoint
@api_router.post("/tts")
async def generate_speech(request: TTSRequest):
    try:
        audio_bytes = await tts.generate_speech(
            text=request.text,
            model="tts-1",
            voice=request.voice,
            speed=request.speed,
            response_format="mp3"
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        logging.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

# Waitlist endpoints
@api_router.post("/waitlist", response_model=WaitlistEntry)
async def join_waitlist(input: WaitlistCreate):
    # Check if email already exists
    existing = await db.waitlist.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already on waitlist")
    
    entry = WaitlistEntry(email=input.email)
    doc = entry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.waitlist.insert_one(doc)
    return entry

@api_router.get("/waitlist/check/{email}")
async def check_waitlist(email: str):
    existing = await db.waitlist.find_one({"email": email})
    return {"exists": existing is not None}

# Chat endpoint - conversation with Mia
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_mia(request: ChatRequest):
    try:
        session_id = request.session_id
        
        # Get or create chat session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = LlmChat(
                api_key=os.getenv("EMERGENT_LLM_KEY"),
                session_id=session_id,
                system_message=MIA_SYSTEM_PROMPT
            ).with_model("openai", "gpt-4.1-mini")
        
        chat = chat_sessions[session_id]
        
        # Send message and get response
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# Combined chat + TTS endpoint for voice responses
@api_router.post("/chat-voice")
async def chat_with_voice(request: ChatRequest):
    try:
        session_id = request.session_id
        
        # Get or create chat session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = LlmChat(
                api_key=os.getenv("EMERGENT_LLM_KEY"),
                session_id=session_id,
                system_message=MIA_SYSTEM_PROMPT
            ).with_model("openai", "gpt-4.1-mini")
        
        chat = chat_sessions[session_id]
        
        # Send message and get response
        user_message = UserMessage(text=request.message)
        text_response = await chat.send_message(user_message)
        
        # Generate speech from response
        audio_bytes = await tts.generate_speech(
            text=text_response,
            model="tts-1",
            voice="nova",
            speed=1.0,
            response_format="mp3"
        )
        
        # Return both text and audio
        import base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return {
            "response": text_response,
            "audio": audio_base64,
            "session_id": session_id
        }
    except Exception as e:
        logging.error(f"Chat voice error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat voice failed: {str(e)}")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()