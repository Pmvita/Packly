import type { CaptureInterface, CaptureInterfaceAddress } from './interface-types';

export type { CaptureInterface, CaptureInterfaceAddress };

const MOCK_INTERFACE: CaptureInterface = {
  name: 'mock0',
  description: 'Synthetic capture — Npcap/libpcap not required',
  addresses: [],
};

function mapAddress(address: {
  addr?: string;
  netmask?: string;
  addrType?: string;
  broadaddr?: string;
  dstaddr?: string;
}): CaptureInterfaceAddress {
  return {
    address: address.addr,
    netmask: address.netmask,
    family: address.addrType,
    broadcast: address.broadaddr ?? address.dstaddr,
  };
}

export function listCaptureInterfaces(): CaptureInterface[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Cap } = require('cap') as {
      Cap: {
        deviceList: () => Array<{
          name: string;
          description?: string;
          flags?: string[];
          addresses: Array<{
            addr?: string;
            netmask?: string;
            addrType?: string;
            broadaddr?: string;
            dstaddr?: string;
          }>;
        }>;
      };
    };
    const devices = Cap.deviceList();
    if (!devices.length) return [MOCK_INTERFACE];
    return devices.map((device) => ({
      name: device.name,
      description: device.description,
      flags: device.flags,
      addresses: device.addresses.map(mapAddress),
    }));
  } catch {
    return [MOCK_INTERFACE];
  }
}
