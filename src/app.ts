import { schedule } from "node-cron";
import { HAPNodeJSClient } from "hap-node-client";

interface TemperatureReading {
  temperature: number;
  timestamp: Date;
  deviceName?: string;
}

class TemperatureBot {
  private isRunning = false;

  async discoverHomePods(): Promise<any[]> {
    try {
      const client = new HAPNodeJSClient({
        debug: true,
        timeout: 15,
        refresh: 40,
        pin: "031-45-154",
      });

      return new Promise((resolve, reject) => {
        const devices: any[] = [];

        client.on("Ready", () => {
          console.log("HAP client ready, getting accessories...");

          client.HAPaccessories((accessories: any) => {
            console.log(
              "Discovered accessories:",
              Object.keys(accessories).length,
            );

            for (const [deviceId, accessory] of Object.entries(
              accessories as any,
            )) {
              const acc = accessory as any;
              console.log(`Checking device: ${deviceId}`, acc.name);

              if (acc.services) {
                for (const service of acc.services) {
                  if (service.characteristics) {
                    for (const char of service.characteristics) {
                      if (
                        char.type === "CurrentTemperature" ||
                        char.description?.includes("Temperature")
                      ) {
                        devices.push({
                          name: acc.name || `Device-${deviceId}`,
                          deviceId,
                          aid: char.aid,
                          iid: char.iid,
                          temperature: char.value,
                          host: acc.host,
                          port: acc.port,
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

        client.on("hapEvent", (event: any) => {
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
