import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.API_PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`Ledgerline API listening on http://localhost:${port}`);
});
