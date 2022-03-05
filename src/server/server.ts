import express from "express";
import path from "path";

const app = express();

// Serve build/site under /.
app.use("/", express.static(path.join(__dirname, "../site")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening at http://localhost:${port}/`));
