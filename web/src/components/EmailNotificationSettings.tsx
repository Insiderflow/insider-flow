'use client';

import { useState, useEffect } from 'react';

interface NotificationSettings {
  newTrades: boolean;
  watchlistUpdates: boolean;
  weeklyDigest: boolean;
}

export default function EmailNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    newTrades: true,
    watchlistUpdates: true,
    weeklyDigest: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/account/notification-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (_error) {
        console.error('Failed to load notification settings:', _error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = async (key: keyof NotificationSettings) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      
      const response = await fetch('/api/account/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      if (response.ok) {
        setMessage('設定已儲存');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || '儲存失敗');
        // Revert the change
        setSettings(settings);
      }
    } catch {
      setMessage('儲存失敗，請重試');
      // Revert the change
      setSettings(settings);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">載入設定中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded text-sm ${
          message.includes('失敗') 
            ? 'bg-red-600 text-white' 
            : 'bg-green-600 text-white'
        }`}>
          {message}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">新交易通知</h3>
            <p className="text-gray-400 text-sm">當有新的國會議員交易時通知您</p>
          </div>
          <button
            onClick={() => handleToggle('newTrades')}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.newTrades ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                settings.newTrades ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">觀察名單更新</h3>
            <p className="text-gray-400 text-sm">當您關注的政治家有新交易時通知</p>
          </div>
          <button
            onClick={() => handleToggle('watchlistUpdates')}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.watchlistUpdates ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                settings.watchlistUpdates ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">週報摘要</h3>
            <p className="text-gray-400 text-sm">每週發送交易摘要和統計</p>
          </div>
          <button
            onClick={() => handleToggle('weeklyDigest')}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.weeklyDigest ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                settings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>
    </div>
  );
}
