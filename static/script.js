document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("profileForm").addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent default form submission

        const username = document.getElementById("username").value.trim();
        const resultDiv = document.getElementById("result");

        // Validate the username input
        if (!username) {
            resultDiv.style.display = "block";
            resultDiv.innerHTML = `<div class="alert alert-warning">Please enter a valid username.</div>`;
            return;
        }

        // Show loading message
        resultDiv.style.display = "block";
        resultDiv.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"></div> Loading...</div>`;

        // Make the fetch request to the server
        fetch("/check/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": getCsrfToken(), // Get CSRF token from cookies
            },
            body: `username=${encodeURIComponent(username)}`,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // Check if the response contains the necessary data
                if (data.result && data.profile_data) {
                    updateProfileDetails(data.profile_data, data.result);
                } else if (data.status === "error") {
                    resultDiv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
                } else {
                    resultDiv.innerHTML = `<div class="alert alert-danger">Invalid response from server.</div>`;
                }
            })
            .catch((error) => {
                // Handle any errors during the fetch request
                resultDiv.innerHTML = `<div class="alert alert-danger">An error occurred: ${error.message}</div>`;
            });
    });

    // Helper function to update the profile details dynamically
    function updateProfileDetails(profileData, prediction) {
        const resultDiv = document.getElementById("result");
        resultDiv.style.display = "block";

        // Safely update profile details
        setTextContent("result-username", profileData.username || "N/A");
        setTextContent("result-fullname", profileData.fullname || "N/A");
        setTextContent("result-bio", profileData.bio || "N/A");
        setTextContent("result-profile-pic", profileData.pfp ? "Yes" : "No");
        setTextContent("result-account-type", profileData.isPriv ? "Private" : "Public");
        setTextContent("result-followers", profileData.followers_count || "N/A");
        setTextContent("result-following", profileData.following_count || "N/A");
        setTextContent("result-posts", profileData.posts_count || "N/A");
        setTextContent("result-external-url", profileData.external_url ? "Yes" : "No");

        // Update prediction result
        const predictionElement = document.getElementById("result-prediction");
        if (predictionElement) {
            predictionElement.textContent = `Prediction: ${prediction}`;
            predictionElement.className = prediction === "Real" ? "alert alert-success" : "alert alert-danger";
        }
    }

    // Helper function to safely set text content
    function setTextContent(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element with ID '${elementId}' not found.`);
        }
    }

    // Helper function to get CSRF token from cookies
    function getCsrfToken() {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "csrftoken") return value;
        }
        return "";
    }
});