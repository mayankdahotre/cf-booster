import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';
export default defineManifest({
    manifest_version: 3,
    name: 'CF Booster',
    description: 'AI-powered Competitive Programming Companion for Codeforces. Track problems, patterns, mistakes, reviews, and contests.',
    version: packageJson.version,
    icons: {
        '16': 'public/icons/icon16.png',
        '32': 'public/icons/icon32.png',
        '48': 'public/icons/icon48.png',
        '128': 'public/icons/icon128.png',
    },
    action: {
        default_popup: 'src/popup/index.html',
        default_title: 'CF Booster',
        default_icon: {
            '16': 'public/icons/icon16.png',
            '32': 'public/icons/icon32.png',
        },
    },
    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },
    permissions: ['storage', 'notifications', 'contextMenus', 'alarms', 'tabs', 'activeTab'],
    host_permissions: ['https://codeforces.com/*', 'https://*.codeforces.com/*'],
    content_scripts: [
        {
            matches: ['https://codeforces.com/*', 'https://*.codeforces.com/*'],
            js: ['src/content/index.ts'],
            css: ['src/content/sidebar.css'],
            run_at: 'document_idle',
        },
    ],
    commands: {
        'open-dashboard': {
            suggested_key: { default: 'Alt+Shift+C' },
            description: 'Open CF Booster Dashboard',
        },
        'open-search': {
            suggested_key: { default: 'Alt+Shift+S' },
            description: 'Open Global Search',
        },
        'toggle-sidebar': {
            suggested_key: { default: 'Alt+Shift+B' },
            description: 'Toggle Problem Sidebar',
        },
    },
    web_accessible_resources: [
        {
            resources: ['public/icons/*'],
            matches: ['https://codeforces.com/*', 'https://*.codeforces.com/*'],
        },
    ],
});
