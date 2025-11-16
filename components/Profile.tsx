import React, { useState } from 'react';
import { UserProfile, EmergencyContact, HealthProfile, FamilyMember, Screen, Theme } from '../types';
import PlusIcon from './icons/PlusIcon';

interface ProfileProps {
  activeProfile: HealthProfile;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  navigate: (screen: Screen) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const newMemberDefault: Omit<FamilyMember, 'id' | 'healthRecords' | 'allergies' | 'vaccinations' | 'medicationReminders' | 'symptomHistory'> = {
    name: '',
    relationship: 'Child',
    dob: '',
    bloodType: '',
    emergencyContacts: [{ name: '', phone: '' }],
};

const commonInputClass = "mt-1 block w-full px-3 py-3 bg-white dark:bg-gray-700 text-brand-text-primary dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm";
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Moved outside the main component to prevent re-definition on render, fixing the focus bug.
const InputRow: React.FC<{ label: string; value: string; onChange: (val: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
    <div>
      <label className="block text-sm font-semibold text-brand-text-secondary dark:text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={commonInputClass}
        style={type === 'date' ? { colorScheme: 'dark' } : {}}
      />
    </div>
);

// Moved outside for consistency and performance.
const ProfileCard: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-brand-surface dark:bg-gray-800 p-5 rounded-xl shadow-sm">
      <h3 className="font-bold text-lg mb-4 text-brand-text-primary dark:text-gray-200">{title}</h3>
      {children}
    </div>
);


const Profile: React.FC<ProfileProps> = ({ activeProfile, user, setUser, navigate, theme, setTheme }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState(newMemberDefault);

  const handleProfileChange = (field: keyof HealthProfile, value: any) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      if (activeProfile.id === currentUser.id) {
        return { ...currentUser, [field]: value };
      }
      return {
        ...currentUser,
        familyMembers: currentUser.familyMembers.map(m =>
          m.id === activeProfile.id ? { ...m, [field]: value } : m
        ),
      };
    });
  };

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...activeProfile.emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    handleProfileChange('emergencyContacts', newContacts);
  };
  
  const addEmergencyContact = () => {
    const newContacts = [...activeProfile.emergencyContacts, { name: '', phone: '' }];
    handleProfileChange('emergencyContacts', newContacts);
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.dob) return;
    const memberToAdd: FamilyMember = {
        ...newMember,
        id: `fm_${Date.now()}`,
        healthRecords: [],
        allergies: [],
        vaccinations: [],
        medicationReminders: [],
        symptomHistory: [],
        emergencyContacts: newMember.emergencyContacts.filter(c => c.name && c.phone)
    };
    setUser(currentUser => ({
        ...currentUser,
        familyMembers: [...currentUser.familyMembers, memberToAdd]
    }));
    setNewMember(newMemberDefault);
    setIsModalOpen(false);
  };
  
   const qrDataString = encodeURIComponent(JSON.stringify({
    name: activeProfile.name,
    dob: activeProfile.dob,
    bloodType: activeProfile.bloodType,
    allergies: activeProfile.allergies.map(a => a.name).join(', ') || 'None',
  }));
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrDataString}`;
  const qrCodeUrlDark = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrDataString}&bgcolor=1F2937&color=FFFFFF`;
  
  const handleNewMemberContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const updatedContacts = [...newMember.emergencyContacts];
    updatedContacts[index] = {...updatedContacts[index], [field]: value};
    setNewMember({ ...newMember, emergencyContacts: updatedContacts });
  };
  
  const addNewMemberContactField = () => {
    setNewMember({ ...newMember, emergencyContacts: [...newMember.emergencyContacts, { name: '', phone: '' }] });
  };
  
  return (
    <div className="space-y-6">
      <ProfileCard title={`Personal Information: ${activeProfile.name}`}>
        <div className="space-y-4">
          <InputRow label="Full Name" value={activeProfile.name} onChange={val => handleProfileChange('name', val)} />
          <InputRow label="Date of Birth" value={activeProfile.dob} onChange={val => handleProfileChange('dob', val)} type="date" />
          <div>
            <label className="block text-sm font-semibold text-brand-text-secondary dark:text-gray-400">Blood Type</label>
            <select
              value={activeProfile.bloodType}
              onChange={e => handleProfileChange('bloodType', e.target.value)}
              className={commonInputClass}
            >
              <option value="">Select Blood Type</option>
              {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
      </ProfileCard>
      
      <ProfileCard title="Appearance">
        <div className="flex items-center justify-between">
            <span className="font-semibold text-base text-brand-text-primary dark:text-gray-200">Dark Mode</span>
            <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-brand-blue' : 'bg-gray-200'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
        </div>
      </ProfileCard>


       <ProfileCard title="Emergency QR Code">
        <div className="flex items-center space-x-5">
            <div className="p-1 rounded-lg border-2 bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                <img src={qrCodeUrl} alt="Emergency QR Code" className="rounded-md block dark:hidden" />
                <img src={qrCodeUrlDark} alt="Emergency QR Code Dark" className="rounded-md hidden dark:block" />
            </div>
            <div className="text-base space-y-1 text-brand-text-primary dark:text-gray-300">
                <p><span className="font-semibold">Name:</span> {activeProfile.name}</p>
                <p><span className="font-semibold">Blood:</span> {activeProfile.bloodType}</p>
                <p><span className="font-semibold">Allergies:</span> {activeProfile.allergies.map(a => a.name).join(', ') || 'None'}</p>
                <button onClick={() => navigate(Screen.QRCode)} className="text-brand-blue font-semibold mt-2 hover:underline">View Full Emergency Card</button>
            </div>
        </div>
      </ProfileCard>

      <ProfileCard title={`Emergency Contacts: ${activeProfile.name}`}>
        <div className="space-y-5">
          {activeProfile.emergencyContacts.map((contact, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
              <InputRow label={`Contact ${index + 1} Name`} value={contact.name} onChange={val => handleContactChange(index, 'name', val)} />
              <InputRow label={`Contact ${index + 1} Phone`} value={contact.phone} onChange={val => handleContactChange(index, 'phone', val)} type="tel" />
            </div>
          ))}
        </div>
        <button onClick={addEmergencyContact} className="w-full mt-4 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-brand-text-primary dark:text-gray-200 px-4 py-3 rounded-lg text-base font-semibold hover:bg-opacity-90 shadow-sm">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Contact
        </button>
      </ProfileCard>

      <ProfileCard title="Family Members">
        <div className="space-y-3">
            {user.familyMembers.map(member => (
                <div key={member.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div>
                        <p className="font-semibold text-base text-brand-text-primary dark:text-gray-200">{member.name}</p>
                        <p className="text-sm text-brand-text-secondary dark:text-gray-400">{member.relationship}</p>
                    </div>
                    <span className="text-sm text-brand-text-secondary dark:text-gray-400">{member.dob}</span>
                </div>
            ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full mt-4 flex items-center justify-center bg-brand-green text-white px-4 py-3 rounded-lg text-base font-semibold hover:bg-opacity-90 shadow-sm">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Family Member
        </button>
      </ProfileCard>
      
      <button className="w-full bg-brand-blue text-white font-bold py-4 rounded-lg hover:bg-opacity-90 text-lg">
        Save All Changes
      </button>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-brand-surface dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-5 overflow-y-auto max-h-[90vh]">
                <h2 className="text-xl font-bold text-brand-text-primary dark:text-gray-100 text-center">Add Family Member</h2>
                <InputRow label="Full Name" value={newMember.name} onChange={val => setNewMember({...newMember, name: val})} />
                <InputRow label="Date of Birth" value={newMember.dob} onChange={val => setNewMember({...newMember, dob: val})} type="date" />
                <div>
                  <label className="block text-sm font-semibold text-brand-text-secondary dark:text-gray-400">Blood Type</label>
                  <select
                    value={newMember.bloodType}
                    onChange={e => setNewMember({...newMember, bloodType: e.target.value})}
                    className={commonInputClass}
                  >
                    <option value="">Select Blood Type</option>
                    {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                 <div>
                    <label className="text-sm font-semibold text-brand-text-secondary dark:text-gray-400">Relationship</label>
                    <select value={newMember.relationship} onChange={e => setNewMember({...newMember, relationship: e.target.value as any})} className={`${commonInputClass} bg-white dark:bg-gray-700`}>
                        <option value="Child">Child</option><option value="Spouse">Spouse</option><option value="Parent">Parent</option><option value="Other">Other</option>
                    </select>
                </div>
                <h3 className="text-lg font-semibold pt-3 border-t dark:border-gray-700 text-brand-text-primary dark:text-gray-200">Emergency Contacts</h3>
                {newMember.emergencyContacts.map((contact, index) => (
                    <div key={index} className="space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
                        <InputRow label={`Contact ${index+1} Name`} value={contact.name} onChange={val => handleNewMemberContactChange(index, 'name', val)} />
                        <InputRow label={`Contact ${index+1} Phone`} value={contact.phone} onChange={val => handleNewMemberContactChange(index, 'phone', val)} type="tel"/>
                    </div>
                ))}
                 <button onClick={addNewMemberContactField} className="text-sm text-brand-blue font-semibold hover:underline">+ Add another contact</button>

                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-base font-semibold text-brand-text-secondary dark:text-gray-300 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleAddMember} className="px-5 py-3 text-base font-semibold text-white rounded-lg bg-brand-blue hover:bg-opacity-90">Add Member</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
