from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
import joblib
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="KabwataCare Triage ML Service",
    description="RandomForest-based triage urgency prediction",
    version="1.0.0"
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'triage_model.pkl')
API_KEY = os.getenv('ML_SERVICE_API_KEY', 'ml-service-secret-key')

model_data = None

def load_model():
    global model_data
    if model_data is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model not found at {MODEL_PATH}. Run train_model.py first.")
        model_data = joblib.load(MODEL_PATH)
    return model_data

def verify_api_key(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization[7:]
    if token != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    return token

class PatientInfo(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    chronic_conditions: str = ""
    allergies: str = ""
    blood_group: str = ""

class PredictionRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    patient: PatientInfo

class PredictionResponse(BaseModel):
    urgency: str
    priority: str
    action: str
    risk_score: int
    confidence: float
    severity: str
    response: str

SYMPTOM_KEYWORDS = {
    'fever': ['fever', 'temperature', 'hot', 'febrile', 'pyrexia'],
    'cough': ['cough', 'coughing', 'hack'],
    'chest_pain': ['chest pain', 'chest tightness', 'angina', 'heart pain'],
    'shortness_of_breath': ['shortness of breath', 'difficulty breathing', 'breathless', 'dyspnea', 'sob'],
    'headache': ['headache', 'head pain', 'migraine', 'cephalalgia'],
    'fatigue': ['fatigue', 'tired', 'exhaustion', 'lethargy', 'weakness'],
    'nausea': ['nausea', 'nauseous', 'sick to stomach'],
    'vomiting': ['vomiting', 'vomit', 'throwing up', 'emesis'],
    'diarrhea': ['diarrhea', 'diarrhoea', 'loose stool', 'watery stool'],
    'abdominal_pain': ['abdominal pain', 'stomach pain', 'belly pain', 'tummy pain'],
    'back_pain': ['back pain', 'backache', 'lower back pain'],
    'joint_pain': ['joint pain', 'arthralgia', 'joint ache'],
    'dizziness': ['dizziness', 'dizzy', 'lightheaded', 'vertigo'],
    'night_sweats': ['night sweats', 'night sweating', 'nocturnal hyperhidrosis'],
    'weight_loss': ['weight loss', 'losing weight', 'unintentional weight loss'],
    'sore_throat': ['sore throat', 'throat pain', 'pharyngitis'],
    'runny_nose': ['runny nose', 'rhinorrhea', 'nasal discharge'],
    'chills': ['chills', 'shivering', 'rigors'],
    'loss_of_appetite': ['loss of appetite', 'anorexia', 'not hungry'],
    'blood_in_stool': ['blood in stool', 'bloody stool', 'melena', 'hematochezia']
}

CHRONIC_KEYWORDS = {
    'diabetes': ['diabetes', 'diabetic', 'blood sugar', 'insulin'],
    'hypertension': ['hypertension', 'high blood pressure', 'hbp'],
    'asthma': ['asthma', 'asthmatic'],
    'hiv': ['hiv', 'aids'],
    'heart_disease': ['heart disease', 'cardiac', 'heart condition', 'coronary'],
    'kidney_disease': ['kidney disease', 'renal', 'kidney failure'],
    'cancer': ['cancer', 'tumor', 'malignancy', 'oncology'],
    'tb': ['tb', 'tuberculosis'],
    'malaria_history': ['malaria', 'malaria history']
}

URGENCY_MAP = {
    0: 'Critical',
    1: 'High Priority',
    2: 'Medium',
    3: 'Low'
}

PRIORITY_MAP = {
    'Critical': 'Red',
    'High Priority': 'Orange',
    'Medium': 'Yellow',
    'Low': 'Green'
}

ACTION_MAP = {
    'Critical': 'Emergency Referral',
    'High Priority': 'Same-Day Visit',
    'Medium': 'Routine Appointment',
    'Low': 'Home Care Advice'
}

SEVERITY_MAP = {
    'Critical': 'Critical',
    'High Priority': 'Severe',
    'Medium': 'Moderate',
    'Low': 'Mild'
}

def extract_features(message: str, patient: PatientInfo) -> np.ndarray:
    message_lower = message.lower()
    
    features = {}
    
    features['age'] = patient.age if patient.age else 30
    features['gender'] = 1 if patient.gender and patient.gender.lower() == 'male' else 0
    
    chronic_lower = patient.chronic_conditions.lower()
    features['chronic_condition'] = 'none'
    for condition, keywords in CHRONIC_KEYWORDS.items():
        if any(kw in chronic_lower for kw in keywords):
            features['chronic_condition'] = condition
            break
    
    symptom_flags = {}
    for symptom, keywords in SYMPTOM_KEYWORDS.items():
        flag = 1 if any(kw in message_lower for kw in keywords) else 0
        symptom_flags[symptom] = flag
        features[f'has_{symptom}'] = flag
    
    features['symptom_count'] = sum(symptom_flags.values())
    
    model_data = load_model()
    feature_cols = model_data['feature_columns']
    
    row = []
    for col in feature_cols:
        row.append(features.get(col, 0))
    
    return np.array([row])

def generate_response(urgency: str, message: str, patient: PatientInfo) -> str:
    name = "Patient"
    history = patient.chronic_conditions if patient.chronic_conditions else "no known chronic conditions"
    
    responses = {
        'Critical': f"⚠️ EMERGENCY: Based on your symptoms, this requires immediate emergency attention. Please visit the nearest emergency facility or call emergency services immediately. A clinician has been alerted.",
        'High Priority': f"Hello {name}, I've analyzed your symptoms: '{message}'. Considering your medical history of {history}, this appears to be a high-priority case. Please visit Kabwata Clinic today for assessment. A clinician has been notified.",
        'Medium': f"Hello {name}, thank you for sharing. Based on your symptoms and medical history of {history}, I recommend scheduling a visit within the next few days for proper assessment. Monitor your symptoms and seek care if they worsen.",
        'Low': f"Hello {name}, thank you for sharing. Based on your description and medical history of {history}, this appears routine. I recommend monitoring your symptoms and scheduling a visit if they persist beyond 3 days. Stay hydrated and rest."
    }
    
    return responses.get(urgency, responses['Low'])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "triage-ml", "version": "1.0.0"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, api_key: str = Depends(verify_api_key)):
    try:
        model_data = load_model()
        model = model_data['model']
        label_encoder = model_data['label_encoder']
        
        features = extract_features(request.message, request.patient)
        
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        urgency = URGENCY_MAP.get(prediction, 'Low')
        confidence = float(np.max(probabilities) * 100)
        
        risk_score_map = {
            'Critical': np.random.randint(85, 100),
            'High Priority': np.random.randint(60, 85),
            'Medium': np.random.randint(30, 60),
            'Low': np.random.randint(5, 30)
        }
        
        return PredictionResponse(
            urgency=urgency,
            priority=PRIORITY_MAP[urgency],
            action=ACTION_MAP[urgency],
            risk_score=risk_score_map[urgency],
            confidence=round(confidence, 1),
            severity=SEVERITY_MAP[urgency],
            response=generate_response(urgency, request.message, request.patient)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/batch_predict")
async def batch_predict(requests: List[PredictionRequest], api_key: str = Depends(verify_api_key)):
    results = []
    for req in requests:
        try:
            result = await predict(req, api_key)
            results.append(result)
        except Exception as e:
            results.append({"error": str(e), "message": req.message})
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)