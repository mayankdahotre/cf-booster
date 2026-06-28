import { handleCfMessage, updateBadgeCount } from './handlers';
import { migrateChromeStorageProblems } from '@/services/migrate';
import type { CfMessage } from '@/messaging/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'cf-booster-open',
    title: 'Open CF Booster Dashboard',
    contexts: ['action'],
  });

  chrome.contextMenus.create({
    id: 'cf-booster-add-review',
    title: 'Add Current Problem to Review',
    contexts: ['page'],
    documentUrlPatterns: ['https://codeforces.com/*'],
  });

  chrome.alarms.create('daily-review-check', { periodInMinutes: 60 });
  void updateBadgeCount();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'cf-booster-open') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
  if (info.menuItemId === 'cf-booster-add-review' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'ADD_TO_REVIEW' });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
  if (command === 'open-search') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html#/') });
  }
  if (command === 'toggle-sidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_SIDEBAR' });
      }
    });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-review-check') {
    await updateBadgeCount();
  }
});

chrome.runtime.onMessage.addListener((message: CfMessage, _sender, sendResponse) => {
  if (message.type === 'SUBMISSION_ACCEPTED') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'public/icons/icon128.png',
      title: 'CF Booster',
      message: `Accepted! ${message.problemName}`,
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'UPDATE_BADGE') {
    void updateBadgeCount();
    sendResponse({ success: true });
    return true;
  }

  if (message.type?.startsWith('CF_')) {
    handleCfMessage(message)
      .then(sendResponse)
      .catch((err) =>
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Handler failed',
        }),
      );
    return true;
  }

  return false;
});

// Migrate any legacy sidebar saves on service worker start
void migrateChromeStorageProblems().then(() => updateBadgeCount());
