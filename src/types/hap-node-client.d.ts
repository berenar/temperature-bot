declare module 'hap-node-client' {
  export class HAPNodeJSClient {
    constructor(options: {
      debug?: boolean;
      timeout?: number;
      refresh?: number;
      pin?: string;
    });
    
    on(event: string, callback: (data?: any) => void): void;
    HAPaccessories(callback: (accessories: any) => void): void;
  }
}