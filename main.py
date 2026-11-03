from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os
import json

# Setup
SECRET_KEY = "SUPER_SECRET_KEY_CHANGE_THIS"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

SQLALCHEMY_DATABASE_URL = "sqlite:///./expenses.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class UserData(Base):
    __tablename__ = "userdata"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    items_json = Column(Text)
    settings_json = Column(Text)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

# Endpoints
@app.post("/register")
def register(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == form.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_password = pwd_context.hash(form.password)
    user = User(username=form.username, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(UserData(user_id=user.id, items_json="[]", settings_json="{}"))
    db.commit()
    return {"message": "User created"}

@app.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode({"sub": user.username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/data")
def get_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = db.query(UserData).filter(UserData.user_id == user.id).first()
    return {"items": json.loads(data.items_json), "settings": json.loads(data.settings_json)}

@app.post("/api/data")
def save_data(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    userdata = db.query(UserData).filter(UserData.user_id == user.id).first()
    userdata.items_json = json.dumps(data.get("items", []))
    userdata.settings_json = json.dumps(data.get("settings", {}))
    db.commit()
    return {"message": "Data saved"}
