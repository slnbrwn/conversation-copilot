const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");
const transcript = document.getElementById("transcript");

startBtn.addEventListener("click", () => {

    status.textContent = "Listening...";

    transcript.textContent =
`This is where the live transcript will appear.

Today's goal is simply getting speech onto the screen.`;

});