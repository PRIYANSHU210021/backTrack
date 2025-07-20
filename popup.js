
document.addEventListener('DOMContentLoaded', async () => {
    const problemTitleInput = document.getElementById('problemTitle');
    const problemUrlInput = document.getElementById('problemUrl');
    const problemNotesInput = document.getElementById('problemNotes');
    const addProblemBtn = document.getElementById('addProblemBtn');
    // const problemsContainer = document.getElementById('problemsContainer');
    // const noProblemsMessage = document.getElementById('noProblemsMessage');
    const platformMessage = document.getElementById('platformMessage');
    const todaysRevisions = document.getElementById('todaysRevisions');
    // const upcomingRevisions = document.getElementById('upcomingRevisions');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const intervalInput = document.getElementById('intervalInput');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const cancelSettingsBtn = document.getElementById('cancelSettings');

    // Default revision setting
    let revisionSettings = {
        intervals: [1, 3, 5]
    };

    function loadProblems() {
        chrome.storage.sync.get(['dsaProblems'], (result) => {
            const problems = result.dsaProblems || [];
            renderProblems(problems);
        });
    }

    loadSettings();
    loadProblems();
    setupEventListeners();


    function setupEventListeners() {
        addProblemBtn.addEventListener('click', addProblem);
        settingsBtn.addEventListener('click', openSettings);
        saveSettingsBtn.addEventListener('click', saveSettings);
        cancelSettingsBtn.addEventListener('click', closeSettings);
        document.addEventListener('click', handleMarkAsDone);
        document.getElementById('clearAllUpcomingBtn').addEventListener('click', clearAllUpcomingProblems);

    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    async function loadSettings() {
        chrome.storage.sync.get(['revisionSettings'], (result) => {
            if (result.revisionSettings) {
                revisionSettings = result.revisionSettings;
            }
        });
    }

    function openSettings() {
        intervalInput.value = revisionSettings.intervals.join(',');
        settingsModal.classList.remove('hidden');
    }

    function saveSettings() {
        const intervals = intervalInput.value
            .split(',')
            .map(num => parseInt(num.trim()))
            .filter(num => !isNaN(num));

        revisionSettings = { intervals };

        chrome.storage.sync.set({ revisionSettings }, () => {
            closeSettings();
            loadProblems(); // Refresh problems with new settings
        });
    }

    function handleMarkAsDone(e) {
        if (e.target.classList.contains('mark-reviewed')) {
            const problemUrl = e.target.dataset.id;
            markProblemAsReviewed(problemUrl);
        }
    }

    function markProblemAsReviewed(url) {
        chrome.storage.sync.get(['dsaProblems'], (result) => {
            const problems = result.dsaProblems || [];
            const updatedProblems = problems.map(problem => {
                if (problem.url === url) {
                    const today = new Date().toISOString().split('T')[0];
                    return {
                        ...problem,
                        revisionDates: problem.revisionDates.filter(d => d !== today),
                        lastRevised: today
                    };
                }
                return problem;
            });

            chrome.storage.sync.set({ dsaProblems: updatedProblems }, () => {
                renderRevisions(updatedProblems);
            });
        });
    }

    function calculateRevisionDates() {
        const today = new Date();
        return revisionSettings.intervals.map(days => {
            const date = new Date(today);
            date.setDate(date.getDate() + days);
            return date.toISOString().split('T')[0];
        });
    }

    function renderProblems(problems) {
        renderRevisions(problems);
    }

    function getNextReviewDate(problem) {
        if (!problem.revisionDates || problem.revisionDates.length === 0) return 'Not scheduled';
        const today = new Date().toISOString().split('T')[0];
        const nextDate = problem.revisionDates.find(date => date >= today) || problem.revisionDates[0];
        return formatDate(nextDate);
    }

    function renderRevisions(problems) {
        console.log("^%this is allrederRevison ", problems)
        renderTodaysRevisions(problems);
        renderUpcomingRevisions(problems);
    }

    function renderTodaysRevisions(problems) {
        const today = new Date().toISOString().split('T')[0];
        const todaysProblems = problems.filter(problem =>
            problem.revisionDates && problem.revisionDates.includes(today)
        );

        todaysRevisions.innerHTML = '';

        if (todaysProblems.length === 0) {
            todaysRevisions.innerHTML = '<p class="text-sm text-gray-500">No problems to review today.</p>';
            return;
        }

        todaysProblems.forEach(problem => {
            const div = document.createElement('div');
            div.className = 'revision-item';
            div.innerHTML = `
                <h3 class="text-md font-semibold">${problem.title}</h3>
                <a href="${problem.url}" target="_blank" class="text-sm text-blue-600 hover:underline">View Problem</a>
                <button class="mark-reviewed mt-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded" data-id="${problem.url}">
                    ✓ Mark as Reviewed
                </button>
            `;
            todaysRevisions.appendChild(div);
        });
    }


    function renderUpcomingRevisions(problems) {
        const today = new Date();
        const upcoming = [];
        problems.forEach(problem => {
            if (problem.revisionDates) {
                problem.revisionDates.forEach(date => {
                    const daysDiff = Math.ceil((new Date(date) - today) / (1000 * 60 * 60 * 24));
                    if (daysDiff > 0) {
                        upcoming.push({
                            date,
                            daysDiff,
                            problem
                        });
                    }
                });
            }
        });
        upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

        const upcomingRevisions = document.getElementById('upcomingRevisions');
        const showMoreBtn = document.getElementById('showMoreBtn');
        const additionalRevisions = document.getElementById('additionalRevisions');

        // Clear existing content
        upcomingRevisions.innerHTML = '';
        additionalRevisions.innerHTML = '';
        showMoreBtn.classList.add('hidden');

        if (upcoming.length === 0) {
            upcomingRevisions.innerHTML = '<p class="text-sm text-gray-500">No upcoming revisions scheduled.</p>';
            return;
        }

        // Function to create problem item element
        const createProblemItem = (item) => {
            const div = document.createElement('div');
            div.className = 'upcoming-item mb-2 relative hover:bg-gray-50 rounded p-2';
            div.innerHTML = `
            <button class="delete-upcoming absolute top-1 right-1 text-gray-400 hover:text-red-500 text-lg font-bold" 
                    data-url="${item.problem.url}" data-date="${item.date}">
                &times;
            </button>
            <div class="text-xs text-gray-500 ">${formatDate(item.date)} (in ${item.daysDiff} days)</div>
            <a href="${item.problem.url}" target="_blank" class="block pr-4">
                <div class="text-sm font-medium hover:underline">${item.problem.title}</div>
            </a>
        `;
            return div;
        };

        // Show first 3 items by default
        const defaultItems = upcoming.slice(0, 3);
        defaultItems.forEach(item => {
            upcomingRevisions.appendChild(createProblemItem(item));
        });

        // If there are more items, show "Show More" button
        if (upcoming.length > 3) {
            showMoreBtn.classList.remove('hidden');
            showMoreBtn.textContent = `Show ${upcoming.length - 3} More ▼`;

            // Render only additional items (not the first 3)
            const additionalItems = upcoming.slice(3);
            additionalItems.forEach(item => {
                additionalRevisions.appendChild(createProblemItem(item));
            });

            // Toggle karne pe
            showMoreBtn.addEventListener('click', () => {
                if (additionalRevisions.classList.contains('hidden')) {
                    additionalRevisions.classList.remove('hidden');
                    showMoreBtn.textContent = 'Show Less ▲';
                } else {
                    additionalRevisions.classList.add('hidden');
                    showMoreBtn.textContent = `Show ${upcoming.length - 3} More ▼`;
                }
            });
        }

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-upcoming').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = button.dataset.url;
                const date = button.dataset.date;
                removeFromSchedule(url, date);
            });
        });
    }

    function removeFromSchedule(url, date) {
        chrome.storage.sync.get(['dsaProblems'], (result) => {
            const problems = result.dsaProblems || [];

            const updatedProblems = problems
                .map(problem => {
                    if (problem.url === url) {
                        const filteredDates = problem.revisionDates.filter(d => d !== date);
                        // Only return the updated problem if revisionDates is not empty
                        if (filteredDates.length > 0) {
                            return { ...problem, revisionDates: filteredDates };
                        } else {
                            return null; // Mark for removal
                        }
                    }
                    return problem;
                })
                .filter(problem => problem !== null); // Remove problems with empty revisionDates

            chrome.storage.sync.set({ dsaProblems: updatedProblems }, () => {
                loadProblems(); // Refresh the display
            });
        });
    }



    function formatDate(isoDate) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return new Date(isoDate).toLocaleDateString(undefined, options);
    }

    function saveProblems(problems) {
        chrome.storage.sync.set({ dsaProblems: problems }, () => {
            loadProblems();
        });
    }

    function addProblem() {
        const title = problemTitleInput.value.trim();
        const url = problemUrlInput.value.trim();
        const notes = problemNotesInput.value.trim();

        if (title && url) {
            chrome.storage.sync.get(['dsaProblems'], (data) => {
                const problems = data.dsaProblems || [];
                console.log("This is problemList on this problem is already tracked ", problems)
                const isDuplicate = problems.some(p => p.url === url);

                if (isDuplicate) {
                    alert('This problem is already tracked!');
                    return;
                }

                const newProblem = {
                    title,
                    url,
                    notes,
                    addedDate: new Date().toISOString().split('T')[0],
                    revisionDates: calculateRevisionDates()
                };

                problems.push(newProblem);
                saveProblems(problems);

                problemTitleInput.value = '';
                problemUrlInput.value = '';
                problemNotesInput.value = '';
            });
        } else {
            alert('Problem Title and URL are required!');
        }
    }

    function deleteProblem(index) {
        chrome.storage.sync.get(['dsaProblems'], (data) => {
            const problems = data.dsaProblems || [];
            if (index > -1 && index < problems.length) {
                problems.splice(index, 1);
                saveProblems(problems);
            }
        });
    }

    // Initialize with current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
            const url = currentTab.url;
            const title = currentTab.title;

            const isSupportedPlatform = url.includes('leetcode.com/problems/') || url.includes('geeksforgeeks.org/problems/');

            if (isSupportedPlatform) {
                problemUrlInput.value = url;
                let extractedTitle = title;

                if (url.includes('leetcode.com/problems/')) {
                    extractedTitle = title.replace(/ - LeetCode$/, '').trim();
                } else if (url.includes('geeksforgeeks.org/problems/')) {
                    extractedTitle = title.split('|')[0].split('- GeeksforGeeks/problems/')[0].trim();
                }

                problemTitleInput.value = extractedTitle;
                platformMessage.classList.add('hidden');
            } else {
                addProblemBtn.disabled = true;
                problemTitleInput.disabled = true;
                problemUrlInput.disabled = true;
                problemNotesInput.disabled = true;
                // addProblemBtn.textContent = 'Not a DSA Problem Page';
                addProblemBtn.classList.add('bg-gray-400');
                addProblemBtn.classList.remove('add-button');
                platformMessage.classList.remove('hidden');
            }
        }
    });

    function clearAllUpcomingProblems() {
        if (confirm('Are you sure you want to remove ALL upcoming problems? This cannot be undone.')) {
            chrome.storage.sync.get(['dsaProblems'], (result) => {
                const problems = result.dsaProblems || [];

                // Filter out problems that have no future revisions
                const today = new Date().toISOString().split('T')[0];
                const updatedProblems = problems.filter(problem => {
                    if (!problem.revisionDates) return true;

                    // Keep only problems with no future revisions
                    const hasFutureRevisions = problem.revisionDates.some(date => date >= today);
                    return !hasFutureRevisions;
                });

                chrome.storage.sync.set({ dsaProblems: updatedProblems }, () => {
                    loadProblems(); // Refresh the display
                    console.log("Refreshed ");
                });
            });
        }
    }

    // Open profile page
    document.getElementById('profileBtn').addEventListener('click', function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('profile.html') });
    });
});