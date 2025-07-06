// Initialize storage with error handling
chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Clear existing context menu to prevent duplicates
        await chrome.contextMenus.removeAll();
        
        // Create new context menu
        chrome.contextMenus.create({
            id: 'addDsaProblem',
            title: 'Add to DSA Tracker',
            contexts: ['page'],
            documentUrlPatterns: [
                '*://leetcode.com/*',
                '*://www.geeksforgeeks.org/*'
            ]
        });

        // Initialize storage
        const result = await chrome.storage.sync.get(['dsaProblems', 'revisionSettings']);
        if (!result.dsaProblems) {
            await chrome.storage.sync.set({ 
                dsaProblems: [],
                revisionSettings: {
                    intervals: [1, 3, 5],
                    dailyLimit: 5
                }
            });
        }

        // Setup daily alarm
        chrome.alarms.create('dailyReminder', { periodInMinutes: 1440 });
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'addDsaProblem' && tab?.id) {
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content.js']
        }).catch(error => {
            console.error('Script injection failed:', error);
        });
    }
});

// Alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'dailyReminder') {
        try {
            const result = await chrome.storage.sync.get(['dsaProblems', 'revisionSettings']);
            const problems = result.dsaProblems || [];
            const settings = result.revisionSettings || { dailyLimit: 5 };
            
            const today = new Date().toISOString().split('T')[0];
            const todaysProblems = problems.filter(p => 
                p.revisionDates?.includes(today)
            ).slice(0, settings.dailyLimit);
            
            if (todaysProblems.length > 0) {
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'DSA Problem Tracker',
                    message: `You have ${todaysProblems.length} problems to review today!`,
                    buttons: [{ title: 'Review Now' }]
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    }
});

// Notification click handler
chrome.notifications.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});