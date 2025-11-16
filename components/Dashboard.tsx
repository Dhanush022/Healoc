import React, { useState, useEffect } from 'react';
import { HealthProfile, Screen } from '../types';
import { getHealthTip } from '../services/geminiService';
import DocumentTextIcon from './icons/DocumentTextIcon';
import SparklesIcon from './icons/SparklesIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface DashboardProps {
  activeProfile: HealthProfile;
  navigate: (screen: Screen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeProfile, navigate }) => {
  const [healthTip, setHealthTip] = useState<string>('Loading health tip...');

  useEffect(() => {
    const fetchTip = async () => {
      const today = new Date().toISOString().split('T')[0];
      const tip = await getHealthTip(); // Now guaranteed to return a valid string.
      setHealthTip(tip);
      try {
        localStorage.setItem('healthTip', tip);
        localStorage.setItem('healthTipDate', today);
      } catch (error) {
        console.error("Could not save tip to localStorage:", error);
      }
    };

    const loadTip = () => {
        try {
            const storedTip = localStorage.getItem('healthTip');
            const storedDate = localStorage.getItem('healthTipDate');
            const today = new Date().toISOString().split('T')[0];

            // Explicitly check for and clear the problematic "undefined" string from storage.
            if (storedTip && storedTip !== 'undefined' && storedDate === today) {
                setHealthTip(storedTip);
            } else {
                fetchTip();
            }
        } catch (error) {
             console.error("Could not read tip from localStorage:", error);
             fetchTip();
        }
    };
    
    loadTip();
  }, []);

  const GridButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    screen: Screen;
    color: string;
  }> = ({ icon, label, screen, color }) => (
    <button
      onClick={() => navigate(screen)}
      className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-md transition-transform transform hover:-translate-y-1 ${color}`}
    >
      {icon}
      <span className="mt-2 text-base font-semibold text-white">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="text-left">
        <h2 className="text-3xl font-bold text-brand-text-primary dark:text-gray-100">Welcome, {activeProfile.name.split(' ')[0]}!</h2>
        <p className="text-brand-text-secondary dark:text-gray-400 mt-1">How can we help you today?</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <GridButton
          icon={<DocumentTextIcon className="w-10 h-10 text-white" />}
          label="Records"
          screen={Screen.Records}
          color="bg-blue-500"
        />
        <GridButton
          icon={<SparklesIcon className="w-10 h-10 text-white" />}
          label="HealocAI"
          screen={Screen.HealocAI}
          color="bg-green-500"
        />
        <GridButton
          icon={<QrCodeIcon className="w-10 h-10 text-white" />}
          label="QR Card"
          screen={Screen.QRCode}
          color="bg-orange-500"
        />
         <GridButton
          icon={<UserCircleIcon className="w-10 h-10 text-white" />}
          label="Profile"
          screen={Screen.Profile}
          color="bg-purple-500"
        />
      </div>

      <div className="bg-brand-surface dark:bg-gray-800 p-5 rounded-xl shadow-sm">
        <h3 className="font-bold text-brand-text-primary dark:text-gray-200 text-lg mb-2">Health Tip of the Day</h3>
        <p className="text-brand-text-secondary dark:text-gray-400 text-base">{healthTip}</p>
      </div>

       <div className="bg-brand-surface dark:bg-gray-800 p-5 rounded-xl shadow-sm">
        <h3 className="font-bold text-brand-text-primary dark:text-gray-200 text-lg mb-3">Medication Reminders</h3>
        {activeProfile.medicationReminders && activeProfile.medicationReminders.length > 0 ? (
          <div className="space-y-3">
            {activeProfile.medicationReminders.map(reminder => (
              <div key={reminder.id} className="text-base border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0">
                <p className="font-semibold text-brand-text-primary dark:text-gray-200">{reminder.name} ({reminder.dosage})</p>
                <p className="text-brand-text-secondary dark:text-gray-400">Take at: {reminder.times.join(', ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-secondary dark:text-gray-400 text-base">No medication reminders set for {activeProfile.name}.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;