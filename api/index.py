from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import jwt
import os
import json
import urllib.request
from datetime import datetime, timedelta

# Setup
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_SEEMON_APP")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days session
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        DATABASE_URL = "sqlite:////tmp/expenses.db"
    else:
        DATABASE_URL = "sqlite:///./expenses.db"

GOOGLE_SHEET_WEBHOOK_URL = os.getenv("GOOGLE_SHEET_WEBHOOK_URL", "")
APPSHEET_APP_ID = os.getenv("APPSHEET_APP_ID", "")
APPSHEET_ACCESS_KEY = os.getenv("APPSHEET_ACCESS_KEY", "")

def sync_to_google_sheet(username: str, items: list):
    if not GOOGLE_SHEET_WEBHOOK_URL:
        return
    try:
        payload = json.dumps({
            "username": username,
            "items": items
        }).encode("utf-8")
        req = urllib.request.Request(
            GOOGLE_SHEET_WEBHOOK_URL,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print("Google Sheet sync warning:", e)

def sync_to_appsheet(username: str, items: list):
    if not APPSHEET_APP_ID or not APPSHEET_ACCESS_KEY:
        return
    try:
        url = f"https://api.appsheet.com/api/v2/apps/{APPSHEET_APP_ID}/tables/Transactions/Action"
        rows = [{
            "Id": item.get("id"),
            "Username": username,
            "Type": item.get("type"),
            "Amount": item.get("amount"),
            "Category": item.get("cat"),
            "Date": item.get("date"),
            "Time": item.get("time", ""),
            "Note": item.get("note", "")
        } for item in items]
        payload = json.dumps({
            "Action": "Add",
            "Properties": { "Locale": "th-TH" },
            "Rows": rows
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={
            "ApplicationAccessKey": APPSHEET_ACCESS_KEY,
            "Content-Type": "application/json"
        })
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print("AppSheet sync warning:", e)

# SQLite needs check_same_thread=False, PostgreSQL does not
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class UserData(Base):
    __tablename__ = "userdata"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    items_json = Column(Text, default="[]")
    settings_json = Column(Text, default="{}")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="seemon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helpers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# API Routes
@app.post("/register")
@app.post("/api/register")
def register(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    try:
        username = username.strip()
        if not username or not password:
            raise HTTPException(status_code=400, detail="กรุณากรอก Username และ Password")
        if db.query(User).filter(User.username == username).first():
            raise HTTPException(status_code=400, detail="Username นี้ถูกใช้งานแล้ว")
        
        hashed_password = pwd_context.hash(password)
        user = User(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Init empty user data
        user_data = UserData(user_id=user.id, items_json="[]", settings_json="{}")
        db.add(user_data)
        db.commit()
        
        return {"message": "สมัครสมาชิกสำเร็จ"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.post("/token")
@app.post("/api/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username.strip()).first()
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Username หรือ Password ไม่ถูกต้อง")
    
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode({"sub": user.username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/data")
@app.get("/api/data")
def get_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = db.query(UserData).filter(UserData.user_id == user.id).first()
    if not data:
        return {"items": [], "settings": {}}
    try:
        items = json.loads(data.items_json) if data.items_json else []
    except Exception:
        items = []
    try:
        settings = json.loads(data.settings_json) if data.settings_json else {}
    except Exception:
        settings = {}
    return {"items": items, "settings": settings}

@app.post("/data")
@app.post("/api/data")
def save_data(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    userdata = db.query(UserData).filter(UserData.user_id == user.id).first()
    if not userdata:
        userdata = UserData(user_id=user.id)
        db.add(userdata)
    
    items = data.get("items", [])
    userdata.items_json = json.dumps(items)
    userdata.settings_json = json.dumps(data.get("settings", {}))
    db.commit()
    
    # Sync to Google Sheets (Free) or AppSheet
    sync_to_google_sheet(user.username, items)
    if APPSHEET_APP_ID and APPSHEET_ACCESS_KEY:
        sync_to_appsheet(user.username, items)
    
    return {"message": "Data saved successfully"}
