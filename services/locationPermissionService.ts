/**
 * Checks if location services (GPS) are enabled on the device,
 * checks and requests permission, and alerts the user on denial.
 * Works safely on both React Native (Expo) and Web without compilation issues.
 */
export const checkGpsAndRequestPermission = async (): Promise<boolean> => {
  // 1. Check if running in a web browser environment
  if (typeof window !== 'undefined' && !navigator.userAgent.includes('Capacitor') && !navigator.userAgent.includes('React-Native')) {
    // In standard web browser, check navigator.geolocation
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return false;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  try {
    // 2. Dynamic imports to prevent static bundlers (like Vite on web) from failing to compile
    // @ts-ignore
    const Location = await import(/* @vite-ignore */ 'expo-location');
    // @ts-ignore
    const { Alert } = await import(/* @vite-ignore */ 'react-native');

    // Verify if Location Services (GPS hardware) are enabled on the device
    const isServicesEnabled = await Location.hasServicesEnabledAsync();
    
    if (!isServicesEnabled) {
      Alert.alert(
        'جی‌پی‌ئێس (GPS) یا کێمەیە',
        'تکایە GPS-ا خۆ ڤەکە دا نەخۆشخانەیان ببینیت.',
        [{ text: 'باشە' }]
      );
      return false;
    }

    // Check current foreground permission status
    const currentPermission = await Location.getForegroundPermissionsAsync();

    if (currentPermission.granted) {
      return true;
    }

    // Request location permission if not already granted
    const requestResult = await Location.requestForegroundPermissionsAsync();

    if (requestResult.granted) {
      return true;
    }

    // Alert user if permission is denied
    Alert.alert(
      'مۆڵەت نەهاتە دان',
      'تە مۆڵەتا دەستپێگەیشتنا جهی ڕەتکر. هندەک خزمەتگوزاری وەک دۆزینەوەیا نەخۆشخانەیان ل نێزیک کار ناکەن.',
      [{ text: 'تێگەیشتم' }]
    );
    
    return false;
  } catch (error) {
    console.error('Error during location service check:', error);
    return false;
  }
};
