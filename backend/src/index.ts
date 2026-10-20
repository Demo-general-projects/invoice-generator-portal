import "dotenv/config";
import { createApp } from "./app";

// Hosting platforms usually provide PORT; API_PORT is the local default.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`Ledgerline API listening on http://localhost:${port}`);
});
