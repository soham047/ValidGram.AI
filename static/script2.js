document.addEventListener("DOMContentLoaded", function () {
    const profileForm = document.getElementById("profileForm");
    const resultDiv = document.getElementById("result");
    const loadingSpinner = document.getElementById("loadingSpinner");

    if (profileForm) {
        profileForm.addEventListener("submit", function (e) {
            e.preventDefault(); // Prevent default form submission

            const username = document.getElementById("username").value.trim();

            // Validate the username input
            if (!username) {
                resultDiv.style.display = "block";
                resultDiv.innerHTML = `<div class="alert alert-warning">Please enter a valid username.</div>`;
                return;
            }

            // Show loading message
            resultDiv.style.display = "block";
            resultDiv.innerHTML = `<div class="text-center"><div class="spinner-grow" role="status"></div> Fetching...</div>`;

            if (loadingSpinner) {
                loadingSpinner.classList.remove("d-none");
            }

            // Make the fetch request to the server
            fetch("/check_profile", {
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
                    if (data.result && data.profile_data) {
                        updateProfileDetails(data.profile_data, data.result);
                    } else if (data.status === "error") {
                        resultDiv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
                    } else {
                        resultDiv.innerHTML = `<div class="alert alert-danger">Invalid response from server.</div>`;
                    }
                })
                .catch((error) => {
                    resultDiv.innerHTML = `<div class="alert alert-danger">An error occurred: ${error.message}</div>`;
                })

                .finally(() => {
                    // Hide loading spinner
                    if (loadingSpinner) {
                        loadingSpinner.classList.add("d-none");
                    }
                });
        });
    }

    function updateProfileDetails(profileData, prediction) {
        resultDiv.innerHTML = `
            <h3>Profile Details</h3>
            <ul class="list-group mb-3">
                <li class="list-group-item"><i class="fa fa-circle-user fa-2x text-secondary my-3 mx-3"></i><p><strong>Username:</strong> ${profileData.username}</p></li>
                <li class="list-group-item"><i class="fa fa-id-badge fa-2x text-dark my-3 mx-3"></i><p><strong>Full Name:</strong> ${profileData.fullname}</p></li>
                <li class="list-group-item"><i class="<fa-regular fa-file-lines fa-2x text-dark my-3 mx-3"></i><p><strong>Bio:</strong> ${profileData.bio}</p></li>
                <li class="list-group-item"><i class="fa fa-image-portrait fa-2x text-primary my-3 mx-3"></i><p><strong>Profile Picture:</strong> ${profileData.pfp}</p></li>
                <li class="list-group-item"><i class="fa fa-user-lock fa-2x text-danger my-3 mx-3"></i><p><strong>Account Type:</strong> ${profileData.isPriv}</p></li>
                <li class="list-group-item"><i class="fa fa-users fa-2x text-success my-3 mx-3"></i><p><strong>Followers:</strong> ${profileData.followers_count}</p></li>
                <li class="list-group-item"><i class="fa fa-users fa-2x text-success my-3 mx-3"></i><p><strong>Following:</strong> ${profileData.following_count}</p></li>
                <li class="list-group-item"><i class="fa fa-photo-film fa-2x text-info my-3 mx-3"></i><p><strong>Posts:</strong> ${profileData.posts_count}</p></li>
                <li class="list-group-item"><i class="fa fa-link fa-2x text-info my-3 mx-3"></i><p><strong>External URL Present:</strong> ${profileData.externa_url}</p></li>
                <li class="list-group-item"><i class="fa fa-bell fa-2x text-warning my-3 mx-3"></i><p><strong>Prediction:</strong> ${prediction}</p></li>
            </ul>`;

        const predReal = document.getElementById("real_or_fake");
        if (predReal) {
            predReal.innerHTML = `
                <div class="card text-center alert alert-info">
                    <div class="card-header">
                        ValidGram.AI
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">Prediction: ${prediction}</h5>
                        <a href="#showResultsBtn" id="showResultsBtn" class="btn btn-primary">Show Detailed Results</a>
                    </div>
                    <div class="card-footer text-muted">
                        Powered by <i>AI</i> for Safer Social Media.
                    </div>
                </div>`;
        }

        // Attach event listener to the dynamically created button
        const showResultsBtn = document.getElementById("showResultsBtn");
        if (showResultsBtn) {
            showResultsBtn.addEventListener("click", function () {
                const resultsTab = new bootstrap.Tab(document.querySelector('a[href="#results"]'));
                resultsTab.show();
            });
        }

        
    }

    function getCsrfToken() {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "csrftoken") return value;
        }
        return "";
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();

            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = 700; // Duration in milliseconds
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = ease(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }

            function ease(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return (c / 2) * t * t + b;
                t--;
                return (-c / 2) * (t * (t - 2) - 1) + b;
            }

            requestAnimationFrame(animation);
        });
    });
});

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
});
