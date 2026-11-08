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
