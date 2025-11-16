
import React from 'react';
import { HealthProfile } from '../types';

interface EmergencyCardProps {
    activeProfile: HealthProfile;
}

const EmergencyCard: React.FC<EmergencyCardProps> = ({ activeProfile }) => {
  const emergencyData = {
    name: activeProfile.name,
    dob: activeProfile.dob,
    bloodType: activeProfile.bloodType,
    allergies: activeProfile.allergies.map(a => `${a.name} (${a.severity})`).join(', ') || 'None',
    contacts: activeProfile.emergencyContacts.map(c => `${c.name}: ${c.phone}`).join(' | '),
  };

  const qrDataString = encodeURIComponent(JSON.stringify(emergencyData));
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrDataString}&bgcolor=F0F2F5`;
  const qrCodeUrlDark = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrDataString}&bgcolor=1F2937&color=FFFFFF`;

  const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="py-3 border-b border-gray-200 dark:border-gray-700">
      <p className="text-sm text-brand-text-secondary dark:text-gray-400">{label}</p>
      <p className="font-semibold text-brand-text-primary dark:text-gray-200">{value}</p>
    </div>
  );

  return (
    <div className="bg-brand-surface dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center">
      <h3 className="text-xl font-bold mb-4 text-brand-text-primary dark:text-gray-100">Emergency Health Card for {activeProfile.name}</h3>
      <p className="text-sm text-brand-text-secondary dark:text-gray-400 mb-6">
        In an emergency, first responders can scan this QR code to access critical health information. This card is available offline.
      </p>
      <div className="flex justify-center mb-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
        <img src={qrCodeUrl} alt="Emergency QR Code" className="rounded-lg block dark:hidden" />
        <img src={qrCodeUrlDark} alt="Emergency QR Code Dark" className="rounded-lg hidden dark:block" />
      </div>

      <div className="text-left space-y-2">
        <InfoRow label="Name" value={activeProfile.name} />
        <InfoRow label="Date of Birth" value={activeProfile.dob} />
        {/* FIX: Changed `active.bloodType` to `activeProfile.bloodType` to fix reference error. */}
        <InfoRow label="Blood Type" value={activeProfile.bloodType} />
        <InfoRow label="Known Allergies" value={activeProfile.allergies.map(a => a.name).join(', ') || 'None'} />
        <p className="text-sm text-brand-text-secondary dark:text-gray-400 pt-4">Emergency Contacts for {activeProfile.name}:</p>
        {activeProfile.emergencyContacts.map(contact => (
           <InfoRow key={contact.name} label={contact.name.includes('(') ? contact.name.substring(contact.name.indexOf('(') + 1, contact.name.indexOf(')')) : 'Contact'} value={contact.name.split('(')[0].trim() + " - " + contact.phone} />
        ))}
      </div>
    </div>
  );
};

export default EmergencyCard;
