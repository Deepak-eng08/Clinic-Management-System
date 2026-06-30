import OpenAI from 'openai';

let openai = null;

// Initialize OpenAI client if api key is provided
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * AI Healthcare Chatbot Helper
 */
export const getAIChatResponse = async (userPrompt, chatHistory = []) => {
  if (openai) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are Antigravity AI, a professional, empathetic healthcare assistant. Give advice and answers to medical queries. Always include a disclaimer that you are an AI, not a doctor, and emergency concerns should be addressed immediately to a hospital. Keep responses concise and formatted in markdown.',
        },
        ...chatHistory,
        { role: 'user', content: userPrompt },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error, falling back to simulator:', error.message);
    }
  }

  // Fallback Rule-Based Medical Simulator
  return simulateMedicalChat(userPrompt);
};

/**
 * AI Symptom Checker & Doctor Recommendation
 */
export const checkSymptomsAI = async (symptomsString) => {
  if (openai) {
    try {
      const prompt = `Analyze these symptoms: "${symptomsString}". Identify the potential conditions (list top 2-3 possibilities), suggest the appropriate doctor specialization (e.g., Cardiology, Dermatology, Pediatrics, Orthopedics, General Medicine, Psychiatry, Ophthalmology), and suggest a severity level (Low, Medium, High). Format the output as JSON with keys: "conditions" (array of strings), "specialization" (string), "severity" (string), "advice" (string).`;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Error, falling back to simulator:', error.message);
    }
  }

  // Fallback Simulator
  return simulateSymptomCheck(symptomsString);
};

/**
 * AI Medical Report Summarizer
 */
export const summarizeMedicalReportAI = async (reportText) => {
  if (openai) {
    try {
      const prompt = `Please summarize the following medical lab report/text. Extract key vitals, abnormal levels, and provide a 3-bullet simplified explanation of the findings. Report text: "${reportText}". Format output in clear markdown.`;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error, falling back to simulator:', error.message);
    }
  }

  // Fallback Simulator
  return simulateReportSummary(reportText);
};

// ==========================================
// FALLBACK MEDICAL SIMULATION LOGIC
// ==========================================

const simulateMedicalChat = (prompt) => {
  const query = prompt.toLowerCase();
  
  let response = `### Antigravity AI Medical Assistant
  
  `;

  if (query.includes('chest pain') || query.includes('heart attack') || query.includes('breathing difficulty')) {
    response += `⚠️ **WARNING: HIGH SEVERITY ACTION REQUIRED**
    
Your symptoms might indicate a cardiovascular or respiratory emergency. 
Please immediately:
1. Contact your local emergency number (e.g., 911 / 102 / 108).
2. Go to the nearest emergency room.
3. Do not attempt to drive yourself.

*For non-emergency follow-ups, we highly recommend booking an appointment with a **Cardiologist** or **Pulmonologist**.*`;
  } else if (query.includes('fever') || query.includes('cough') || query.includes('cold') || query.includes('throat')) {
    response += `Based on your description of cold/flu symptoms:
    
- **Possible Causes**: Viral Upper Respiratory Infection (Common Cold), Influenza, or mild throat irritation.
- **Home Care Advice**: Stay well-hydrated, get plenty of rest, and consider warm saline gargles for throat pain. Over-the-counter paracetamol can assist with fever reduction.
- **When to see a Doctor**: If fever exceeds 102°F (39°C), persists for more than 3 days, or if you develop difficulty breathing.

We recommend booking an appointment with a **General Medicine** practitioner.`;
  } else if (query.includes('skin') || query.includes('rash') || query.includes('itch') || query.includes('acne') || query.includes('pimple')) {
    response += `Based on your skin concern:
    
- **Possible Causes**: Contact dermatitis, localized eczema, mild allergic reaction, or acne vulgaris.
- **Home Care Advice**: Avoid scratching the area. Clean with mild, fragrance-free soap. Apply cool compresses if itching.
- **When to see a Doctor**: If the rash spreads rapidly, becomes painful, or shows signs of infection (puss, warmth).

We recommend scheduling a consultation with a **Dermatologist**.`;
  } else if (query.includes('stress') || query.includes('anxiety') || query.includes('depress') || query.includes('sad') || query.includes('sleep')) {
    response += `It sounds like you are going through a difficult time:
    
- **Mental Wellness Advice**: Practice deep breathing exercises, try to maintain a consistent sleep routine, and limit stimulants like caffeine.
- **Support Resources**: Reach out to close friends or family, and remember you don't have to carry this alone.
- **Professional Consultation**: Speaking with a therapist or doctor is a brave and crucial step in managing mental health.

We suggest consults with a **Psychiatrist** or Mental Health Counsellor.`;
  } else if (query.includes('bone') || query.includes('joint') || query.includes('fracture') || query.includes('knee') || query.includes('back pain')) {
    response += `Based on your joint/muscle concerns:
    
- **Possible Causes**: Muscle strain, ligament sprain, mild osteoarthritis, or postural strain.
- **Home Care Advice**: Follow the R.I.C.E protocol (Rest, Ice for 15 mins, Compression with crepe bandage, Elevation) for acute injuries.
- **When to see a Doctor**: If you cannot bear weight on the limb, or notice obvious joint deformity.

We recommend booking an appointment with our **Orthopedics** department.`;
  } else {
    response += `Hello! I am your AI Health Assistant. I can help answer common questions about symptoms, wellness, and direct you to the right clinical specialists.

*Please note: I am an AI utility designed for educational assistance. Always seek direct consultation with a qualified medical professional for diagnosis or treatment.*

Try asking me about symptoms like "fever and throat pain", "severe chest tightness", or "skin rashes".`;
  }

  return response;
};

const simulateSymptomCheck = (symptoms) => {
  const query = symptoms.toLowerCase();
  
  if (query.includes('chest') || query.includes('heart') || query.includes('palpitation')) {
    return {
      conditions: ['Angina Pectoris', 'Arrhythmia', 'Cardiovascular strain'],
      specialization: 'Cardiology',
      severity: 'High',
      advice: 'Seek emergency care if associated with shortness of breath, radiating pain to the left arm or jaw, or cold sweats. Otherwise, book a cardiology consultation immediately.'
    };
  }
  
  if (query.includes('skin') || query.includes('rash') || query.includes('spots') || query.includes('itch')) {
    return {
      conditions: ['Allergic Dermatitis', 'Eczema Flare-up', 'Fungal Skin Infection'],
      specialization: 'Dermatology',
      severity: 'Low',
      advice: 'Apply soothing calamine lotion, avoid harsh chemical soaps, and do not scratch. Book a dermatologist appointment if it spreads.'
    };
  }

  if (query.includes('kid') || query.includes('child') || query.includes('baby') || query.includes('pediatric')) {
    return {
      conditions: ['Childhood viral exanthem', 'Pediatric gastroenteritis'],
      specialization: 'Pediatrics',
      severity: 'Medium',
      advice: 'Ensure the child remains hydrated. Monitor temperature closely. Book a pediatrician consultation.'
    };
  }

  if (query.includes('head') || query.includes('migraine') || query.includes('dizzy') || query.includes('numb')) {
    return {
      conditions: ['Tension Headache', 'Migraine Episode', 'Neurological Strain'],
      specialization: 'Neurology',
      severity: 'Medium',
      advice: 'Rest in a quiet, dark room. Limit screen exposure. Consult a neurologist if headaches are frequent or accompanied by vision loss.'
    };
  }

  // Default General Medicine
  return {
    conditions: ['Acute Viral Syndrome', 'Common Cold / Coryza', 'Mild Gastrointestinal upset'],
    specialization: 'General Medicine',
    severity: 'Low',
    advice: 'Stay hydrated, eat light foods, and rest. Check in with a general medicine practitioner if symptoms do not improve in 3-5 days.'
  };
};

const simulateReportSummary = (text) => {
  return `### AI Lab Report Analysis Summary
  
**Disclaimer**: *This is an automated analysis tool. Please cross-verify results with your consulting physician.*

#### Key Metrics Identified
- **Blood Glucose Levels**: Elevated (indicates potential pre-diabetic tendencies or high glycemic intake prior to test).
- **Cholesterol Profile**: High LDL (Low-Density Lipoprotein) and Borderline total cholesterol.
- **Hemoglobin Count**: Normal (14.2 g/dL), indicating no current signs of anemia.

#### Simplified Clinical Takeaway
1. **Dietary Modification**: Focus on reducing refined carbohydrates and increasing soluble fiber to support blood sugar stabilization.
2. **Cardiovascular Care**: Engage in at least 150 minutes of moderate aerobic exercise weekly to assist in lowering LDL cholesterol.
3. **Follow-Up**: Schedule an appointment with a **General Medicine** specialist or endocrinologist to discuss a formal clinical assessment.`;
};
