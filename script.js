function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

/* 🔔 Popup */
function showPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "block";
  setTimeout(() => (popup.style.display = "none"), 2000);
}

/* 🚨 Send Alert */
async function sendAlert(msg) {
  const name = document.getElementById("name").value || "Guest";
  const location = document.getElementById("location").value || "Unknown";

  const res = await fetch("/alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg, name, location }),
  });

  const data = await res.json();

  document.getElementById("output").innerText =
    data.type + " | " + data.suggestion;

  showPopup();
}

/* 🚨 Panic */
function triggerPanic() {
  const msg = document.getElementById("message").value;

  if (!msg) {
    alert("Please describe the emergency!");
    return;
  }

  // 🔊 SOUND (must be here for browser)
  const sound = document.getElementById("alertSound");
  sound.currentTime = 0;
  sound.play().catch(() => {});

  sendAlert(msg);
}

/* 🎤 Voice */
function startVoice() {
  const rec = new (
    window.SpeechRecognition || window.webkitSpeechRecognition
  )();

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    sendAlert(text);
  };

  rec.start();
}
