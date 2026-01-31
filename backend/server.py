from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import httpx
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'telenexus_secret_key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Evolution API Configuration
EVOLUTION_API_URL = os.environ.get('EVOLUTION_API_URL', '').rstrip('/')
EVOLUTION_API_KEY = os.environ.get('EVOLUTION_API_KEY', '')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Telenexus API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    company: Optional[str] = None
    created_at: str
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class InstanceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class InstanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    user_id: str
    status: str  # disconnected, connecting, connected
    phone_number: Optional[str] = None
    created_at: str
    updated_at: str
    qr_code: Optional[str] = None
    evolution_instance_name: Optional[str] = None

class MessageSend(BaseModel):
    phone_number: str
    message: str
    message_type: str = "text"

class ButtonItem(BaseModel):
    id: str
    text: str

class InteractiveMessageSend(BaseModel):
    phone_number: str
    title: str
    description: str
    footer: Optional[str] = None
    buttons: List[ButtonItem]

class BillingNotificationSend(BaseModel):
    phone_number: str
    customer_name: str
    amount: float
    currency: str = "KES"
    invoice_id: str
    due_date: Optional[str] = None
    message_type: str = "payment_reminder"  # payment_reminder, invoice, overdue, confirmation
    payment_url: Optional[str] = None
    invoice_url: Optional[str] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    instance_id: str
    phone_number: str
    message: str
    message_type: str
    direction: str  # incoming, outgoing
    status: str  # pending, sent, delivered, read, failed
    created_at: str

class WebhookCreate(BaseModel):
    url: str
    events: List[str]  # message.received, message.sent, instance.connected, etc.
    is_active: bool = True

class WebhookResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    instance_id: str
    url: str
    events: List[str]
    is_active: bool
    created_at: str
    last_triggered: Optional[str] = None

class APIKeyCreate(BaseModel):
    name: str
    permissions: List[str] = ["send_message", "receive_message"]

class APIKeyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    key: str
    permissions: List[str]
    user_id: str
    is_active: bool = True
    created_at: str
    last_used: Optional[str] = None

class LogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    instance_id: Optional[str] = None
    action: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: str

class DashboardStats(BaseModel):
    total_instances: int
    connected_instances: int
    total_messages: int
    messages_today: int
    total_webhooks: int
    active_api_keys: int

# ===================== EVOLUTION API CLIENT =====================

class EvolutionAPIClient:
    """Client for interacting with Evolution API"""
    
    def __init__(self):
        self.base_url = EVOLUTION_API_URL
        self.api_key = EVOLUTION_API_KEY
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def create_instance(self, instance_name: str) -> Dict[str, Any]:
        """Create a new WhatsApp instance in Evolution API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "instanceName": instance_name,
                "qrcode": True,
                "integration": "WHATSAPP-BAILEYS"
            }
            response = await client.post(
                f"{self.base_url}/instance/create",
                json=payload,
                headers=self.headers
            )
            logger.info(f"Evolution API create instance response: {response.status_code}")
            if response.status_code not in [200, 201]:
                logger.error(f"Evolution API error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Evolution API error: {response.text}")
            return response.json()
    
    async def get_instance_connection_state(self, instance_name: str) -> Dict[str, Any]:
        """Get connection state of an instance"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/instance/connectionState/{instance_name}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return {"state": "close"}
    
    async def get_qr_code(self, instance_name: str) -> Dict[str, Any]:
        """Get QR code for an instance"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/instance/connect/{instance_name}",
                headers=self.headers
            )
            logger.info(f"Evolution API QR code response: {response.status_code}")
            if response.status_code == 200:
                return response.json()
            return None
    
    async def delete_instance(self, instance_name: str) -> bool:
        """Delete an instance from Evolution API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{self.base_url}/instance/delete/{instance_name}",
                headers=self.headers
            )
            return response.status_code in [200, 204]
    
    async def logout_instance(self, instance_name: str) -> bool:
        """Logout/disconnect an instance"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{self.base_url}/instance/logout/{instance_name}",
                headers=self.headers
            )
            return response.status_code in [200, 204]
    
    async def send_text_message(self, instance_name: str, phone_number: str, message: str) -> Dict[str, Any]:
        """Send a text message via Evolution API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Format phone number - remove any non-numeric chars and ensure proper format
            clean_number = ''.join(filter(str.isdigit, phone_number))
            if not clean_number.endswith("@s.whatsapp.net"):
                clean_number = f"{clean_number}@s.whatsapp.net"
            
            payload = {
                "number": clean_number.replace("@s.whatsapp.net", ""),
                "text": message
            }
            response = await client.post(
                f"{self.base_url}/message/sendText/{instance_name}",
                json=payload,
                headers=self.headers
            )
            logger.info(f"Evolution API send message response: {response.status_code}")
            if response.status_code not in [200, 201]:
                logger.error(f"Evolution API send error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Failed to send message: {response.text}")
            return response.json()
    
    async def fetch_instances(self) -> List[Dict[str, Any]]:
        """Fetch all instances from Evolution API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/instance/fetchInstances",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return []
    
    async def get_instance_info(self, instance_name: str) -> Dict[str, Any]:
        """Get instance information including connection details"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/instance/fetchInstances",
                headers=self.headers,
                params={"instanceName": instance_name}
            )
            if response.status_code == 200:
                instances = response.json()
                for inst in instances:
                    if inst.get("instance", {}).get("instanceName") == instance_name:
                        return inst
            return None

# Global Evolution API client
evolution_client = EvolutionAPIClient()

# ===================== HELPERS =====================

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def generate_api_key() -> str:
    return f"tnx_{secrets.token_urlsafe(32)}"

def generate_instance_name(user_id: str, instance_name: str) -> str:
    """Generate a unique Evolution instance name"""
    short_id = user_id[:8]
    clean_name = ''.join(c for c in instance_name if c.isalnum() or c in '-_')[:20]
    return f"tnx_{short_id}_{clean_name}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def verify_api_key(api_key: str):
    """Verify API key and return associated user"""
    key_doc = await db.api_keys.find_one({"key": api_key, "is_active": True}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Update last used
    await db.api_keys.update_one(
        {"key": api_key},
        {"$set": {"last_used": datetime.now(timezone.utc).isoformat()}}
    )
    
    user = await db.users.find_one({"id": key_doc["user_id"]}, {"_id": 0})
    return user, key_doc

async def log_activity(user_id: str, action: str, instance_id: str = None, details: dict = None, ip_address: str = None):
    """Log user activity"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "instance_id": instance_id,
        "action": action,
        "details": details,
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.logs.insert_one(log_entry)

async def trigger_webhooks(instance_id: str, event: str, data: dict):
    """Trigger webhooks for an event"""
    webhooks = await db.webhooks.find({
        "instance_id": instance_id,
        "is_active": True,
        "events": event
    }, {"_id": 0}).to_list(100)
    
    for webhook in webhooks:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    webhook["url"],
                    json={"event": event, "data": data},
                    timeout=10.0
                )
            await db.webhooks.update_one(
                {"id": webhook["id"]},
                {"$set": {"last_triggered": datetime.now(timezone.utc).isoformat()}}
            )
        except Exception as e:
            logger.error(f"Webhook delivery failed: {e}")

def map_evolution_state_to_status(state: str) -> str:
    """Map Evolution API connection state to our status"""
    state_mapping = {
        "open": "connected",
        "connecting": "connecting",
        "close": "disconnected",
        "closed": "disconnected"
    }
    return state_mapping.get(state.lower(), "disconnected")

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "company": user_data.company,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    await log_activity(user_id, "user.registered")
    
    access_token = create_access_token({"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        company=user_data.company,
        created_at=now,
        is_active=True
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    await log_activity(user["id"], "user.login")
    
    access_token = create_access_token({"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        company=user.get("company"),
        created_at=user["created_at"],
        is_active=user.get("is_active", True)
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        company=current_user.get("company"),
        created_at=current_user["created_at"],
        is_active=current_user.get("is_active", True)
    )

# ===================== INSTANCE ROUTES =====================

@api_router.post("/instances", response_model=InstanceResponse)
async def create_instance(instance_data: InstanceCreate, current_user: dict = Depends(get_current_user)):
    instance_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate unique Evolution instance name
    evolution_instance_name = generate_instance_name(current_user["id"], instance_data.name)
    
    # Create instance in Evolution API
    try:
        evolution_response = await evolution_client.create_instance(evolution_instance_name)
        logger.info(f"Evolution instance created: {evolution_response}")
    except Exception as e:
        logger.error(f"Failed to create Evolution instance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create WhatsApp instance: {str(e)}")
    
    # Extract QR code from response
    qr_code = None
    if evolution_response:
        qr_data = evolution_response.get("qrcode", {})
        if isinstance(qr_data, dict):
            qr_code = qr_data.get("base64")
        elif isinstance(qr_data, str):
            qr_code = qr_data
    
    instance_doc = {
        "id": instance_id,
        "name": instance_data.name,
        "description": instance_data.description,
        "user_id": current_user["id"],
        "status": "disconnected",
        "phone_number": None,
        "evolution_instance_name": evolution_instance_name,
        "created_at": now,
        "updated_at": now
    }
    
    await db.instances.insert_one(instance_doc)
    await log_activity(current_user["id"], "instance.created", instance_id, {"evolution_name": evolution_instance_name})
    
    return InstanceResponse(
        id=instance_id,
        name=instance_data.name,
        description=instance_data.description,
        user_id=current_user["id"],
        status="disconnected",
        phone_number=None,
        created_at=now,
        updated_at=now,
        qr_code=qr_code,
        evolution_instance_name=evolution_instance_name
    )

@api_router.get("/instances", response_model=List[InstanceResponse])
async def get_instances(current_user: dict = Depends(get_current_user)):
    instances = await db.instances.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Update status from Evolution API for each instance
    result = []
    for inst in instances:
        status = inst.get("status", "disconnected")
        phone_number = inst.get("phone_number")
        
        if inst.get("evolution_instance_name"):
            try:
                state_response = await evolution_client.get_instance_connection_state(inst["evolution_instance_name"])
                if state_response:
                    state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
                    status = map_evolution_state_to_status(state)
                    
                    # Get phone number if connected
                    if status == "connected":
                        info = await evolution_client.get_instance_info(inst["evolution_instance_name"])
                        if info:
                            owner = info.get("instance", {}).get("owner")
                            if owner:
                                phone_number = owner.replace("@s.whatsapp.net", "")
            except Exception as e:
                logger.warning(f"Could not get Evolution state for {inst.get('evolution_instance_name')}: {e}")
        
        # Update local status if changed
        if status != inst.get("status") or phone_number != inst.get("phone_number"):
            await db.instances.update_one(
                {"id": inst["id"]},
                {"$set": {"status": status, "phone_number": phone_number, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        result.append(InstanceResponse(
            id=inst["id"],
            name=inst["name"],
            description=inst.get("description"),
            user_id=inst["user_id"],
            status=status,
            phone_number=phone_number,
            created_at=inst["created_at"],
            updated_at=inst["updated_at"],
            qr_code=None,
            evolution_instance_name=inst.get("evolution_instance_name")
        ))
    
    return result

@api_router.get("/instances/{instance_id}", response_model=InstanceResponse)
async def get_instance(instance_id: str, current_user: dict = Depends(get_current_user)):
    instance = await db.instances.find_one(
        {"id": instance_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    status = instance.get("status", "disconnected")
    phone_number = instance.get("phone_number")
    qr_code = None
    
    # Get current status and QR from Evolution API
    if instance.get("evolution_instance_name"):
        try:
            state_response = await evolution_client.get_instance_connection_state(instance["evolution_instance_name"])
            if state_response:
                state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
                status = map_evolution_state_to_status(state)
                
                # Get phone number if connected
                if status == "connected":
                    info = await evolution_client.get_instance_info(instance["evolution_instance_name"])
                    if info:
                        owner = info.get("instance", {}).get("owner")
                        if owner:
                            phone_number = owner.replace("@s.whatsapp.net", "")
            
            # Get QR code if not connected
            if status != "connected":
                qr_response = await evolution_client.get_qr_code(instance["evolution_instance_name"])
                if qr_response:
                    qr_code = qr_response.get("base64") or qr_response.get("qrcode", {}).get("base64")
        except Exception as e:
            logger.warning(f"Could not get Evolution data for {instance.get('evolution_instance_name')}: {e}")
    
    # Update local status if changed
    if status != instance.get("status") or phone_number != instance.get("phone_number"):
        await db.instances.update_one(
            {"id": instance_id},
            {"$set": {"status": status, "phone_number": phone_number, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return InstanceResponse(
        id=instance["id"],
        name=instance["name"],
        description=instance.get("description"),
        user_id=instance["user_id"],
        status=status,
        phone_number=phone_number,
        created_at=instance["created_at"],
        updated_at=instance["updated_at"],
        qr_code=qr_code,
        evolution_instance_name=instance.get("evolution_instance_name")
    )

@api_router.delete("/instances/{instance_id}")
async def delete_instance(instance_id: str, current_user: dict = Depends(get_current_user)):
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Delete from Evolution API
    if instance.get("evolution_instance_name"):
        try:
            await evolution_client.delete_instance(instance["evolution_instance_name"])
        except Exception as e:
            logger.warning(f"Could not delete Evolution instance: {e}")
    
    # Delete from local database
    await db.instances.delete_one({"id": instance_id})
    
    # Delete related data
    await db.messages.delete_many({"instance_id": instance_id})
    await db.webhooks.delete_many({"instance_id": instance_id})
    
    await log_activity(current_user["id"], "instance.deleted", instance_id)
    
    return {"message": "Instance deleted successfully"}

@api_router.post("/instances/{instance_id}/connect")
async def connect_instance(instance_id: str, current_user: dict = Depends(get_current_user)):
    """Get QR code to connect an instance"""
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    if not instance.get("evolution_instance_name"):
        raise HTTPException(status_code=400, detail="Instance not properly configured")
    
    # Get QR code from Evolution API
    try:
        qr_response = await evolution_client.get_qr_code(instance["evolution_instance_name"])
        qr_code = None
        if qr_response:
            qr_code = qr_response.get("base64") or qr_response.get("qrcode", {}).get("base64")
        
        now = datetime.now(timezone.utc).isoformat()
        await db.instances.update_one(
            {"id": instance_id},
            {"$set": {"status": "connecting", "updated_at": now}}
        )
        
        await log_activity(current_user["id"], "instance.connect_requested", instance_id)
        
        return {"message": "Scan the QR code to connect", "qr_code": qr_code, "status": "connecting"}
    except Exception as e:
        logger.error(f"Failed to get QR code: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get QR code: {str(e)}")

@api_router.post("/instances/{instance_id}/disconnect")
async def disconnect_instance(instance_id: str, current_user: dict = Depends(get_current_user)):
    """Disconnect an instance"""
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    if instance.get("evolution_instance_name"):
        try:
            await evolution_client.logout_instance(instance["evolution_instance_name"])
        except Exception as e:
            logger.warning(f"Could not logout Evolution instance: {e}")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.instances.update_one(
        {"id": instance_id},
        {"$set": {"status": "disconnected", "updated_at": now}}
    )
    
    await log_activity(current_user["id"], "instance.disconnected", instance_id)
    await trigger_webhooks(instance_id, "instance.disconnected", {"instance_id": instance_id})
    
    return {"message": "Instance disconnected successfully"}

@api_router.get("/instances/{instance_id}/qr")
async def get_qr_code(instance_id: str, current_user: dict = Depends(get_current_user)):
    """Get QR code for an instance"""
    instance = await db.instances.find_one(
        {"id": instance_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Check if already connected
    if instance.get("evolution_instance_name"):
        try:
            state_response = await evolution_client.get_instance_connection_state(instance["evolution_instance_name"])
            if state_response:
                state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
                if state == "open":
                    return {"qr_code": None, "message": "Instance already connected"}
        except Exception as e:
            logger.warning(f"Could not check Evolution state: {e}")
    
    # Get QR code from Evolution API
    qr_code = None
    if instance.get("evolution_instance_name"):
        try:
            qr_response = await evolution_client.get_qr_code(instance["evolution_instance_name"])
            if qr_response:
                qr_code = qr_response.get("base64") or qr_response.get("qrcode", {}).get("base64")
        except Exception as e:
            logger.warning(f"Could not get QR code: {e}")
    
    return {"qr_code": qr_code}

# ===================== MESSAGE ROUTES =====================

@api_router.post("/instances/{instance_id}/messages/send", response_model=MessageResponse)
async def send_message(
    instance_id: str,
    message_data: MessageSend,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    if not instance.get("evolution_instance_name"):
        raise HTTPException(status_code=400, detail="Instance not properly configured")
    
    # Check connection status
    try:
        state_response = await evolution_client.get_instance_connection_state(instance["evolution_instance_name"])
        state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
        if state != "open":
            raise HTTPException(status_code=400, detail="Instance is not connected. Please scan QR code first.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not verify connection status: {str(e)}")
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Send message via Evolution API
    try:
        evolution_response = await evolution_client.send_text_message(
            instance["evolution_instance_name"],
            message_data.phone_number,
            message_data.message
        )
        message_status = "sent"
        logger.info(f"Message sent via Evolution API: {evolution_response}")
    except Exception as e:
        logger.error(f"Failed to send message via Evolution API: {e}")
        message_status = "failed"
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
    
    message_doc = {
        "id": message_id,
        "instance_id": instance_id,
        "phone_number": message_data.phone_number,
        "message": message_data.message,
        "message_type": message_data.message_type,
        "direction": "outgoing",
        "status": message_status,
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    await log_activity(current_user["id"], "message.sent", instance_id, {"to": message_data.phone_number})
    
    # Trigger webhooks in background
    background_tasks.add_task(
        trigger_webhooks,
        instance_id,
        "message.sent",
        {"message_id": message_id, "to": message_data.phone_number}
    )
    
    return MessageResponse(**{k: v for k, v in message_doc.items() if k != "_id"})

@api_router.get("/instances/{instance_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    instance_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    messages = await db.messages.find(
        {"instance_id": instance_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    return [MessageResponse(**msg) for msg in messages]

# ===================== WEBHOOK ROUTES =====================

@api_router.post("/instances/{instance_id}/webhooks", response_model=WebhookResponse)
async def create_webhook(
    instance_id: str,
    webhook_data: WebhookCreate,
    current_user: dict = Depends(get_current_user)
):
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    webhook_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    webhook_doc = {
        "id": webhook_id,
        "instance_id": instance_id,
        "user_id": current_user["id"],
        "url": webhook_data.url,
        "events": webhook_data.events,
        "is_active": webhook_data.is_active,
        "created_at": now,
        "last_triggered": None
    }
    
    await db.webhooks.insert_one(webhook_doc)
    await log_activity(current_user["id"], "webhook.created", instance_id)
    
    return WebhookResponse(**{k: v for k, v in webhook_doc.items() if k not in ["_id", "user_id"]})

@api_router.get("/instances/{instance_id}/webhooks", response_model=List[WebhookResponse])
async def get_webhooks(instance_id: str, current_user: dict = Depends(get_current_user)):
    instance = await db.instances.find_one({"id": instance_id, "user_id": current_user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    webhooks = await db.webhooks.find(
        {"instance_id": instance_id},
        {"_id": 0, "user_id": 0}
    ).to_list(100)
    
    return [WebhookResponse(**wh) for wh in webhooks]

@api_router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.webhooks.delete_one({"id": webhook_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    await log_activity(current_user["id"], "webhook.deleted")
    return {"message": "Webhook deleted successfully"}

@api_router.post("/webhooks/{webhook_id}/test")
async def test_webhook(webhook_id: str, current_user: dict = Depends(get_current_user)):
    webhook = await db.webhooks.find_one({"id": webhook_id, "user_id": current_user["id"]}, {"_id": 0})
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook["url"],
                json={"event": "test", "data": {"message": "This is a test webhook from Telenexus"}},
                timeout=10.0
            )
        return {"success": True, "status_code": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ===================== API KEY ROUTES =====================

@api_router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(key_data: APIKeyCreate, current_user: dict = Depends(get_current_user)):
    key_id = str(uuid.uuid4())
    api_key = generate_api_key()
    now = datetime.now(timezone.utc).isoformat()
    
    key_doc = {
        "id": key_id,
        "name": key_data.name,
        "key": api_key,
        "permissions": key_data.permissions,
        "user_id": current_user["id"],
        "is_active": True,
        "created_at": now,
        "last_used": None
    }
    
    await db.api_keys.insert_one(key_doc)
    await log_activity(current_user["id"], "api_key.created")
    
    return APIKeyResponse(**{k: v for k, v in key_doc.items() if k != "_id"})

@api_router.get("/api-keys", response_model=List[APIKeyResponse])
async def get_api_keys(current_user: dict = Depends(get_current_user)):
    keys = await db.api_keys.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Mask keys for security (show only first 10 chars)
    for key in keys:
        key["key"] = key["key"][:14] + "..." + key["key"][-4:]
    
    return [APIKeyResponse(**k) for k in keys]

@api_router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.api_keys.update_one(
        {"id": key_id, "user_id": current_user["id"]},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    
    await log_activity(current_user["id"], "api_key.revoked")
    return {"message": "API key revoked successfully"}

# ===================== LOG ROUTES =====================

@api_router.get("/logs", response_model=List[LogResponse])
async def get_logs(
    limit: int = 50,
    instance_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    if instance_id:
        query["instance_id"] = instance_id
    
    logs = await db.logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [LogResponse(**log) for log in logs]

# ===================== DASHBOARD ROUTES =====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Get instance stats
    instances = await db.instances.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total_instances = len(instances)
    
    # Update status from Evolution API and count connected
    connected_instances = 0
    for inst in instances:
        if inst.get("evolution_instance_name"):
            try:
                state_response = await evolution_client.get_instance_connection_state(inst["evolution_instance_name"])
                if state_response:
                    state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
                    if state == "open":
                        connected_instances += 1
            except:
                pass
    
    # Get message stats
    total_messages = await db.messages.count_documents({
        "instance_id": {"$in": [i["id"] for i in instances]}
    })
    
    # Messages today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = await db.messages.count_documents({
        "instance_id": {"$in": [i["id"] for i in instances]},
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    # Webhook and API key counts
    total_webhooks = await db.webhooks.count_documents({"user_id": user_id, "is_active": True})
    active_api_keys = await db.api_keys.count_documents({"user_id": user_id, "is_active": True})
    
    return DashboardStats(
        total_instances=total_instances,
        connected_instances=connected_instances,
        total_messages=total_messages,
        messages_today=messages_today,
        total_webhooks=total_webhooks,
        active_api_keys=active_api_keys
    )

# ===================== PUBLIC API (Using API Key) =====================

@api_router.post("/v1/send-message")
async def api_send_message(
    instance_id: str,
    message_data: MessageSend,
    background_tasks: BackgroundTasks,
    authorization: str = None
):
    """Public API endpoint for sending messages using API key"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="API key required")
    
    api_key = authorization.replace("Bearer ", "")
    user, key_doc = await verify_api_key(api_key)
    
    if "send_message" not in key_doc.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    instance = await db.instances.find_one({"id": instance_id, "user_id": user["id"]})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    if not instance.get("evolution_instance_name"):
        raise HTTPException(status_code=400, detail="Instance not properly configured")
    
    # Check connection status
    try:
        state_response = await evolution_client.get_instance_connection_state(instance["evolution_instance_name"])
        state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
        if state != "open":
            raise HTTPException(status_code=400, detail="Instance is not connected")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not verify connection status: {str(e)}")
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Send message via Evolution API
    try:
        await evolution_client.send_text_message(
            instance["evolution_instance_name"],
            message_data.phone_number,
            message_data.message
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
    
    message_doc = {
        "id": message_id,
        "instance_id": instance_id,
        "phone_number": message_data.phone_number,
        "message": message_data.message,
        "message_type": message_data.message_type,
        "direction": "outgoing",
        "status": "sent",
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    
    background_tasks.add_task(
        trigger_webhooks,
        instance_id,
        "message.sent",
        {"message_id": message_id, "to": message_data.phone_number}
    )
    
    return {"success": True, "message_id": message_id}

@api_router.get("/v1/instance-status")
async def api_get_status(instance_id: str, authorization: str = None):
    """Public API endpoint for getting instance status using API key"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="API key required")
    
    api_key = authorization.replace("Bearer ", "")
    user, _ = await verify_api_key(api_key)
    
    instance = await db.instances.find_one(
        {"id": instance_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    status = "disconnected"
    phone_number = instance.get("phone_number")
    
    if instance.get("evolution_instance_name"):
        try:
            state_response = await evolution_client.get_instance_connection_state(instance["evolution_instance_name"])
            if state_response:
                state = state_response.get("instance", {}).get("state") or state_response.get("state", "close")
                status = map_evolution_state_to_status(state)
        except:
            pass
    
    return {
        "instance_id": instance["id"],
        "status": status,
        "phone_number": phone_number,
        "name": instance["name"]
    }

# ===================== EVOLUTION WEBHOOK RECEIVER =====================

@api_router.post("/evolution/webhook")
async def evolution_webhook_receiver(request: Request, background_tasks: BackgroundTasks):
    """Receive webhooks from Evolution API"""
    try:
        payload = await request.json()
        logger.info(f"Received Evolution webhook: {json.dumps(payload, default=str)[:500]}")
        
        event = payload.get("event")
        instance_data = payload.get("instance")
        instance_name = payload.get("instanceName") or (instance_data.get("instanceName") if instance_data else None)
        
        if not instance_name:
            return {"status": "ignored", "reason": "no instance name"}
        
        # Find our instance by evolution_instance_name
        instance = await db.instances.find_one({"evolution_instance_name": instance_name}, {"_id": 0})
        if not instance:
            return {"status": "ignored", "reason": "instance not found"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Handle different event types
        if event == "connection.update":
            state = payload.get("data", {}).get("state") or payload.get("state", "close")
            status = map_evolution_state_to_status(state)
            
            # Get phone number if connected
            phone_number = instance.get("phone_number")
            if status == "connected":
                owner = payload.get("data", {}).get("owner")
                if owner:
                    phone_number = owner.replace("@s.whatsapp.net", "")
            
            await db.instances.update_one(
                {"id": instance["id"]},
                {"$set": {"status": status, "phone_number": phone_number, "updated_at": now}}
            )
            
            # Trigger user webhooks
            background_tasks.add_task(
                trigger_webhooks,
                instance["id"],
                f"instance.{status}",
                {"instance_id": instance["id"], "status": status}
            )
        
        elif event in ["messages.upsert", "messages.update"]:
            # Handle incoming messages
            messages = payload.get("data", [])
            if not isinstance(messages, list):
                messages = [messages] if messages else []
            
            for msg in messages:
                if msg.get("key", {}).get("fromMe"):
                    continue  # Skip outgoing messages
                
                message_id = str(uuid.uuid4())
                sender = msg.get("key", {}).get("remoteJid", "").replace("@s.whatsapp.net", "")
                text = msg.get("message", {}).get("conversation") or msg.get("message", {}).get("extendedTextMessage", {}).get("text", "")
                
                if text:
                    message_doc = {
                        "id": message_id,
                        "instance_id": instance["id"],
                        "phone_number": sender,
                        "message": text,
                        "message_type": "text",
                        "direction": "incoming",
                        "status": "received",
                        "created_at": now
                    }
                    await db.messages.insert_one(message_doc)
                    
                    background_tasks.add_task(
                        trigger_webhooks,
                        instance["id"],
                        "message.received",
                        {"message_id": message_id, "from": sender, "text": text}
                    )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Error processing Evolution webhook: {e}")
        return {"status": "error", "message": str(e)}

# ===================== HEALTH CHECK =====================

@api_router.get("/")
async def root():
    return {"message": "Telenexus API v1.0", "status": "operational", "evolution_api": EVOLUTION_API_URL}

@api_router.get("/health")
async def health_check():
    # Check Evolution API connectivity
    evolution_status = "unknown"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{EVOLUTION_API_URL}/", headers={"apikey": EVOLUTION_API_KEY})
            evolution_status = "connected" if response.status_code == 200 else f"error: {response.status_code}"
    except Exception as e:
        evolution_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "evolution_api": evolution_status
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
