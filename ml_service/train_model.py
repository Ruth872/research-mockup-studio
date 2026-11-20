import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

np.random.seed(42)

n_samples = 10000

symptoms_list = [
    'fever', 'cough', 'chest_pain', 'shortness_of_breath', 'headache',
    'fatigue', 'nausea', 'vomiting', 'diarrhea', 'abdominal_pain',
    'back_pain', 'joint_pain', 'dizziness', 'night_sweats', 'weight_loss',
    'sore_throat', 'runny_nose', 'chills', 'loss_of_appetite', 'blood_in_stool'
]

chronic_conditions_list = [
    'none', 'diabetes', 'hypertension', 'asthma', 'hiv', 'heart_disease',
    'kidney_disease', 'cancer', 'tb', 'malaria_history'
]

data = []
for _ in range(n_samples):
    n_symptoms = np.random.randint(1, 6)
    patient_symptoms = np.random.choice(symptoms_list, n_symptoms, replace=False)
    
    has_chronic = np.random.random() < 0.3
    chronic = np.random.choice(chronic_conditions_list) if has_chronic else 'none'
    
    age = np.random.randint(1, 90)
    gender = np.random.choice(['Male', 'Female'])
    
    symptom_text = ' '.join(patient_symptoms)
    
    urgency_score = 0
    
    critical_symptoms = ['chest_pain', 'shortness_of_breath', 'unconscious', 'severe_bleeding']
    high_symptoms = ['fever', 'pain', 'bleeding', 'injury', 'wound', 'fracture', 'burn']
    malaria_symptoms = ['malaria', 'chills', 'night_sweats', 'cyclic_fever']
    
    if any(s in symptom_text for s in critical_symptoms):
        urgency_score += 40
    if any(s in symptom_text for s in high_symptoms):
        urgency_score += 20
    if any(s in symptom_text for s in malaria_symptoms):
        urgency_score += 25
    if 'fever' in symptom_text and 'cough' in symptom_text:
        urgency_score += 15
    
    if chronic in ['diabetes', 'hypertension', 'heart_disease', 'hiv', 'cancer']:
        urgency_score += 10
    if chronic == 'tb':
        urgency_score += 15
    
    if age > 65 or age < 5:
        urgency_score += 10
    
    if urgency_score >= 70:
        urgency = 'Critical'
    elif urgency_score >= 45:
        urgency = 'High Priority'
    elif urgency_score >= 20:
        urgency = 'Medium'
    else:
        urgency = 'Low'
    
    row = {
        'age': age,
        'gender': gender,
        'chronic_condition': chronic,
        'symptom_count': n_symptoms,
        'has_fever': 1 if 'fever' in patient_symptoms else 0,
        'has_cough': 1 if 'cough' in patient_symptoms else 0,
        'has_chest_pain': 1 if 'chest_pain' in patient_symptoms else 0,
        'has_shortness_breath': 1 if 'shortness_of_breath' in patient_symptoms else 0,
        'has_headache': 1 if 'headache' in patient_symptoms else 0,
        'has_fatigue': 1 if 'fatigue' in patient_symptoms else 0,
        'has_nausea': 1 if 'nausea' in patient_symptoms else 0,
        'has_vomiting': 1 if 'vomiting' in patient_symptoms else 0,
        'has_diarrhea': 1 if 'diarrhea' in patient_symptoms else 0,
        'has_abdominal_pain': 1 if 'abdominal_pain' in patient_symptoms else 0,
        'has_back_pain': 1 if 'back_pain' in patient_symptoms else 0,
        'has_joint_pain': 1 if 'joint_pain' in patient_symptoms else 0,
        'has_dizziness': 1 if 'dizziness' in patient_symptoms else 0,
        'has_night_sweats': 1 if 'night_sweats' in patient_symptoms else 0,
        'has_weight_loss': 1 if 'weight_loss' in patient_symptoms else 0,
        'has_sore_throat': 1 if 'sore_throat' in patient_symptoms else 0,
        'has_runny_nose': 1 if 'runny_nose' in patient_symptoms else 0,
        'has_chills': 1 if 'chills' in patient_symptoms else 0,
        'has_loss_appetite': 1 if 'loss_of_appetite' in patient_symptoms else 0,
        'has_blood_stool': 1 if 'blood_in_stool' in patient_symptoms else 0,
        'urgency': urgency
    }
    data.append(row)

df = pd.DataFrame(data)

feature_cols = [c for c in df.columns if c != 'urgency']
X = df[feature_cols]
y = df['urgency']

le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)
print("\nTop 15 Features:")
print(feature_importance.head(15))

model_data = {
    'model': model,
    'label_encoder': le,
    'feature_columns': feature_cols,
    'symptoms_list': symptoms_list,
    'chronic_conditions_list': chronic_conditions_list
}

os.makedirs('model', exist_ok=True)
joblib.dump(model_data, 'model/triage_model.pkl')
print("\nModel saved to model/triage_model.pkl")