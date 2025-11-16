
import React from 'react';

const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6.5-.5h.01M12 20v1m6.5-.5h.01M4 12H2m13.5.5h.01M4 12h.01M12 4h.01M4 4h2v2H4V4zm8 0h2v2h-2V4zm8 0h2v2h-2V4zM4 12h2v2H4v-2zm8 8h2v2h-2v-2zm-8-8h2v2H4v-2z" />
  </svg>
);

export default QrCodeIcon;
