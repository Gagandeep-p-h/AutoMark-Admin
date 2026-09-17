import { webcrypto } from "node:crypto";
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "./.env") });
dotenv.config();

import app from "./src/app.js";
import { syncAllEnrollments } from "./src/utils/enrollmentHelper.js";

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`SmartAttend Backend running on http://localhost:${PORT}`);

  // Run initial auto-enrollment sync to ensure all students are enrolled in their classes
  syncAllEnrollments()
    .then((res) => {
      if (res.totalEnrolled > 0) {
        console.log(`[AutoEnroll Startup] Synced ${res.totalEnrolled} missing enrollment(s).`);
      }
    })
    .catch((err) => {
      console.error("[AutoEnroll Startup] Background sync error:", err?.message || err);
    });
});
