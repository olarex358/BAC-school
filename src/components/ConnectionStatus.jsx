import { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);

    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <div className={`connection-status ${online ? '' : 'offline'}`}>
      {online ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
