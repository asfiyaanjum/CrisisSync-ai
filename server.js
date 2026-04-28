const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve html + mp3

// 🔑 Replace with your key
const genAI = new GoogleGenerativeAI("AIzaSyBgPiHEgLdgsHfo9zwvslBXdwoozq9ufAE");

let alerts = [];

// 🔹 Fallback classification
function classifyEmergency(input) {
  input = input.toLowerCase();

  if (input.includes("fire") || input.includes("smoke"))
    return "🔥 Fire Emergency";
  if (input.includes("pain") || input.includes("help"))
    return "🚑 Medical Emergency";
  if (input.includes("thief") || input.includes("attack"))
    return "🚨 Security Threat";

  return "⚠️ General Emergency";
}

// 🔹 Gemini AI
async function classifyWithGemini(input) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Classify this emergency into ONE:
Fire, Medical, Security, General

Input: "${input}"

Return only one word.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// 🔹 Suggestions
function getSuggestions(type) {
  if (type.includes("Fire")) return "Evacuate immediately, avoid elevators.";
  if (type.includes("Medical")) return "Call ambulance, give first aid.";
  if (type.includes("Security")) return "Stay safe, alert security.";
  return "Stay calm and seek help.";
}

// 🔹 Priority
function getPriority(type) {
  if (type.includes("Fire") || type.includes("Security")) return "High";
  if (type.includes("Medical")) return "Medium";
  return "Low";
}

// 🚨 CREATE ALERT
app.post("/alert", async (req, res) => {
  const message = req.body.message || "No message";
  const name = req.body.name || "Guest";
  const location = req.body.location || "Unknown";

  let type;

  try {
    const aiType = await classifyWithGemini(message);

    if (aiType.toLowerCase().includes("fire")) type = "🔥 Fire Emergency";
    else if (aiType.toLowerCase().includes("medical"))
      type = "🚑 Medical Emergency";
    else if (aiType.toLowerCase().includes("security"))
      type = "🚨 Security Threat";
    else type = "⚠️ General Emergency";
  } catch {
    type = classifyEmergency(message);
  }

  const alert = {
    id: Date.now(),
    name,
    location,
    message,
    type,
    suggestion: getSuggestions(type),
    priority: getPriority(type),
    status: "Active",
    time: new Date().toLocaleString(),
  };

  alerts.push(alert);

  if (alerts.length > 5) alerts.shift();

  res.json(alert);
});

// 📊 GET ALERTS
app.get("/alerts", (req, res) => {
  res.json(alerts);
});

// ✅ RESOLVE
app.post("/resolve/:id", (req, res) => {
  const id = parseInt(req.params.id);

  alerts = alerts.map((a) => (a.id === id ? { ...a, status: "Resolved" } : a));

  res.json({ success: true });
});
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.listen(5000, () => console.log("Server running"));
