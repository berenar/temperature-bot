declare module 'hap-node-client' {
  type HAPCharacteristic = {
    aid: number;
    iid: number;
    type: string;
    description?: string;
    value: number;
  };

  type HAPService = {
    characteristics: HAPCharacteristic[];
  };

  type HAPAccessory = {
    name?: string;
    host: string;
    port: number;
    services: HAPService[];
  };

  type HAPAccessories = {
    [deviceId: string]: HAPAccessory;
  };

  type HAPEvent = {
    [key: string]: unknown;
  };

  export class HAPNodeJSClient {
    constructor(options: {
      debug?: boolean;
      timeout?: number;
      refresh?: number;
      pin?: string;
    });
    
    on(event: "Ready", callback: () => void): void;
    on(event: "hapEvent", callback: (data: HAPEvent) => void): void;
    on(event: string, callback: (data?: unknown) => void): void;
    
    HAPaccessories(callback: (accessories: HAPAccessories) => void): void;
  }
}