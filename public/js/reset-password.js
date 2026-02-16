"use strict";
(() => {
  // src/client/reset-password.ts
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reset-form");
    const messageDiv = document.getElementById("message");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      if (newPassword !== confirmPassword) {
        showMessage("Passwords do not match", "error");
        return;
      }
      if (newPassword.length < 6) {
        showMessage("Password must be at least 6 characters", "error");
        return;
      }
      try {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, newPassword })
        });
        const data = await response.json();
        if (data.success) {
          showMessage(data.message + ". Redirecting to login...", "success");
          setTimeout(() => {
            window.location.href = "/login-page";
          }, 2e3);
        } else {
          showMessage(data.message, "error");
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "error");
        console.error("Password reset error:", error);
      }
    });
    function showMessage(message, type) {
      messageDiv.textContent = message;
      messageDiv.className = "message " + (type === "success" ? "success-message" : "error-message");
      messageDiv.style.display = "block";
    }
  });
})();
//# sourceMappingURL=reset-password.js.map
