import { Cap } from 'cap';

export interface CaptureInterfaceAddress {
  address?: string;
  netmask?: string;
  family?: string;
  broadcast?: string;
}

export interface CaptureInterface {
  name: string;
  description?: string;
  addresses: CaptureInterfaceAddress[];
  flags?: string[];
}

function mapAddress(address: { addr?: string; netmask?: string; addrType?: string; broadaddr?: string; dstaddr?: string; }): CaptureInterfaceAddress {
  return {
    address: address.addr,
    netmask: address.netmask,
    family: address.addrType,
    broadcast: address.broadaddr ?? address.dstaddr,
  };
}

export function listCaptureInterfaces(): CaptureInterface[] {
  try {
    const devices = Cap.deviceList();
    return devices.map((device) => ({
      name: device.name,
      description: device.description,
      flags: device.flags,
      addresses: device.addresses.map(mapAddress),
    }));
  } catch (error) {
    throw new Error(
      `Failed to enumerate capture interfaces: ${(error as Error).message}`,
      { cause: error as Error }
    );
  }
}

