declare module 'cap' {
  import { EventEmitter } from 'events';

  export interface DeviceAddress {
    addr?: string;
    addrType?: string;
    netmask?: string;
    broadaddr?: string;
    dstaddr?: string;
  }

  export interface Device {
    name: string;
    description?: string;
    addresses: DeviceAddress[];
    flags?: string[];
  }

  export interface PacketHeader {
    seconds: number;
    nanoseconds: number;
    timestampSeconds?: number;
    timestampMicroseconds?: number;
    caplen: number;
    len: number;
  }

  export interface OpenOptions {
    bufferSize?: number;
    buffer?: Buffer;
    snapLength?: number;
    promisc?: boolean;
  }

  export type LinkType =
    | 'NULL'
    | 'ETHERNET'
    | 'LINUX_SLL'
    | 'LINUX_SLL2'
    | 'RAW'
    | 'IEEE802_11'
    | 'IEEE802_11_RADIO'
    | 'UNKNOWN';

  export interface Decoders {
    PROTOCOL: {
      LINK: Record<string, number>;
      LLC: Record<string, number>;
      ETHERTYPE: Record<string, number>;
      IP: Record<string, number>;
      TCP: Record<string, number>;
      UDP: Record<string, number>;
    };
  }

  export class Cap extends EventEmitter {
    static deviceList(): Device[];

    open(
      device: string,
      filter: string,
      bufferSize: number,
      buffer: Buffer,
      snapLength?: number
    ): number;

    setMinBytesForRead(minBytes: number): void;

    close(): void;
  }

  export const decoders: Decoders;
}

