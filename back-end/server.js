import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import debtRoutes from "./routes/debts.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.MONGO_DB_NAME?.trim() || "payflow";
const PRIMARY_DB_URI = process.env.MONGO_URI?.trim();
const FALLBACK_DB_URI =
  process.env.MONGO_FALLBACK_URI?.trim() || `mongodb://127.0.0.1:27017/${DB_NAME}`;
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  dbName: DB_NAME,
};
let memoryServer;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/debts", debtRoutes);

// MongoDB Connection with graceful fallback
async function connectToDatabase() {
  if (PRIMARY_DB_URI) {
    try {
      await mongoose.connect(PRIMARY_DB_URI, MONGOOSE_OPTIONS);
      console.log(
        `✅ MongoDB connected (primary URI) to database "${mongoose.connection.name}".`
      );
      return;
    } catch (error) {
      console.error("⚠️ Primary MongoDB connection failed:", error.message);
      try {
        await mongoose.disconnect();
      } catch (disconnectErr) {
        console.error("⚠️ Error during primary disconnect:", disconnectErr.message);
      }
    }
  } else {
    console.log("ℹ️ No primary Mongo URI provided. Skipping to fallback.");
  }

  if (FALLBACK_DB_URI && (!PRIMARY_DB_URI || PRIMARY_DB_URI !== FALLBACK_DB_URI)) {
    try {
      await mongoose.connect(FALLBACK_DB_URI, MONGOOSE_OPTIONS);
      console.log("✅ MongoDB connected (fallback URI).");
      return;
    } catch (fallbackError) {
      console.error("❌ Fallback MongoDB connection error:", fallbackError.message);
      try {
        await mongoose.disconnect();
      } catch (fallbackDisconnectErr) {
        console.error(
          "⚠️ Error during fallback disconnect:",
          fallbackDisconnectErr.message
        );
      }
    }
  }

  console.warn("⚠️ Falling back to in-memory MongoDB instance for offline usage.");
  try {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: DB_NAME },
    });
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri, {
      ...MONGOOSE_OPTIONS,
      dbName: DB_NAME,
    });
    console.log("✅ MongoDB connected (in-memory).");
    return;
  } catch (memoryError) {
    console.error("❌ In-memory MongoDB startup failed:", memoryError.message);
    if (memoryServer) {
      try {
        await memoryServer.stop();
      } catch (memoryStopError) {
        console.error(
          "⚠️ Error while stopping memory server:",
          memoryStopError.message
        );
      }
      memoryServer = null;
    }
  }

  throw new Error("Unable to connect to any MongoDB instance.");
}

// Test Route
app.get("/", (req, res) => res.send("Backend is running..."));

// Bootstrap
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exitCode = 1;
  });

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

async function gracefulShutdown() {
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error("⚠️ Error disconnecting mongoose:", disconnectErr.message);
  }
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch (memoryStopErr) {
      console.error("⚠️ Error stopping in-memory MongoDB:", memoryStopErr.message);
    }
    memoryServer = null;
  }
}

process.on("SIGINT", async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await gracefulShutdown();
  process.exit(0);
});
