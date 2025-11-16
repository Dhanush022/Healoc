import React, { useEffect, useState } from 'react';
import { HealthProfile } from '../types';

interface EmergencyModeProps {
  activeProfile: HealthProfile;
  onClose: () => void;
}

const EmergencyMode: React.FC<EmergencyModeProps> = ({ activeProfile, onClose }) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'fetching' | 'success' | 'error'>('fetching');
  const [locationError, setLocationError] = useState<string>('');

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationStatus('success');
            },
            (error: GeolocationPositionError) => {
                setLocationStatus('error');
                // FIX: Use correct numeric error codes for specific, user-friendly messages.
                let message = 'An unknown error occurred.';
                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        message = "Location permission denied. Please enable it in your settings.";
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        message = "Location information is currently unavailable.";
                        break;
                    case 3: // TIMEOUT
                        message = "The request to get your location timed out.";
                        break;
                    default:
                        // Fallback to the browser's message if available and it's a string.
                        message = (typeof error.message === 'string' && error.message)
                            ? error.message 
                            : "An unknown error occurred while fetching location.";
                        break;
                }
                setLocationError(message);
                console.error("Geolocation error:", error);
            }
        );
    } else {
        setLocationStatus('error');
        setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleSendAlert = () => {
    const phoneNumbers = activeProfile.emergencyContacts.map(c => c.phone).join(',');
    if (!phoneNumbers) {
        alert('No emergency contacts found to send an alert to.');
        return;
    }

    let message;
    if (locationStatus === 'success' && location) {
      const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      message = `EMERGENCY! ${activeProfile.name} needs help. Current location: ${mapsUrl}`;
    } else {
      message = `EMERGENCY! ${activeProfile.name} needs help. I am unable to share my current location.`;
    }
    
    // This will open the user's default SMS app with the contacts and message pre-filled.
    window.location.href = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
  };

  const InfoBlock: React.FC<{ label: string; value: string; isCritical?: boolean }> = ({ label, value, isCritical }) => (
    <div className="bg-white/10 p-4 rounded-xl">
      <p className="text-sm uppercase tracking-wider text-white/70">{label}</p>
      <p className={`text-3xl font-bold font-mono ${isCritical ? 'text-yellow-300' : 'text-white'}`}>{value || 'N/A'}</p>
    </div>
  );
  
  const alertButtonText = locationStatus === 'success' ? 'SEND LOCATION ALERT' : 'SEND ALERT';

  return (
    <div className="fixed inset-0 bg-brand-red z-50 flex flex-col p-6 animate-pulse-bg font-sans">
      <style>{`
        @keyframes pulse-bg {
          0% { background-color: #FF3B30; }
          50% { background-color: #d92b21; }
          100% { background-color: #FF3B30; }
        }
        .animate-pulse-bg { animation: pulse-bg 2s infinite; }
      `}</style>
      
      <div className="text-center pt-4 pb-6">
        <h1 className="text-5xl font-extrabold text-white tracking-wider">EMERGENCY</h1>
        <p className="text-white/80 mt-2">Critical info for {activeProfile.name}.</p>
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto pb-4">
        <InfoBlock label="Name" value={activeProfile.name} />
        <InfoBlock label="Date of Birth" value={activeProfile.dob} />
        <InfoBlock label="Blood Type" value={activeProfile.bloodType} isCritical />
        
        <div className="bg-white/10 p-4 rounded-xl">
          <p className="text-sm uppercase tracking-wider text-white/70">ALLERGIES</p>
          {activeProfile.allergies.length > 0 ? (
            activeProfile.allergies.map(allergy => (
              <p key={allergy.id} className="text-3xl font-bold font-mono text-yellow-300">{allergy.name} ({allergy.severity})</p>
            ))
          ) : (
            <p className="text-3xl font-bold font-mono text-white">None Reported</p>
          )}
        </div>

        <div className="bg-white/10 p-4 rounded-xl">
          <p className="text-sm uppercase tracking-wider text-white/70">EMERGENCY CONTACTS</p>
          {activeProfile.emergencyContacts.length > 0 ? (
            activeProfile.emergencyContacts.map(contact => (
              <div key={contact.name} className="mt-3">
                 <p className="text-2xl font-bold text-white">{contact.name.split('(')[0].trim()}</p>
                 <p className="text-xl text-white/80 font-mono">{contact.phone}</p>
              </div>
            ))
          ) : (
             <p className="text-2xl font-bold text-white">None</p>
          )}
        </div>
      </div>
      
      <div className="mt-auto space-y-4 pt-4">
          <div className="text-center bg-white/20 text-white font-semibold py-3 px-4 rounded-xl text-base">
              {locationStatus === 'fetching' && 'Getting current location...'}
              {locationStatus === 'success' && 'Location found. Ready to send alert.'}
              {locationStatus === 'error' && `Location Error: ${locationError} Alert will be sent without location.`}
          </div>

          <button
              onClick={handleSendAlert}
              disabled={locationStatus === 'fetching'}
              className="w-full bg-yellow-300 text-brand-red font-bold py-4 px-4 rounded-xl text-xl tracking-wider shadow-lg disabled:bg-white/30 disabled:text-white/70 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
          >
              {alertButtonText}
          </button>

          <button
              onClick={onClose}
              className="w-full bg-white/25 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-white/40"
          >
              CLOSE
          </button>
      </div>

    </div>
  );
};

export default EmergencyMode;