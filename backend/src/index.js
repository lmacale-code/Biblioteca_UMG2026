import express from "express";
import routes from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
