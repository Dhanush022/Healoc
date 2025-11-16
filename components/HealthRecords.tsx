import React, { useState, useRef } from 'react';
import { UserProfile, HealthRecord, MedicationReminder, HealthProfile, Allergy, Vaccination, HealthRecordType, FamilyMember } from '../types';
import { explainMedicalText } from '../services/geminiService';
import PlusIcon from './icons/PlusIcon';

type Tab = 'History' | 'Reminders' | 'Allergies' | 'Vaccinations';
type ModalType = 'Record' | 'Reminder' | 'Allergy' | 'Vaccination' | null;

const defaultReminder: Omit<MedicationReminder, 'id'> = { name: '', dosage: '', frequency: 'daily', times: ['09:00'] };
const defaultRecord: Omit<HealthRecord, 'id' | 'imageUrl'> = { name: '', type: 'Lab Report', date: '', details: '' };
const defaultAllergy: Omit<Allergy, 'id'> = { name: '', severity: 'Mild', reaction: '' };
const defaultVaccination: Omit<Vaccination, 'id'> = { name: '', date: '', dose: '', batchNumber: ''};


interface HealthRecordsProps {
    activeProfile: HealthProfile;
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const HealthRecords: React.FC<HealthRecordsProps> = ({ activeProfile, user, setUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('History');
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  
  const [newReminder, setNewReminder] = useState(defaultReminder);
  const [newRecord, setNewRecord] = useState(defaultRecord);
  const [newRecordImage, setNewRecordImage] = useState<string | null>(null);
  const [newAllergy, setNewAllergy] = useState(defaultAllergy);
  const [newVaccination, setNewVaccination] = useState(defaultVaccination);

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUserProfile = (updateFn: (profile: HealthProfile) => HealthProfile) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      if (activeProfile.id === prevUser.id) {
        // FIX: Ensure the returned object is cast to UserProfile to satisfy type constraints.
        return updateFn(prevUser) as UserProfile;
      }
      return {
        ...prevUser,
        // FIX: Cast the updated member to FamilyMember to align with the array type.
        familyMembers: prevUser.familyMembers.map(m => m.id === activeProfile.id ? updateFn(m) as FamilyMember : m)
      };
    });
  };

  const handleExplain = async (record: HealthRecord) => {
      setSelectedRecord(record);
      setExplanation('');
      setIsLoading(true);
      const result = await explainMedicalText(record.details);
      setExplanation(result);
      setIsLoading(false);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as MedicationReminder['frequency'];
    let newTimes: string[];
    switch (frequency) {
        case 'daily':
            newTimes = ['09:00'];
            break;
        case 'twice_daily':
            newTimes = ['09:00', '21:00'];
            break;
        case 'as_needed':
            newTimes = [];
            break;
        default:
            newTimes = ['09:00'];
    }
    setNewReminder({ ...newReminder, frequency, times: newTimes });
  };

  const handleTimeChange = (index: number, value: string) => {
      const updatedTimes = [...newReminder.times];
      updatedTimes[index] = value;
      setNewReminder({ ...newReminder, times: updatedTimes });
  };
  
  const handleSave = (type: ModalType) => {
    switch (type) {
      case 'Reminder':
        if (!newReminder.name || !newReminder.dosage) return;
        updateUserProfile(p => ({ ...p, medicationReminders: [...p.medicationReminders, { ...newReminder, id: `med_${Date.now()}` }] }));
        setNewReminder(defaultReminder);
        break;
      case 'Record':
        if (!newRecord.name || !newRecord.date) return;
        updateUserProfile(p => ({ ...p, healthRecords: [...p.healthRecords, { ...newRecord, id: `rec_${Date.now()}`, imageUrl: newRecordImage }] }));
        setNewRecord(defaultRecord);
        setNewRecordImage(null);
        break;
      case 'Allergy':
        if (!newAllergy.name || !newAllergy.reaction) return;
        updateUserProfile(p => ({ ...p, allergies: [...p.allergies, { ...newAllergy, id: `alg_${Date.now()}` }] }));
        setNewAllergy(defaultAllergy);
        break;
      case 'Vaccination':
         if (!newVaccination.name || !newVaccination.date) return;
        updateUserProfile(p => ({ ...p, vaccinations: [...p.vaccinations, { ...newVaccination, id: `vac_${Date.now()}` }] }));
        setNewVaccination(defaultVaccination);
        break;
    }
    setOpenModal(null);
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const base64 = await fileToBase64(file);
        setNewRecordImage(base64);
    }
    event.target.value = ''; // Allow re-selecting the same file
  };

  const triggerFileInput = (capture: boolean) => {
    if (fileInputRef.current) {
        fileInputRef.current.capture = capture ? 'environment' : '';
        fileInputRef.current.click();
    }
  };


  const AddButton: React.FC<{ onClick: () => void, label: string }> = ({ onClick, label }) => (
    <button onClick={onClick} className="w-full flex items-center justify-center bg-brand-green text-white px-4 py-3 rounded-lg text-base font-semibold hover:bg-opacity-90 mt-4 shadow-sm">
        <PlusIcon className="w-5 h-5 mr-2" />
        {label}
    </button>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      {activeProfile.healthRecords.map(record => (
        <div key={record.id} className="bg-brand-surface dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-lg text-brand-text-primary dark:text-gray-200">{record.name}</p>
              <p className="text-sm text-brand-text-secondary dark:text-gray-400">{record.type} - {record.date}</p>
            </div>
            <div className="flex items-center space-x-2">
                {record.imageUrl && (
                    <img 
                        src={record.imageUrl} 
                        alt="Record thumbnail" 
                        className="w-12 h-12 object-cover rounded-lg cursor-pointer"
                        onClick={() => setViewingImage(record.imageUrl ?? null)}
                    />
                )}
                <button onClick={() => handleExplain(record)} className="text-sm bg-brand-blue text-white px-3 py-2 rounded-lg hover:bg-opacity-80 font-semibold">Explain</button>
            </div>
          </div>
          {selectedRecord?.id === record.id && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-base mb-1 text-brand-text-primary dark:text-gray-200">AI Explanation:</h4>
              {isLoading ? <p className="text-base text-brand-text-secondary dark:text-gray-400 italic">Generating explanation...</p> : <p className="text-base text-brand-text-primary dark:text-gray-300 whitespace-pre-wrap">{explanation}</p>}
            </div>
          )}
        </div>
      ))}
      <AddButton label="Add Health Record" onClick={() => setOpenModal('Record')} />
    </div>
  );

  const renderReminders = () => (
    <div className="space-y-4">
      {activeProfile.medicationReminders.map(reminder => (
        <div key={reminder.id} className="bg-brand-surface dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <p className="font-semibold text-lg text-brand-text-primary dark:text-gray-200">{reminder.name}</p>
          <p className="text-sm text-brand-text-secondary dark:text-gray-400">Dosage: {reminder.dosage} | Time: {reminder.times.join(', ')}</p>
        </div>
      ))}
      <AddButton label="Add Medication Reminder" onClick={() => setOpenModal('Reminder')} />
    </div>
  );

  const renderAllergies = () => (
    <div className="space-y-4">
      {activeProfile.allergies.map(allergy => (
        <div key={allergy.id} className="bg-brand-surface dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <p className="font-semibold text-lg text-brand-text-primary dark:text-gray-200">{allergy.name}</p>
          <p className="text-sm text-brand-text-secondary dark:text-gray-400">Severity: <span className="font-medium text-brand-red">{allergy.severity}</span> | Reaction: {allergy.reaction}</p>
        </div>
      ))}
      <AddButton label="Add Allergy Record" onClick={() => setOpenModal('Allergy')} />
    </div>
  );

  const renderVaccinations = () => (
    <div className="space-y-4">
      {activeProfile.vaccinations.map(vaccine => (
        <div key={vaccine.id} className="bg-brand-surface dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <p className="font-semibold text-lg text-brand-text-primary dark:text-gray-200">{vaccine.name}</p>
          <p className="text-sm text-brand-text-secondary dark:text-gray-400">Date: {vaccine.date} | Dose: {vaccine.dose}</p>
          {vaccine.batchNumber && <p className="text-xs text-brand-text-secondary dark:text-gray-500 mt-1">Batch: {vaccine.batchNumber}</p>}
        </div>
      ))}
      <AddButton label="Add Vaccination Record" onClick={() => setOpenModal('Vaccination')} />
    </div>
  );

  const renderModal = () => {
    if (!openModal) return null;

    const titles: Record<ModalType & {}, string> = {
      Record: 'Add Health Record', Reminder: 'Add Medication Reminder', Allergy: 'Add Allergy', Vaccination: 'Add Vaccination'
    };

    const closeModal = () => {
        setOpenModal(null);
        setNewRecordImage(null);
    }
    
    const ModalInput: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
        <div>
            <label className="text-sm font-semibold text-brand-text-secondary dark:text-gray-400 mb-1 block">{label}</label>
            {children}
        </div>
    );
    const commonInputClass = "w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-text-primary dark:text-gray-100 rounded-lg focus:ring-brand-blue focus:border-brand-blue";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
        <div className="bg-brand-surface dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-5 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-brand-text-primary dark:text-gray-100 text-center">{titles[openModal]}</h2>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          
          {openModal === 'Record' && <>
              <ModalInput label="Record Type"><select value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value as HealthRecordType})} className={`${commonInputClass} bg-white dark:bg-gray-700`}><option>Lab Report</option><option>Prescription</option><option>Doctor's Note</option><option>Other</option></select></ModalInput>
              <ModalInput label="Name"><input type="text" value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} className={commonInputClass}/></ModalInput>
              <ModalInput label="Date"><input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className={commonInputClass} style={{ colorScheme: 'dark' }}/></ModalInput>
              <ModalInput label="Details"><textarea value={newRecord.details} onChange={e => setNewRecord({...newRecord, details: e.target.value})} className={`${commonInputClass} h-28`}/></ModalInput>
               <div>
                  <label className="text-sm font-semibold text-brand-text-secondary dark:text-gray-400 mb-1 block">Attach Image/Document</label>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                      <button onClick={() => triggerFileInput(false)} className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-brand-text-primary dark:text-gray-200 px-3 py-3 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600">Upload Image</button>
                      <button onClick={() => triggerFileInput(true)} className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-brand-text-primary dark:text-gray-200 px-3 py-3 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600">Scan Document</button>
                  </div>
                  {newRecordImage && (
                    <div className="mt-3 relative">
                        <img src={newRecordImage} alt="Record preview" className="w-full h-auto rounded-lg border-2 dark:border-gray-600" />
                        <button onClick={() => setNewRecordImage(null)} className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">&times;</button>
                    </div>
                  )}
              </div>
          </>}
          {openModal === 'Reminder' && <>
             <ModalInput label="Medication Name"><input type="text" value={newReminder.name} onChange={e => setNewReminder({...newReminder, name: e.target.value})} className={commonInputClass}/></ModalInput>
             <ModalInput label="Dosage (e.g., 500mg)"><input type="text" value={newReminder.dosage} onChange={e => setNewReminder({...newReminder, dosage: e.target.value})} className={commonInputClass}/></ModalInput>
             <ModalInput label="Frequency"><select value={newReminder.frequency} onChange={handleFrequencyChange} className={`${commonInputClass} bg-white dark:bg-gray-700`}><option value="daily">Once a day</option><option value="twice_daily">Twice a day</option><option value="as_needed">As needed</option></select></ModalInput>
             {newReminder.times.map((time, index) => (
                <ModalInput label={`Time ${index + 1}`} key={index}>
                    <input type="time" value={time} onChange={e => handleTimeChange(index, e.target.value)} className={commonInputClass} style={{ colorScheme: 'dark' }}/>
                </ModalInput>
                ))}
          </>}
          {openModal === 'Allergy' && <>
             <ModalInput label="Allergy Name"><input type="text" value={newAllergy.name} onChange={e => setNewAllergy({...newAllergy, name: e.target.value})} className={commonInputClass}/></ModalInput>
             <ModalInput label="Severity"><select value={newAllergy.severity} onChange={e => setNewAllergy({...newAllergy, severity: e.target.value as any})} className={`${commonInputClass} bg-white dark:bg-gray-700`}><option>Mild</option><option>Moderate</option><option>High</option><option>Severe</option></select></ModalInput>
             <ModalInput label="Reaction"><input type="text" value={newAllergy.reaction} onChange={e => setNewAllergy({...newAllergy, reaction: e.target.value})} className={commonInputClass}/></ModalInput>
          </>}
          {openModal === 'Vaccination' && <>
             <ModalInput label="Vaccine Name"><input type="text" value={newVaccination.name} onChange={e => setNewVaccination({...newVaccination, name: e.target.value})} className={commonInputClass}/></ModalInput>
             <ModalInput label="Date Administered"><input type="date" value={newVaccination.date} onChange={e => setNewVaccination({...newVaccination, date: e.target.value})} className={commonInputClass} style={{ colorScheme: 'dark' }}/></ModalInput>
             <ModalInput label="Dose"><input type="text" value={newVaccination.dose} onChange={e => setNewVaccination({...newVaccination, dose: e.target.value})} placeholder="e.g., Booster, Dose 1" className={commonInputClass}/></ModalInput>
             <ModalInput label="Batch Number (Optional)"><input type="text" value={newVaccination.batchNumber} onChange={e => setNewVaccination({...newVaccination, batchNumber: e.target.value})} className={commonInputClass}/></ModalInput>
          </>}
          <div className="flex justify-end space-x-3 pt-2">
              <button onClick={closeModal} className="px-5 py-3 text-base font-semibold text-brand-text-secondary dark:text-gray-300 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
              <button onClick={() => handleSave(openModal)} className="px-5 py-3 text-base font-semibold text-white rounded-lg bg-brand-blue hover:bg-opacity-90">Save</button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderImageViewer = () => {
    if (!viewingImage) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} alt="Full screen record" className="max-w-full max-h-full object-contain rounded-lg" />
            <button className="absolute top-4 right-4 bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold">&times;</button>
        </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center items-center">
        <div className="flex border border-gray-200 dark:border-gray-700 rounded-full p-1 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
          {(['History', 'Reminders', 'Allergies', 'Vaccinations'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 whitespace-nowrap ${
                activeTab === tab ? 'bg-brand-surface dark:bg-gray-700 shadow-md text-brand-blue dark:text-gray-100' : 'text-brand-text-secondary dark:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'History' && renderHistory()}
      {activeTab === 'Reminders' && renderReminders()}
      {activeTab === 'Allergies' && renderAllergies()}
      {activeTab === 'Vaccinations' && renderVaccinations()}
      
      {renderModal()}
      {renderImageViewer()}
    </div>
  );
};

export default HealthRecords;