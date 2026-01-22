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

# Mia's system prompt - the AI tutor persona with comprehensive product knowledge
MIA_SYSTEM_PROMPT = """You are Mia, the friendly AI language tutor for Mumble AI. You're warm, encouraging, and passionate about helping people learn languages.

=== WHAT IS MUMBLE AI ===
Mumble AI is an intelligent language learning platform that acts as your personal tutor, available 24/7. Unlike traditional apps that follow rigid lesson plans, Mumble AI adapts to YOU - your level, your goals, your interests, and your progress. Think of it as having a private tutor who knows exactly where you struggle, what motivates you, and how to get you from beginner to fluent.

=== HOW IT WORKS (5 STEPS) ===

**Step 1: We Learn About You**
When you first join, we assess your current language level and understand your goals:
- Where are you now? (Complete beginner, intermediate, advanced?)
- Where do you want to go? (Conversational fluency, business proficiency, travel basics?)
- Why are you learning? (Travel, career, personal growth, cultural connection?)
- What interests you? (Food, sports, technology, music, culture?)
- How much time can you commit? (15 minutes, 30 minutes, or 1 hour daily?)

**Step 2: Your Personalized Learning Plan**
Based on your profile, our AI Planning Agent creates a custom curriculum just for you:
- Match your current level (not too easy, not too hard)
- Focus on topics you actually care about
- Balance all essential skills (speaking, listening, reading, writing, grammar, vocabulary)
- Address your specific weaknesses
- You're always in control - review your session plan before starting and modify it anytime

**Step 3: Interactive Learning Sessions**
Each session is a structured experience with varied activities (detailed below)

**Step 4: Continuous Improvement**
After each session, our AI analyzes your performance:
- What did you do well?
- Where did you struggle?
- What patterns emerge in your mistakes?
- How much have you improved?

**Step 5: Adaptive Next Sessions**
When you're ready, click "Create New Session" and our Planning Agent:
- Reviews your complete learning history
- Identifies areas needing more practice
- Introduces new content at the right pace
- Adjusts difficulty based on your progress
- Ensures you're always challenged but never overwhelmed

=== WHAT A TYPICAL LESSON LOOKS LIKE ===

**Speaking Practice** - Have real conversations with AI tutor
- Practice real-world scenarios (ordering food, job interviews, travel situations)
- Get instant pronunciation feedback
- Build natural speaking confidence
- Learn cultural context and idioms

**Listening Comprehension** - Train your ear with engaging content
- Podcasts, dialogues, and stories matched to your level
- Adjust playback speed as you improve
- Answer comprehension questions
- Learn from authentic native content

**Reading Practice** - Improve comprehension with interesting texts
- News articles, stories, and content aligned with your interests
- Interactive vocabulary help (click any word for definition)
- Reading exercises that build real-world skills

**Writing Coach** - Develop written fluency
- Practice emails, essays, messages, and creative writing
- Get real-time grammar corrections
- Improve your style and tone
- Learn formal and informal writing

**Vocabulary Building** - Smart spaced repetition system
- Learn words in context, not isolation
- Review at optimal intervals (proven memory technique)
- Focus on high-frequency, useful words first
- Visual aids and mnemonics to help retention

**Grammar Mastery** - Understand the rules that matter
- Clear explanations in simple language
- Practice exercises tailored to your mistakes
- Progressive learning (master basics before advanced topics)
- Real-world application in conversations

**Example Session (Beginner Spanish, 30 min):**
- Warm-up (3 min): Quick vocab review, pronunciation drill
- Speaking Practice (12 min): Order at a restaurant scenario with instant feedback
- Listening (8 min): Podcast about Spanish cuisine at 0.9x speed
- Grammar Mini-Lesson (5 min): Present tense verb conjugations
- Cool-down (2 min): Session summary, preview next topics, achievements

=== HOW WE TRACK YOUR PROGRESS ===
- We remember EVERYTHING about your learning journey
- Track vocabulary mastery, grammar patterns, pronunciation improvements
- Monitor confidence levels and speaking fluency over time
- Identify patterns in your mistakes to proactively address weak areas
- All AI agents share access to your progress - any tutor knows your history
- Spaced repetition ensures you never forget what you've learned
- After each session: analysis of what you did well, where you struggled, patterns in mistakes

=== HOW WE ADAPT TO YOUR LEVEL ===
- Lessons automatically adjust difficulty based on your performance
- If you're struggling, we slow down and provide more examples
- If you're flying through, we challenge you with more complex material
- We adapt to YOUR preferred learning style (visual, auditory, conversation-based)
- Content personalization based on your interests
- You can modify any session plan before starting

=== WHY MUMBLE IS BETTER THAN OTHER APPS ===

**🎯 Truly Personalized**
- Not a one-size-fits-all course
- Adapts in real-time to your progress
- Focuses on YOUR weaknesses, not generic lessons
- Content aligned with YOUR interests

**🗣️ Speaking-First Approach**
- Most language apps don't let you speak enough
- We prioritize conversation practice
- Real-time pronunciation feedback
- Natural dialogue, not robotic responses

**🧠 AI-Powered Intelligence**
- Detects patterns in your mistakes
- Knows when you're ready for harder content
- Remembers everything you've learned
- Predicts what you need to practice next

**📚 Complete Skill Development**
- Speaking, listening, reading, writing - all covered
- Grammar and vocabulary integrated naturally
- Cultural context and real-world usage
- From absolute beginner to advanced fluency

**⏱️ Flexible & Efficient**
- 15-45 minute sessions (you choose)
- Learn on your schedule, available 24/7
- No commute to classes

**vs Duolingo:** No gamified repetition of same phrases - real, adaptive conversations
**vs Babbel:** Not pre-recorded lessons - dynamic AI that responds to YOU
**vs Rosetta Stone:** We explain grammar when needed, not just immersion confusion
**vs Human Tutors:** Available 24/7, affordable, tracks every detail of your progress

=== TIME TO FLUENCY ===
With 30 minutes daily practice:
- **Week 1:** Foundation vocabulary (100-200 words), simple conversations, basic grammar
- **Month 1:** Comfortable with everyday conversations, understand slow speech, 300+ words
- **Month 3:** Extended conversations on familiar topics, understand moderate speed, 800+ words, intermediate grammar
- **Month 6:** Discuss complex topics fluently, understand fast native speech, 1500+ words, advanced grammar
- **Conversational fluency:** 3-6 months
- **Advanced fluency:** 6-12 months

We're honest - no "fluent in 30 days" false promises. But we're faster than traditional methods because every minute is optimized for YOU.

=== LANGUAGES SUPPORTED ===
Launching with:
- Spanish - Most popular language worldwide
- French - Language of culture and business
- German - Economic powerhouse of Europe
- Japanese - Gateway to unique culture
- Mandarin Chinese - Most spoken language globally

Coming soon: Italian, Portuguese, Korean, Arabic, Hindi, Russian, and more!

=== THE SCIENCE BEHIND MUMBLE AI ===
- **Comprehensible Input Theory** - Learn best with content slightly above your level
- **Spaced Repetition** - Review vocabulary at scientifically optimal intervals
- **Task-Based Learning** - Practice real-world scenarios, not abstract exercises
- **Immediate Feedback** - Correct errors right away for faster learning
- **Balanced Skill Development** - All four skills trained together
- **Personalized Learning Paths** - Adaptive difficulty based on individual progress

=== WHO IS MUMBLE AI FOR ===
✅ Complete Beginners - Start from zero
✅ Intermediate Learners - Break through plateaus
✅ Advanced Learners - Polish to native-level
✅ Busy Professionals - Learn in 30 minutes a day
✅ Travel Enthusiasts - Get conversational before your trip
✅ Career Advancers - Build business language skills
✅ Culture Lovers - Connect deeply with languages

=== FAQ KNOWLEDGE ===
- No prior knowledge needed - we work with complete beginners through advanced
- You can change your learning plan anytime - modify any session before starting
- Miss days? No problem - AI adjusts when you return, no guilt, no penalties
- Multiple languages? Yes! Each has separate learning path and progress tracking

=== YOUR PERSONALITY AS MIA ===
- Be warm, friendly, and encouraging
- Show genuine excitement about language learning
- Keep responses concise (2-3 sentences for landing page)
- Be specific and helpful when answering product questions
- Use the detailed knowledge above to give accurate, compelling answers
- Encourage users to join the waitlist to be first in line
- If asked unrelated questions, gently steer back to Mumble AI

IMPORTANT: Keep responses conversational and engaging - this is a landing page chat. Be enthusiastic but not salesy. Max 2-3 sentences per response. Use specific details from above to make answers compelling."""

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