import { Device } from '@/types/location';
import { prisma } from './prisma';

// Fallback devices (used when DB is not set up)
const FALLBACK_DEVICES: Record<string, Device> = {
  '10': { id: '10', name: 'Joachim Pixel', color: '#e74c3c' },
  '11': { id: '11', name: 'Huawei Smartphone', color: '#3498db' },
};

const DEFAULT_DEVICE: Device = {
  id: 'unknown',
  name: 'Unknown Device',
  color: '#95a5a6',
};

/**
 * Get device from database or fallback to hardcoded
 * @param id Device ID
 * @returns Device object
 */
export async function getDeviceById(id: string): Promise<Device> {
  try {
    const device = await prisma.device.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    if (device) {
      return device;
    }
  } catch (error) {
    // Database not available, use fallback
    console.warn('Database not available, using fallback devices');
  }

  return FALLBACK_DEVICES[id] || DEFAULT_DEVICE;
}

/**
 * Get all devices from database or fallback
 * @returns Array of devices
 */
export async function getAllDevices(): Promise<Device[]> {
  try {
    const devices = await prisma.device.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return devices;
  } catch (error) {
    // Database not available, use fallback
    console.warn('Database not available, using fallback devices');
    return Object.values(FALLBACK_DEVICES);
  }
}

/**
 * Synchronous version for client components (uses hardcoded)
 * Use this until database is set up
 */
export function getDevice(id: string): Device {
  return FALLBACK_DEVICES[id] || DEFAULT_DEVICE;
}

export { DEFAULT_DEVICE, FALLBACK_DEVICES };
