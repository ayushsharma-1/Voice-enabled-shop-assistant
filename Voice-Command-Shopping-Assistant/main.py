from fastapi import FastAPI, UploadFile, File, HTTPException
import assemblyai as aai
import tempfile
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
import requests
import logging
from helper_function import validate_llm_response, find_closest_product
import datetime
from db import user_collection, store_collection, client
from sentence_transformers import SentenceTransformer
import faiss
from rapidfuzz import fuzz, process

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =================== ML EMBEDDINGS ===================
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def build_store_index():
    store_products = list(store_collection.find({}, {"_id": 0, "product": 1, "category": 1, "price": 1}))
    if not store_products:
        return None, []

    product_texts = [p["product"] for p in store_products]
    vectors = embedder.encode(product_texts, convert_to_numpy=True)

    dim = vectors.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)

    return index, store_products

faiss_index, store_products = build_store_index()


# ======================= ENVIRONMENT VARIABLES ======================
load_dotenv()

# Strict environment variable loading with error handling
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY environment variable is not set!")
    raise ValueError("GROQ_API_KEY environment variable is required")

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
if not ASSEMBLYAI_API_KEY:
    logger.error("ASSEMBLYAI_API_KEY environment variable is not set!")
    raise ValueError("ASSEMBLYAI_API_KEY environment variable is required")

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logger.error("MONGO_URI environment variable is not set!")
    raise ValueError("MONGO_URI environment variable is required")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
def process_command(user_text: str):
    """
    Takes a shopping voice command as text and returns structured JSON
    with product, quantity, category, action, status.
    """

    prompt = f"""
You are AI working as a store assistant. 
Parse the following user command into a JSON object with these exact fields:
If u  find the command irrelevent and found no information from that so just put a error message in all the key of json


- product: name of the item (string)
- quantity: number (default = 1 if not mentioned)
- category: guess item category (e.g., dairy, fruit, drinks, snacks, grains)
- action: one of ["add", "remove", "delete"]
- status: always "ai_generated"

User command: "{user_text}"

Return only valid JSON, no explanation.
"""

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",  # ✅ Groq recommended model
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
        )

        result = response.json()

        if "choices" not in result or not result["choices"]:
            return {"error": "Unexpected response from Groq", "raw": result}

        content = result["choices"][0]["message"]["content"].strip()

        # Extract JSON portion only
        json_start = content.find("{")
        json_end = content.rfind("}") + 1
        if json_start != -1 and json_end != -1:
            return json.loads(content[json_start:json_end])

        return {"error": "Could not parse JSON", "raw": content}

    except Exception as e:
        return {"error": str(e)}
    


# ======================= ASSEMBLY AI ===================
aai.settings.api_key = ASSEMBLYAI_API_KEY





# ======================= DATABASE INITIALIZATION ===================
def initialize_database():
    """Initialize database and create collections if they don't exist"""
    try:
        # Test database connection
        client.admin.command('ping')
        logger.info("✅ Database connection successful")
        
        # Check if store collection has data
        store_count = store_collection.count_documents({})
        logger.info(f"Store collection has {store_count} documents")
        
        if store_count == 0:
            logger.warning("⚠️ Store collection is empty. Please run seed_store.py to populate the store.")
        
        # Check if user collection exists
        user_count = user_collection.count_documents({})
        logger.info(f"User collection has {user_count} documents")
        
        return True
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        return False

# ===================== APP START =======================
app = FastAPI(title="Voice Shopping Assistant API", version="1.0.0")

# Enable CORS for frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting Voice Shopping Assistant API...")
    if not initialize_database():
        logger.error("❌ Failed to initialize database. Please check your MongoDB connection.")
        raise Exception("Database initialization failed")
    logger.info("✅ API startup completed successfully")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        client.admin.command('ping')
        store_count = store_collection.count_documents({})
        user_count = user_collection.count_documents({})
        
        return {
            "status": "healthy",
            "database": "connected",
            "store_items": store_count,
            "users": user_count,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.post("/recognise_text_to_llm")
async def recognise_text_to_llm(file: UploadFile = File(...)):
    try:
        logger.info("🎤 Voice recognition request initiated")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file.filename.lower().endswith(('.webm', '.wav', '.mp3', '.m4a')):
            raise HTTPException(status_code=400, detail="Unsupported audio format. Please use .webm, .wav, .mp3, or .m4a")
        
        # Save audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Empty audio file")
            
            temp_file.write(content)
            temp_path = temp_file.name
            logger.info(f"📁 Audio file saved temporarily: {temp_path}")

        try:
            # AssemblyAI transcription (English only)
            transcriber = aai.Transcriber()
            transcript = transcriber.transcribe(
                temp_path,
                config=aai.TranscriptionConfig(language_code="en")
            )

            if transcript.status == aai.TranscriptStatus.error:
                logger.error(f"❌ Transcription failed: {transcript.error}")
                raise HTTPException(status_code=500, detail=f"Transcription failed: {transcript.error}")

            logger.info(f"📝 Transcribed text: {transcript.text}")
            
            # Process command with LLM
            llm_response = process_command(transcript.text)
            logger.info(f"🤖 LLM response: {llm_response}")
            
            if validate_llm_response(llm_response):
                logger.info("✅ Voice command processed successfully")
                return {
                    "recognized_text": transcript.text,
                    "llm_response": llm_response
                }
            else:
                logger.error("❌ Invalid LLM response format")
                raise HTTPException(status_code=400, detail="Invalid AI response format")

        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
                logger.info(f"🗑️ Temporary file cleaned up: {temp_path}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to clean up temporary file: {e}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Voice recognition failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice recognition failed: {str(e)}")
    



def update_wishlist(username: str, llm_response: dict):
    try:
        logger.info(f"🔄 Updating wishlist for user: {username}")
        logger.info(f"📋 LLM Response: {llm_response}")
        
        if not validate_llm_response(llm_response):
            logger.error("❌ Invalid LLM response format")
            return {"error": "Invalid LLM response format"}

        llm_response["timestamp"] = datetime.datetime.utcnow().isoformat()
        action = llm_response["action"].lower()
        logger.info(f"🎯 Action: {action}")

        # ======================= ADD =======================
        if action == "add":
            # 🔎 Step 1: Check product in store
            store_item = store_collection.find_one(
                {"product": {"$regex": f"^{llm_response['product']}$", "$options": "i"}}
            )

            if not store_item:
                logger.error(f"❌ Product not found in store: {llm_response['product']}")
                return {"error": f"No item '{llm_response['product']}' found in store"}

            logger.info(f"🏪 Found store item: {store_item}")
            store_quantity = store_item.get("quantity", 0)
            requested_quantity = int(llm_response.get("quantity", 1))

            # 🔎 Step 2: Validate stock
            if requested_quantity > store_quantity:
                logger.warning(f"⚠️ Insufficient stock: requested {requested_quantity}, available {store_quantity}")
                return {
                    "error": f"Only {store_quantity} × {store_item['product']} available in store"
                }

            # ✅ Step 3: Add to wishlist + history
            result = user_collection.update_one(
                {"username": username},
                {
                    "$push": {
                        "wishlist": {
                            "product": store_item["product"],  # consistent name
                            "quantity": requested_quantity,
                            "category": store_item.get("category", llm_response["category"]),
                            "action": "add",
                            "status": llm_response["status"],
                            "timestamp": llm_response["timestamp"]
                        },
                        "historylist": llm_response
                    }
                },
                upsert=True
            )
            
            # ✅ Step 4: Update store stock by reducing quantity
            store_update_result = store_collection.update_one(
                {"product": store_item["product"]},
                {"$inc": {"quantity": -requested_quantity}}
            )
            
            logger.info(f"✅ Wishlist updated successfully. Modified count: {result.modified_count}")
            logger.info(f"✅ Store stock updated. Reduced {requested_quantity} units. Modified count: {store_update_result.modified_count}")
            
            return {"message": "Product added to wishlist and stock updated", "data": llm_response}

        # =================== REMOVE / DELETE ==================
        elif action in ["remove", "delete"]:
            user = user_collection.find_one({"username": username})
            if not user or "wishlist" not in user:
                logger.error(f"❌ No wishlist found for user: {username}")
                return {"error": "No wishlist found"}

            wishlist = user.get("wishlist", [])
            logger.info(f"📋 Current wishlist items: {[item['product'] for item in wishlist]}")
            
            closest = find_closest_product(llm_response["product"], wishlist)

            if not closest:
                logger.error(f"❌ No matching product found for: {llm_response['product']}")
                return {"error": f"No matching product found for '{llm_response['product']}'"}

            logger.info(f"🎯 Removing product: {closest['product']}")
            
            # ✅ Remove matched product and add to history
            result = user_collection.update_one(
                {"username": username},
                {
                    "$pull": {"wishlist": {"product": closest["product"]}},
                    "$push": {"historylist": llm_response}
                }
            )
            
            # ✅ Restore stock when item is removed from wishlist
            store_restore_result = store_collection.update_one(
                {"product": closest["product"]},
                {"$inc": {"quantity": closest["quantity"]}}
            )
            
            logger.info(f"✅ Product removed successfully. Modified count: {result.modified_count}")
            logger.info(f"✅ Store stock restored. Added back {closest['quantity']} units. Modified count: {store_restore_result.modified_count}")
            
            return {
                "message": f"Product '{closest['product']}' removed from wishlist and stock restored",
                "data": llm_response
            }

        # =================== UNKNOWN ==================
        else:
            logger.error(f"❌ Unsupported action: {action}")
            return {"error": f"Unsupported action: {llm_response['action']}"}

    except Exception as e:
        logger.error(f"❌ Wishlist update failed: {str(e)}")
        return {"error": f"Wishlist update failed: {str(e)}"}

    

@app.post("/update_wishlist/{username}")
async def update_wishlist_route(username: str, llm_response: dict):
    """
    Confirmed action from frontend → update MongoDB wishlist/history.
    """
    try:
        logger.info(f"📝 Wishlist update request for user: {username}")
        result = update_wishlist(username, llm_response)
        
        if "error" in result:
            logger.error(f"❌ Wishlist update failed: {result['error']}")
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"✅ Wishlist update successful: {result['message']}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in wishlist update: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/wishlist/{username}")
async def get_wishlist(username: str):
    try:
        logger.info(f"📋 Fetching wishlist for user: {username}")
        
        user = user_collection.find_one({"username": username}, {"_id": 0, "wishlist": 1})
        if not user:
            logger.info(f"👤 User not found: {username}, returning empty wishlist")
            return {"wishlist": []}  # empty if user not found
        
        wishlist = user.get("wishlist", [])
        logger.info(f"✅ Wishlist fetched successfully. Items: {len(wishlist)}")
        return {"wishlist": wishlist}
    except Exception as e:
        logger.error(f"❌ Failed to fetch wishlist: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch wishlist: {str(e)}")


@app.get("/recommendations/{username}")
def get_recommendations(username: str):
    try:
        logger.info(f"🎯 Fetching recommendations for user: {username}")
        
        user = user_collection.find_one({"username": username}, {"wishlist": 1})
        if not user or "wishlist" not in user:
            logger.info(f"👤 No wishlist found for user: {username}")
            return {"recommendations": [], "note": "No wishlist found"}

        wishlist = user["wishlist"]
        if not wishlist:
            logger.info(f"📋 Empty wishlist for user: {username}")
            return {"recommendations": [], "note": "Wishlist empty"}

        wishlist_products = [item["product"] for item in wishlist]
        wishlist_text = " ".join(wishlist_products)
        logger.info(f"📝 Wishlist text for recommendations: {wishlist_text}")

        query_vector = embedder.encode([wishlist_text], convert_to_numpy=True)
        distances, indices = faiss_index.search(query_vector, k=10)

        recs = []
        for idx in indices[0]:
            candidate = store_products[idx]
            if candidate["product"] not in wishlist_products:
                recs.append(candidate)

        logger.info(f"✅ Generated {len(recs[:5])} recommendations")
        return {"recommendations": recs[:5]}
    except Exception as e:
        logger.error(f"❌ Failed to generate recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


@app.get("/store")
def get_store_items():
    """Get all available products in the store"""
    try:
        logger.info("🏪 Fetching store items")
        
        store_items = list(store_collection.find({}, {"_id": 0}))
        logger.info(f"✅ Store items fetched successfully. Count: {len(store_items)}")
        
        if len(store_items) == 0:
            logger.warning("⚠️ Store is empty. Please run seed_store.py to populate the store.")
            return {"store_items": [], "note": "Store is empty. Please seed the database."}
        
        return {"store_items": store_items}
    except Exception as e:
        logger.error(f"❌ Failed to fetch store items: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch store items: {str(e)}")
