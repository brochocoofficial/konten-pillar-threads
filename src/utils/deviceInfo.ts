import { DeviceInfo } from '../types';

export function getClientDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let browser = 'Browser Unknown';
  let os = 'OS Unknown';
  let device = 'Desktop';

  // Detect Browser
  if (ua.includes('Firefox')) {
    browser = 'Mozilla Firefox';
  } else if (ua.includes('Edg/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('Chrome/')) {
    browser = 'Google Chrome';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Apple Safari';
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera';
  }

  // Detect OS
  if (ua.includes('Win')) {
    os = 'Windows PC';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Android')) {
    os = 'Android';
    device = 'Mobile Phone';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    device = ua.includes('iPad') ? 'Tablet (iPad)' : 'iPhone';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  if (window.innerWidth <= 768 && device === 'Desktop') {
    device = 'Mobile Web Browser';
  }

  return { device, browser, os };
}
