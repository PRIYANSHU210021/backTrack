// content.js
// This script runs on LeetCode and GeeksforGeeks problem pages.
// It injects a floating button and handles the display and logic
// of the DSA Problem Tracker popup directly on the page.



document.addEventListener('DOMContentLoaded', () => {
    // Only proceed if the script is running on a LeetCode or GeeksforGeeks problem page
    const currentUrl = window.location.href;
    const isSupportedPlatform = currentUrl.includes('leetcode.com/problems/') || currentUrl.includes('geeksforgeeks.org/problems/');

    if (!isSupportedPlatform) {
        // If not on a suported platform, don't show any UI
        return;
    }

    // --- HTML Structure for the Floating Button and Popup ---
    const floatingButtonHTML = `
        <button id="dsaTrackerFloatingBtn" class="dsa-tracker-floating-btn shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
    `;

    // The entire popup HTML structure, including Tailwind classes and custom styles
    const popupHTML = `
        <div id="dsaTrackerPopupOverlay" class="dsa-tracker-overlay hidden"></div>
        <div id="dsaTrackerPopup" class="dsa-tracker-popup hidden bg-white rounded-lg shadow-xl">
            <div class="p-4 relative">
                <button id="dsaTrackerCloseBtn" class="dsa-tracker-close-btn">&times;</button>
                <h1 class="text-xl font-bold text-gray-800 mb-4 text-center">DSA Problem Tracker</h1>

                <div id="dsaTrackerMessage" class="hidden text-sm p-2 rounded mb-3 text-center" style="background-color: #e0f2fe; color: #0284c7;"></div>

                <div class="mb-4">
                    <h2 class="text-lg font-semibold text-gray-700 mb-2">Add New Problem</h2>
                    <div class="mb-2">
                        <label for="dsaProblemTitle" class="block text-sm font-medium text-gray-700">Title:</label>
                        <input type="text" id="dsaProblemTitle" placeholder="Problem Title"
                               class="dsa-tracker-input mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                    <div class="mb-2">
                        <label for="dsaProblemUrl" class="block text-sm font-medium text-gray-700">URL:</label>
                        <input type="text" id="dsaProblemUrl" placeholder="Problem URL"
                               class="dsa-tracker-input mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                    <div class="mb-4">
                        <label for="dsaProblemNotes" class="block text-sm font-medium text-gray-700">Notes (Optional):</label>
                        <textarea id="dsaProblemNotes" placeholder="Add your notes about the problem..." rows="2"
                                  class="dsa-tracker-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    <button id="dsaAddProblemBtn" class="dsa-tracker-btn-primary w-full py-2 px-4 rounded-md font-semibold">
                        Add Problem
                    </button>
                </div>

                <div>
                    <h2 class="text-lg font-semibold text-gray-700 mb-2">Tracked Problems</h2>
                    <div id="dsaProblemsContainer" class="space-y-3 max-h-60 overflow-y-auto pr-2">
                        <!-- Problems will be loaded here by JavaScript -->
                        <p id="dsaNoProblemsMessage" class="text-center text-gray-500 italic py-4 border border-dashed border-gray-300 rounded-md">
                            No problems tracked yet. Add one above!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- Inject Floating Button into the page ---
    document.body.insertAdjacentHTML('beforeend', floatingButtonHTML);
    const floatingBtn = document.getElementById('dsaTrackerFloatingBtn');

    // --- Inject Popup HTML into the page (initially hidden) ---
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    const popup = document.getElementById('dsaTrackerPopup');
    const popupOverlay = document.getElementById('dsaTrackerPopupOverlay');
    const closeBtn = document.getElementById('dsaTrackerCloseBtn');

    // --- Get references to popup elements ---
    const problemTitleInput = document.getElementById('dsaProblemTitle');
    const problemUrlInput = document.getElementById('dsaProblemUrl');
    const problemNotesInput = document.getElementById('dsaProblemNotes');
    const addProblemBtn = document.getElementById('dsaAddProblemBtn');
    const problemsContainer = document.getElementById('dsaProblemsContainer');
    const noProblemsMessage = document.getElementById('dsaNoProblemsMessage');
    const dsaTrackerMessage = document.getElementById('dsaTrackerMessage'); // For temporary feedback messages

    // --- Utility function to show temporary messages ---
    const showMessage = (msg, type = 'info') => {
        dsaTrackerMessage.textContent = msg;
        dsaTrackerMessage.classList.remove('hidden');
        if (type === 'error') {
            dsaTrackerMessage.style.backgroundColor = '#fee2e2'; // red-100
            dsaTrackerMessage.style.color = '#dc2626'; // red-700
        } else { // 'info' or 'success'
            dsaTrackerMessage.style.backgroundColor = '#e0f2fe'; // blue-100
            dsaTrackerMessage.style.color = '#0284c7'; // blue-700
        }
        setTimeout(() => {
            dsaTrackerMessage.classList.add('hidden');
        }, 3000); // Hide after 3 seconds
    };

    // --- Function to render problems in the popup ---
    const renderProblems = (problems) => {
        problemsContainer.innerHTML = ''; // Clear existing list
        if (problems.length === 0) {
            noProblemsMessage.classList.remove('hidden');
        } else {
            noProblemsMessage.classList.add('hidden');
            problems.forEach((problem, index) => {
                const problemDiv = document.createElement('div');
                problemDiv.className = 'dsa-tracker-problem-item relative bg-gray-50 p-3 rounded-md border border-gray-200';
                problemDiv.innerHTML = `
                    <h3 class="text-md font-semibold text-gray-900 mb-1">${problem.title || 'No Title'}</h3>
                    <a href="${problem.url}" target="_blank" class="text-sm text-blue-600 hover:underline block mb-1">${problem.url}</a>
                    ${problem.notes ? `<p class="text-sm text-gray-600">${problem.notes}</p>` : ''}
                    <button class="dsa-tracker-delete-btn" data-index="${index}">&times;</button>
                `;
                problemsContainer.appendChild(problemDiv);
            });
            // Add event listeners for delete buttons after rendering
            problemsContainer.querySelectorAll('.dsa-tracker-delete-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const indexToDelete = parseInt(event.target.dataset.index);
                    deleteProblem(indexToDelete);
                });
            });
        }
    };

    // --- Message passing to background script for storage operations ---
    // Function to load problems from storage
    const loadProblems = async () => {
        chrome.runtime.sendMessage({ action: 'loadProblems' }, (response) => {
            if (response && response.problems) {
                renderProblems(response.problems);
            }
        });
    };

    // Function to add a new problem to storage
    const addProblem = () => {
        const title = problemTitleInput.value.trim();
        const url = problemUrlInput.value.trim();
        const notes = problemNotesInput.value.trim();

        if (title && url) {
            chrome.runtime.sendMessage({ action: 'addProblem', payload: { title, url, notes } }, (response) => {
                if (response.success) {
                    showMessage('Problem added successfully!', 'success');
                    problemTitleInput.value = '';
                    problemUrlInput.value = '';
                    problemNotesInput.value = '';
                    loadProblems(); // Reload list after adding
                } else {
                    showMessage(response.message || 'Error adding problem.', 'error');
                }
            });
        } else {
            showMessage('Problem Title and URL are required!', 'error');
        }
    };

    // Function to delete a problem from storage
    const deleteProblem = (index) => {
        chrome.runtime.sendMessage({ action: 'deleteProblem', payload: { index } }, (response) => {
            if (response.success) {
                showMessage('Problem deleted.', 'info');
                loadProblems(); // Reload list after deleting
            } else {
                showMessage(response.message || 'Error deleting problem.', 'error');
            }
        });
    };

    // --- Event Listeners ---
    floatingBtn.addEventListener('click', () => {
        popup.classList.remove('hidden');
        popupOverlay.classList.remove('hidden');
        loadProblems(); // Load problems when popup opens

        // Get current tab info and pre-fill inputs
        chrome.runtime.sendMessage({ action: 'getCurrentTabInfo' }, (response) => {
            if (response && response.url && response.title) {
                problemUrlInput.value = response.url;
                let extractedTitle = response.title;
                if (response.url.includes('leetcode.com')) {
                    extractedTitle = response.title.replace(/ - LeetCode$/, '').trim();
                } else if (response.url.includes('geeksforgeeks.org')) {
                    extractedTitle = response.title.split('|')[0].split('- GeeksforGeeks')[0].trim();
                }
                problemTitleInput.value = extractedTitle;
            } else {
                problemTitleInput.value = '';
                problemUrlInput.value = '';
            }
            problemNotesInput.value = ''; // Clear notes input on open
        });
    });

    closeBtn.addEventListener('click', () => {
        popup.classList.add('hidden');
        popupOverlay.classList.add('hidden');
    });

    popupOverlay.addEventListener('click', () => {
        popup.classList.add('hidden');
        popupOverlay.classList.add('hidden');
    });

    addProblemBtn.addEventListener('click', addProblem);

    // Initial load of problems (optional, could be done only when popup opens)
    // loadProblems(); // Removed as loadProblems is called when popup opens
});

