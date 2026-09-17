import { app } from "./app.js";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";

async function start() {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`Discover Nashik API is listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Could not start API", error);
  process.exit(1);
});
