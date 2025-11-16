import React, { useState, useRef } from 'react';
import { analyzeSymptomsStream, identifyMedicine } from '../services/geminiService';
import { UserProfile, HealthProfile, FamilyMember, SymptomAnalysis } from '../types';

type AIMode = 'Symptom' | 'Medicine';

// Polyfill for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

interface HealocAIProps {
  activeProfile: HealthProfile;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const HealocAI: React.FC<HealocAIProps> = ({ activeProfile, user, setUser }) => {
  const [activeMode, setActiveMode] = useState<AIMode>('Symptom');
  const [symptomInput, setSymptomInput] = useState<string>('');
  const [symptomResult, setSymptomResult] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [symptomImage, setSymptomImage] = useState<File | null>(null);
  const [speechError, setSpeechError] = useState<string>('');

  const [medicineImage, setMedicineImage] = useState<File | null>(null);
  const [medicineResult, setMedicineResult] = useState<string>('');
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [medicineImagePreview, setMedicineImagePreview] = useState<string | null>(null);
  
  const [viewingHistory, setViewingHistory] = useState<SymptomAnalysis | null>(null);

  const updateUserProfile = (updateFn: (profile: HealthProfile) => HealthProfile) => {
    setUser(prevUser => {
      if (activeProfile.id === prevUser.id) {
        return updateFn(prevUser) as UserProfile;
      }
      return {
        ...prevUser,
        familyMembers: prevUser.familyMembers.map(m => m.id === activeProfile.id ? updateFn(m) as FamilyMember : m)
      };
    });
  };


  const handleSymptomCheck = async () => {
    if (!symptomInput.trim() || isStreaming) return;
    setIsStreaming(true);
    setSymptomResult('');
    let finalResult = '';
    try {
      const stream = await analyzeSymptomsStream(symptomInput, symptomImage ?? undefined);
      for await (const chunk of stream) {
        const text = chunk.text;
        finalResult += text;
        setSymptomResult(prev => prev + text);
      }
    } catch (error) {
      const errorMessage = 'An error occurred. Please try again.';
      finalResult = errorMessage;
      setSymptomResult(errorMessage);
    } finally {
      setIsStreaming(false);

      if (symptomInput.trim()) {
          const newAnalysis: SymptomAnalysis = {
              id: `sh_${Date.now()}`,
              date: new Date().toISOString(),
              symptoms: symptomInput,
              imageAttached: !!symptomImage,
              result: finalResult,
          };
          updateUserProfile(p => ({
              ...p,
              symptomHistory: [newAnalysis, ...(p.symptomHistory || [])]
          }));
      }
      setSymptomImage(null);
    }
  };
  
  const handleViewHistory = (analysis: SymptomAnalysis) => {
    setViewingHistory(analysis);
    setSymptomInput(analysis.symptoms);
    setSymptomResult(analysis.result);
    setSymptomImage(null); // Clear any lingering image selection
    window.scrollTo(0, 0);
  };
  
  const handleStartNewAnalysis = () => {
      setViewingHistory(null);
      setSymptomInput('');
      setSymptomResult('');
      setSymptomImage(null);
  };


  const handleToggleListening = () => {
    if (speechError) setSpeechError('');

    if (!recognition) {
        alert("Voice recognition is not supported in your browser.");
        return;
    }
    if (isListening) {
        recognition.stop();
        setIsListening(false);
    } else {
        recognition.start();
        setIsListening(true);
    }
  };

  if(recognition) {
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSymptomInput(prev => prev ? `${prev} ${transcript}`: transcript);
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        let errorMessage = 'An unknown error occurred with speech recognition.';
        switch (event.error) {
            case 'network':
                errorMessage = 'Network error. Please check your internet connection and try again.';
                break;
            case 'not-allowed':
            case 'service-not-allowed':
                errorMessage = 'Microphone access denied. Please enable it in your browser settings.';
                break;
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Could not capture audio. Please check your microphone.';
                break;
        }
        setSpeechError(errorMessage);
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
  }

  const handleImageChange = (event: Event, forSymptom: boolean) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        if(forSymptom) {
            setSymptomImage(file);
        } else {
            setMedicineImage(file);
            setMedicineResult('');
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setMedicineImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }
    target.value = '';
  };

  const triggerFileInput = (symptom: boolean, capture: boolean) => {
    if (fileInputRef.current) {
        fileInputRef.current.onchange = (e) => handleImageChange(e, symptom);
        fileInputRef.current.capture = capture ? 'environment' : '';
        fileInputRef.current.click();
    }
  };

  const handleIdentifyMedicine = async () => {
    if (!medicineImage || isIdentifying) return;
    setIsIdentifying(true);
    setMedicineResult('');
    try {
        const result = await identifyMedicine(medicineImage);
        setMedicineResult(result);
    } catch (error) {
        setMedicineResult('An error occurred during identification. Please try again.');
    } finally {
        setIsIdentifying(false);
    }
  };

  const resetMedicineScanner = () => {
    setMedicineImage(null);
    setMedicineImagePreview(null);
    setMedicineResult('');
  };

  return (
    <div className="space-y-4">
      <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
        {(['Symptom', 'Medicine'] as AIMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeMode === mode ? 'bg-brand-surface dark:bg-gray-700 shadow-sm text-brand-blue dark:text-gray-100' : 'text-brand-text-secondary dark:text-gray-400'
            }`}
          >
            {mode === 'Symptom' ? 'Symptom Checker' : 'Medicine Scan'}
          </button>
        ))}
      </div>
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" />

      {activeMode === 'Symptom' && (
        <div className="bg-brand-surface dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-3">
          <h3 className="font-bold text-brand-text-primary dark:text-gray-200">{viewingHistory ? `Viewing Analysis: ${new Date(viewingHistory.date).toLocaleDateString()}` : 'Symptom Checker'}</h3>
          <p className="text-sm text-brand-text-secondary dark:text-gray-400">Describe your symptoms below. You can use text, voice, or upload an image.</p>
          <div className="relative">
            <textarea
              value={symptomInput}
              onChange={(e) => {
                setSymptomInput(e.target.value);
                if (speechError) setSpeechError('');
              }}
              disabled={!!viewingHistory || isStreaming}
              className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-text-primary dark:text-gray-100 rounded-md focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
              placeholder="e.g., 'I have a sore throat, a slight fever, and a headache.'"
            />
            {!viewingHistory && (
              <div className="absolute bottom-2 right-2 flex space-x-2">
                   <button onClick={() => triggerFileInput(true, false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50" disabled={isStreaming}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={handleToggleListening} className={`p-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-600'} hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50`} disabled={isStreaming}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isListening ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a2 2 0 114 0v1a2 2 0 11-4 0v-1z" clipRule="evenodd" /></svg>
                  </button>
              </div>
            )}
          </div>
          {speechError && <p className="text-xs text-red-500 mt-1 text-center">{speechError}</p>}
          {symptomImage && <p className="text-xs text-brand-text-secondary dark:text-gray-400">Image attached: {symptomImage.name} <button onClick={() => setSymptomImage(null)} className="text-red-500 ml-2">(remove)</button></p>}
          
          {viewingHistory ? (
             <button
                onClick={handleStartNewAnalysis}
                className="w-full bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
             >
                Start New Analysis
             </button>
          ) : (
            <button
              onClick={handleSymptomCheck}
              disabled={isStreaming}
              className="w-full bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {isStreaming ? 'Analyzing...' : 'Analyze Symptoms'}
            </button>
          )}

          {symptomResult && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-sm mb-1 text-brand-text-primary dark:text-gray-200">AI Analysis:</h4>
                <p className="text-sm text-brand-text-primary dark:text-gray-300 whitespace-pre-wrap">{symptomResult}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-lg mb-2 text-brand-text-primary dark:text-gray-200">Analysis History</h4>
            {(activeProfile.symptomHistory && activeProfile.symptomHistory.length > 0) ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {activeProfile.symptomHistory.map(item => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm text-brand-text-primary dark:text-gray-300 truncate max-w-[150px] sm:max-w-xs">{item.symptoms}</p>
                                <p className="text-xs text-brand-text-secondary dark:text-gray-400">{new Date(item.date).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleViewHistory(item)} className="text-sm bg-brand-blue text-white px-3 py-1 rounded-md hover:bg-opacity-80 font-semibold whitespace-nowrap">View Result</button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-brand-text-secondary dark:text-gray-400 text-center py-4">No symptom analyses yet.</p>
            )}
          </div>

        </div>
      )}

      {activeMode === 'Medicine' && (
        <div className="bg-brand-surface dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-3">
            <h3 className="font-bold text-brand-text-primary dark:text-gray-200">Medicine Identifier</h3>
            
            {!medicineImagePreview ? (
              <>
              <p className="text-sm text-brand-text-secondary dark:text-gray-400">Take a photo of a pill or upload an image of medicine packaging to identify it.</p>
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 w-full">
                       <button onClick={() => triggerFileInput(false, true)} className="flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 text-brand-text-primary dark:text-gray-200 px-4 py-3 rounded-md text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2-2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Capture
                      </button>
                      <button onClick={() => triggerFileInput(false, false)} className="flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 text-brand-text-primary dark:text-gray-200 px-4 py-3 rounded-md text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          Upload
                      </button>
                  </div>
              </div>
              </>
            ) : (
              <div className="space-y-4">
                  <img src={medicineImagePreview} alt="Medicine preview" className="w-full max-h-60 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 p-1" />
                  <div className="grid grid-cols-2 gap-3">
                      <button
                          onClick={resetMedicineScanner}
                          className="w-full bg-gray-200 dark:bg-gray-600 text-brand-text-primary dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-opacity-90"
                      >
                          Choose Different Image
                      </button>
                      <button
                          onClick={handleIdentifyMedicine}
                          disabled={isIdentifying}
                          className="w-full bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500"
                      >
                          {isIdentifying ? 'Identifying...' : 'Confirm & Identify'}
                      </button>
                  </div>
              </div>
            )}
             {medicineResult && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-sm mb-1 text-brand-text-primary dark:text-gray-200">AI Identification:</h4>
                <p className="text-sm text-brand-text-primary dark:text-gray-300 whitespace-pre-wrap">{medicineResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealocAI;