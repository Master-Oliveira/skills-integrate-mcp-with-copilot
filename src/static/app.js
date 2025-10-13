document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        // Add register student form (hidden by default)
        const registerFormId = `register-form-${name.replace(/\s+/g, '-')}`;
        const registerFormHTML = `
          <form class="register-form hidden" id="${registerFormId}" data-activity="${name}">
            <div class="form-group">
              <label for="email-${name}">Student Email:</label>
              <input type="email" id="email-${name}" required placeholder="your-email@mergington.edu" />
            </div>
            <button type="submit">Register</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </form>
        `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <button class="show-register-btn" data-activity="${name}">Register Student</button>
          <div class="register-form-container">${registerFormHTML}</div>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to show register form buttons
      document.querySelectorAll(".show-register-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
          const activity = button.getAttribute("data-activity");
          const form = document.getElementById(`register-form-${activity.replace(/\s+/g, '-')}`);
          if (form) {
            form.classList.remove("hidden");
            button.classList.add("hidden");
          }
        });
      });

      // Add event listeners to register forms
      document.querySelectorAll(".register-form").forEach((form) => {
        form.addEventListener("submit", handleRegister);
        // Cancel button hides the form
        form.querySelector(".cancel-btn").addEventListener("click", (event) => {
          event.preventDefault();
          form.classList.add("hidden");
          const activity = form.getAttribute("data-activity");
          const showBtn = document.querySelector(`.show-register-btn[data-activity='${activity}']`);
          if (showBtn) showBtn.classList.remove("hidden");
        });
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }


  // Handle per-activity registration
  async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const activity = form.getAttribute("data-activity");
    const emailInput = form.querySelector("input[type='email']");
    const email = emailInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        form.reset();
        form.classList.add("hidden");
        const showBtn = document.querySelector(`.show-register-btn[data-activity='${activity}']`);
        if (showBtn) showBtn.classList.remove("hidden");
        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
