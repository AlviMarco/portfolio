/**
 * Example Integration: Using Mobile Features in Your App
 * 
 * This file shows how to integrate mobile functionality into your React components
 */

import React, { useEffect, useState } from 'react';
import { isMobileApp, getPlatform, shareFile, saveFileToDevice } from './src/config/mobile';
import { initializeCapacitor } from './src/config/capacitor-init';

// ============================================
// EXAMPLE 1: App Initialization
// ============================================
export const useCapacitorInit = () => {
  useEffect(() => {
    // Initialize Capacitor on app mount
    initializeCapacitor();
    
    if (isMobileApp()) {
      console.log('Mobile app initialized');
      logPlatformInfo();
    }
  }, []);
};

const logPlatformInfo = async () => {
  const platform = await getPlatform();
  console.log(`Platform: ${platform}`);
};

// ============================================
// EXAMPLE 2: Share Financial Report
// ============================================
export const useShareReport = () => {
  const shareReport = async (reportData: string, fileName: string) => {
    if (!isMobileApp()) {
      // Web fallback - download file
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(reportData)}`);
      element.setAttribute('download', fileName);
      element.click();
      return;
    }

    // Mobile - use native share
    try {
      const fileUrl = await saveFileToDevice(fileName, reportData);
      await shareFile('Financial Report', 'Check out this report', fileUrl as any);
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  };

  return { shareReport };
};

// ============================================
// EXAMPLE 3: Auto-save to Device
// ============================================
export const useDeviceBackup = () => {
  const saveBackup = async (data: any) => {
    if (!isMobileApp()) {
      // Web - save to localStorage
      localStorage.setItem('backup', JSON.stringify(data));
      return;
    }

    // Mobile - save to device storage
    try {
      await saveFileToDevice(
        `backup_${new Date().toISOString()}.json`,
        JSON.stringify(data)
      );
      console.log('Backup saved to device');
    } catch (error) {
      console.error('Failed to save backup:', error);
    }
  };

  return { saveBackup };
};

// ============================================
// EXAMPLE 4: Component Integration
// ============================================
export const MobileAwareComponent: React.FC = () => {
  const [platform, setPlatform] = useState<string>('');
  const { shareReport } = useShareReport();
  const { saveBackup } = useDeviceBackup();

  useCapacitorInit();

  useEffect(() => {
    if (isMobileApp()) {
      getPlatform().then(setPlatform);
    }
  }, []);

  const handleExportReport = async () => {
    const reportData = 'Financial Report Content...';
    
    if (isMobileApp()) {
      await shareReport(reportData, 'report.txt');
    } else {
      // Web fallback
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(reportData)}`);
      element.setAttribute('download', 'report.txt');
      element.click();
    }
  };

  const handleBackup = async () => {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: 'Your app data here'
    };
    
    await saveBackup(data);
  };

  return (
    <div>
      {isMobileApp() && (
        <div className="bg-blue-50 p-4 rounded">
          <p>Running on: <strong>{platform}</strong></p>
        </div>
      )}
      
      <button onClick={handleExportReport}>
        Export Report
      </button>
      
      <button onClick={handleBackup}>
        Backup to Device
      </button>
    </div>
  );
};

// ============================================
// EXAMPLE 5: Platform-Specific UI
// ============================================
export const PlatformSpecificUI: React.FC = () => {
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (isMobileApp()) {
      getPlatform().then((platform) => {
        setIsAndroid(platform === 'android');
        setIsIOS(platform === 'ios');
      });
    }
  }, []);

  return (
    <>
      {isAndroid && (
        <div className="bg-green-50 p-4">
          Android-specific features available
        </div>
      )}
      
      {isIOS && (
        <div className="bg-gray-50 p-4">
          iOS-specific features available
        </div>
      )}
      
      {!isMobileApp() && (
        <div className="bg-yellow-50 p-4">
          Web version
        </div>
      )}
    </>
  );
};

// ============================================
// EXAMPLE 6: Complete Feature Usage
// ============================================
export const CompleteExample: React.FC = () => {
  const [status, setStatus] = useState('Ready');

  useCapacitorInit();

  const handleCompleteWorkflow = async () => {
    try {
      setStatus('Processing...');

      // 1. Check if mobile
      if (isMobileApp()) {
        const platform = await getPlatform();
        console.log(`Running on ${platform}`);
      }

      // 2. Prepare data
      const reportData = JSON.stringify({
        date: new Date(),
        data: 'Report content'
      });

      // 3. Save to device
      await saveFileToDevice('report.json', reportData);
      
      // 4. Share file
      if (isMobileApp()) {
        await shareFile(
          'Financial Report',
          'Here is your financial report',
          'report.json'
        );
      }

      setStatus('Success!');
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <div>
      <p>Status: {status}</p>
      <button onClick={handleCompleteWorkflow}>
        Run Complete Workflow
      </button>
    </div>
  );
};

// ============================================
// EXPORT QUICK REFERENCE
// ============================================
/**
 * Quick Reference for Mobile Integration:
 * 
 * 1. Check if running on mobile:
 *    isMobileApp()
 * 
 * 2. Get platform (ios/android):
 *    getPlatform()
 * 
 * 3. Share files:
 *    shareFile(title, text, url)
 * 
 * 4. Save to device storage:
 *    saveFileToDevice(fileName, content)
 * 
 * 5. Read from device:
 *    readFileFromDevice(fileName)
 * 
 * 6. Initialize app lifecycle:
 *    initializeCapacitor()
 * 
 * See services/mobile.ts for all available APIs
 */
