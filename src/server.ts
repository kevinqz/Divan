// server.ts

import express from "express";
import multer from "multer";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/api/transcription", upload.single("file"), async (req, res) => {
  // Perform transcription logic here and obtain the transcribed text

  // Assuming you have the transcribed text in a variable called `transcribedText`
  res.json({ transcribedText });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
