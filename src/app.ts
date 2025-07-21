import { schedule } from "node-cron";
import { HAPNodeJSClient } from "hap-node-client";

type TemperatureReading = {
  temperature: number;
  timestamp: Date;
  deviceName?: string;
};

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

type TemperatureDevice = {
  name: string;
  deviceId: string;
  aid: number;
  iid: number;
  temperature: number;
  host: string;
  port: number;
};

type HAPEvent = {
  [key: string]: unknown;
};

class TemperatureBot {
  private isRunning = false;

  async discoverHomePods(): Promise<TemperatureDevice[]> {
    try {
      const client = new HAPNodeJSClient({
        debug: true,
        timeout: 15,
        refresh: 40,
        pin: "031-45-154",
      });

      return new Promise((resolve, reject) => {
        const devices: TemperatureDevice[] = [];

        client.on("Ready", () => {
          console.log("HAP client ready, getting accessories...");

          client.HAPaccessories((accessories: HAPAccessories) => {
            console.log(
              "Discovered accessories:",
              Object.keys(accessories).length,
            );

            for (const [deviceId, accessory] of Object.entries(accessories)) {
              console.log(`Checking device: ${deviceId}`, accessory.name);

              if (accessory.services) {
                for (const service of accessory.services) {
                  if (service.characteristics) {
                    for (const char of service.characteristics) {
                      if (
                        char.type === "CurrentTemperature" ||
                        char.description?.includes("Temperature")
                      ) {
                        devices.push({
                          name: accessory.name || `Device-${deviceId}`,
                          deviceId,
                          aid: char.aid,
                          iid: char.iid,
                          temperature: char.value,
                          host: accessory.host,
                          port: accessory.port,
                        });
                        console.log(
                          `Found temperature sensor: ${char.value}°C`,
                        );
                      }
                    }
                  }
                }
              }
            }

            resolve(devices);
          });
        });

        client.on("hapEvent", (event: HAPEvent) => {
          console.log("HAP Event received:", event);
        });

        setTimeout(() => {
          if (devices.length === 0) {
            console.log(
              "No temperature sensors found, resolving with empty array",
            );
            resolve([]);
          }
        }, 20000);
      });
    } catch (error) {
      console.error("Error discovering HomePods:", error);
      throw error;
    }
  }

  async getTemperature(): Promise<TemperatureReading | null> {
    try {
      console.log("🌡️  Fetching temperature from HomePod...");

      const devices = await this.discoverHomePods();

      if (devices.length === 0) {
        console.log("❌ No HomePod devices with temperature sensors found");
        return null;
      }

      const homePod = devices[0];
      console.log(`📱 Found device: ${homePod.name}`);

      const reading: TemperatureReading = {
        temperature: homePod.temperature,
        timestamp: new Date(),
        deviceName: homePod.name,
      };

      console.log(
        `🌡️  Temperature: ${reading.temperature}°C at ${reading.timestamp.toLocaleString()}`,
      );

      return reading;
    } catch (error) {
      console.error("❌ Error fetching temperature:", error);
      return null;
    }
  }

  startHourlyMonitoring() {
    if (this.isRunning) {
      console.log("⚠️  Temperature monitoring is already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting hourly temperature monitoring...");

    schedule("0 * * * *", async () => {
      console.log("\n⏰ Scheduled temperature check...");
      const reading = await this.getTemperature();

      if (reading) {
        this.processTemperatureReading(reading);
      }
    });

    console.log(
      "✅ Hourly monitoring scheduled (runs at the top of every hour)",
    );

    console.log("\n🔄 Getting initial temperature reading...");
    this.getTemperature().then((reading) => {
      if (reading) {
        this.processTemperatureReading(reading);
      }
    });
  }

  private processTemperatureReading(reading: TemperatureReading) {
    console.log(`\n📊 Processing temperature reading:`);
    console.log(`   Device: ${reading.deviceName}`);
    console.log(`   Temperature: ${reading.temperature}°C`);
    console.log(`   Time: ${reading.timestamp.toLocaleString()}`);

    if (reading.temperature > 25) {
      console.log("🔥 Temperature is high - consider turning on AC");
    } else if (reading.temperature < 18) {
      console.log("🧊 Temperature is low - consider turning on heating");
    } else {
      console.log("✅ Temperature is comfortable");
    }
  }

  stop() {
    this.isRunning = false;
    console.log("⏹️  Temperature monitoring stopped");
  }
}

const bot = new TemperatureBot();

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down temperature bot...");
  bot.stop();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

bot.startHourlyMonitoring();
