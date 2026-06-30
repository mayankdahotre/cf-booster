import {
  parseProblemFromDOM,
  detectPageType,
  isAcceptedSubmission,
  parseSubmissionProblem,
} from '@/services/codeforces';
import { sendCfMessage } from '@/messaging/types';
import type { Problem } from '@/types';

const SIDEBAR_ID = 'cf-booster-sidebar';
const TOGGLE_ID = 'cf-booster-toggle';

interface SidebarState {
  contestId: number;
  problemIndex: string;
  name: string;
  rating?: number;
  tags: string[];
  status: string;
}

let sidebarVisible = true;
let currentMeta: SidebarState | null = null;
let timerInterval: number | null = null;
let secondsElapsed = 0;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  const el = document.getElementById('cfb-timer');
  if (el) el.textContent = formatTime(secondsElapsed);
}

function createSidebar() {
  if (document.getElementById(SIDEBAR_ID)) return;

  const sidebar = document.createElement('div');
  sidebar.id = SIDEBAR_ID;
  sidebar.innerHTML = getSidebarHTML();
  document.body.appendChild(sidebar);

  const toggle = document.createElement('button');
  toggle.id = TOGGLE_ID;
  toggle.innerHTML = '◀';
  toggle.title = 'Toggle CF Booster';
  toggle.addEventListener('click', toggleSidebar);
  document.body.appendChild(toggle);

  bindSidebarEvents();
}

function getSidebarHTML(): string {
  return `
    <div style="height:100%;background:#fff;border-left:1px solid #b9b9b9;display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:12px 16px;background:#2175a4;color:#fff;border-bottom:1px solid #1a5f8a;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-weight:bold;font-size:14px;">CF Booster</div>
          <button id="cfb-minimize" title="Minimize sidebar" style="background:rgba(255,255,255,0.2);border:none;border-radius:3px;color:#fff;cursor:pointer;font-size:12px;font-weight:bold;line-height:1;padding:4px 8px;">−</button>
        </div>
        <h3 id="cfb-problem-name" style="font-size:14px;font-weight:bold;color:#fff;margin:0 0 6px;">Loading...</h3>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span id="cfb-rating" style="font-size:12px;font-weight:bold;font-family:Consolas,monospace;"></span>
          <span id="cfb-status" style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(255,255,255,0.2);color:#fff;">Not Solved</span>
        </div>
        <div id="cfb-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;"></div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:12px;background:#fff;">
        <div style="margin-bottom:12px; padding:8px 12px; border:1px solid #ddd; border-radius:4px; display:flex; align-items:center; justify-content:space-between; background:#fafafa;">
          <div style="font-family:Consolas,monospace; font-size:18px; font-weight:bold; color:#333;" id="cfb-timer">00:00</div>
          <div style="display:flex; gap:4px;">
            <button id="cfb-timer-start" style="padding:2px 8px; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:3px;">▶</button>
            <button id="cfb-timer-pause" style="padding:2px 8px; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:3px;">⏸</button>
            <button id="cfb-timer-reset" style="padding:2px 8px; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:3px;">↺</button>
          </div>
        </div>
        <div class="cf-booster-field">
          <label>Observation</label>
          <textarea id="cfb-observation" placeholder="Key insight for this problem..."></textarea>
        </div>
        <div class="cf-booster-field">
          <label>Recognition Trigger</label>
          <textarea id="cfb-trigger" placeholder="What signals this approach?"></textarea>
        </div>
        <div class="cf-booster-field">
          <label>Technique</label>
          <textarea id="cfb-technique" placeholder="Algorithm/technique used..."></textarea>
        </div>
        <div class="cf-booster-field">
          <label>Mistake</label>
          <textarea id="cfb-mistake" placeholder="Mistakes made while solving..."></textarea>
        </div>
        <div class="cf-booster-field">
          <label>Personal Notes</label>
          <textarea id="cfb-notes" placeholder="Your notes..."></textarea>
        </div>
      </div>
      <div style="padding:12px;border-top:1px solid #b9b9b9;background:#f5f5f5;display:flex;flex-wrap:wrap;gap:6px;">
        <button class="cf-booster-btn cf-booster-btn-primary" id="cfb-save">Save</button>
        <button class="cf-booster-btn cf-booster-btn-secondary" id="cfb-solved">Solved</button>
        <button class="cf-booster-btn cf-booster-btn-secondary" id="cfb-mastered">Mastered</button>
        <button class="cf-booster-btn cf-booster-btn-secondary" id="cfb-review">Add to Review</button>
      </div>
    </div>
  `;
}

function bindSidebarEvents() {
  document.getElementById('cfb-save')?.addEventListener('click', () => void persistProblem());
  document.getElementById('cfb-solved')?.addEventListener('click', () => void persistProblem('solved'));
  document.getElementById('cfb-mastered')?.addEventListener('click', () => void persistProblem('mastered'));
  document.getElementById('cfb-review')?.addEventListener('click', () => void handleAddReview());
  document.getElementById('cfb-minimize')?.addEventListener('click', toggleSidebar);

  document.getElementById('cfb-timer-start')?.addEventListener('click', () => {
    if (timerInterval) return;
    timerInterval = window.setInterval(() => {
      secondsElapsed++;
      updateTimerUI();
    }, 1000);
  });
  
  document.getElementById('cfb-timer-pause')?.addEventListener('click', () => {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  });
  
  document.getElementById('cfb-timer-reset')?.addEventListener('click', () => {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
    secondsElapsed = 0;
    updateTimerUI();
  });
}

function readFormData() {
  return {
    observation: (document.getElementById('cfb-observation') as HTMLTextAreaElement)?.value ?? '',
    recognitionTrigger: (document.getElementById('cfb-trigger') as HTMLTextAreaElement)?.value ?? '',
    technique: (document.getElementById('cfb-technique') as HTMLTextAreaElement)?.value ?? '',
    mistake: (document.getElementById('cfb-mistake') as HTMLTextAreaElement)?.value ?? '',
    personalNotes: (document.getElementById('cfb-notes') as HTMLTextAreaElement)?.value ?? '',
  };
}

async function populateSidebar(meta: NonNullable<ReturnType<typeof parseProblemFromDOM>>) {
  currentMeta = {
    contestId: meta.contestId,
    problemIndex: meta.problemIndex,
    name: meta.name,
    rating: meta.rating,
    tags: meta.tags,
    status: 'not_solved',
  };

  const res = await sendCfMessage<Problem | null>({
    type: 'CF_GET_PROBLEM',
    contestId: meta.contestId,
    problemIndex: meta.problemIndex,
  });

  const saved = res.data;
  if (saved) {
    currentMeta.status = saved.status;
    (document.getElementById('cfb-observation') as HTMLTextAreaElement).value =
      saved.observation ?? '';
    (document.getElementById('cfb-trigger') as HTMLTextAreaElement).value =
      saved.recognitionTrigger ?? '';
    (document.getElementById('cfb-technique') as HTMLTextAreaElement).value = saved.technique ?? '';
    (document.getElementById('cfb-mistake') as HTMLTextAreaElement).value = saved.mistake ?? '';
    (document.getElementById('cfb-notes') as HTMLTextAreaElement).value = saved.personalNotes ?? '';
    
    if (saved.solveTimeMinutes) {
      secondsElapsed = saved.solveTimeMinutes * 60;
      updateTimerUI();
    }
  }

  const nameEl = document.getElementById('cfb-problem-name');
  const ratingEl = document.getElementById('cfb-rating');
  const statusEl = document.getElementById('cfb-status');
  const tagsEl = document.getElementById('cfb-tags');

  if (nameEl) nameEl.textContent = meta.name;
  if (ratingEl) {
    ratingEl.textContent = meta.rating ? String(meta.rating) : '?';
    ratingEl.style.color = getCfRatingColor(meta.rating);
  }
  if (statusEl) statusEl.textContent = currentMeta.status.replace('_', ' ');
  if (tagsEl) {
    tagsEl.innerHTML = meta.tags.map((t) => `<span class="cf-booster-tag">${t}</span>`).join('');
  }
}

async function persistProblem(status?: string) {
  if (!currentMeta) return;

  const form = readFormData();
  const res = await sendCfMessage({
    type: 'CF_SAVE_PROBLEM',
    meta: {
      contestId: currentMeta.contestId,
      problemIndex: currentMeta.problemIndex,
      name: currentMeta.name,
      rating: currentMeta.rating,
      tags: currentMeta.tags,
      url: window.location.href,
    },
    data: {
      ...form,
      status: status ?? currentMeta.status,
      solveTimeMinutes: Math.round(secondsElapsed / 60) > 0 ? Math.round(secondsElapsed / 60) : undefined,
    },
  });

  if (!res.success) {
    showToast(res.error ?? 'Failed to save', true);
    return;
  }

  if (status) {
    currentMeta.status = status;
    const statusEl = document.getElementById('cfb-status');
    if (statusEl) statusEl.textContent = status.replace('_', ' ');
  }

  showToast(status ? `Marked as ${status.replace('_', ' ')}!` : 'Saved to dashboard!');
}

async function handleAddReview() {
  if (!currentMeta) return;
  await persistProblem();

  const res = await sendCfMessage({
    type: 'CF_ADD_REVIEW',
    contestId: currentMeta.contestId,
    problemIndex: currentMeta.problemIndex,
    stage: 'tomorrow',
  });

  if (!res.success) {
    showToast(res.error ?? 'Failed to add review', true);
    return;
  }
  showToast('Added to review queue!');
}

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  const sidebar = document.getElementById(SIDEBAR_ID);
  const toggle = document.getElementById(TOGGLE_ID);
  if (sidebar) sidebar.classList.toggle('collapsed', !sidebarVisible);
  if (toggle) {
    toggle.classList.toggle('collapsed', !sidebarVisible);
    toggle.innerHTML = sidebarVisible ? '◀' : '▶';
  }
}

function getCfRatingColor(rating?: number): string {
  if (!rating) return '#fff';
  if (rating < 1200) return '#ccc';
  if (rating < 1400) return '#7fff7f';
  if (rating < 1600) return '#7fffd4';
  if (rating < 1900) return '#99ccff';
  if (rating < 2100) return '#e8b4ff';
  if (rating < 2400) return '#ffcc80';
  return '#ff9999';
}

function showToast(message: string, isError = false) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `position:fixed;bottom:20px;right:360px;z-index:100002;padding:6px 14px;color:white;border-radius:3px;font-size:13px;font-family:Verdana,Arial,sans-serif;border:1px solid ${isError ? '#a00' : '#1a5f8a'};background:${isError ? '#c00' : '#2175a4'};`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function showAcceptedPopup(meta: NonNullable<ReturnType<typeof parseSubmissionProblem>>) {
  if (document.getElementById('cf-booster-popup-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cf-booster-popup-overlay';
  overlay.innerHTML = `
    <div id="cf-booster-popup">
      <div class="cfb-popup-header"><h2>Congratulations! Accepted</h2></div>
      <div class="cfb-popup-body">
        <p style="margin:0 0 16px;">You solved <strong>${meta.name}</strong></p>
        <div class="cf-booster-checkbox-group">
          <label><input type="checkbox" id="cfb-solo" checked> Solved Solo?</label>
          <label><input type="checkbox" id="cfb-hint"> Hint Used?</label>
          <label><input type="checkbox" id="cfb-editorial"> Editorial Used?</label>
        </div>
        <div class="cf-booster-field">
          <label>Difficulty (1-5)</label>
          <select id="cfb-difficulty">
            <option value="1">1 - Easy</option>
            <option value="2">2 - Moderate</option>
            <option value="3" selected>3 - Medium</option>
            <option value="4">4 - Hard</option>
            <option value="5">5 - Very Hard</option>
          </select>
        </div>
        <div class="cf-booster-field"><label>Observation</label><textarea id="cfb-popup-observation"></textarea></div>
        <div class="cf-booster-field"><label>Technique</label><textarea id="cfb-popup-technique"></textarea></div>
        <div class="cf-booster-field"><label>Recognition Trigger</label><textarea id="cfb-popup-trigger"></textarea></div>
        <div class="cf-booster-field"><label>Missing Observation</label><textarea id="cfb-popup-missing"></textarea></div>
        <div class="cf-booster-field"><label>Personal Notes</label><textarea id="cfb-popup-notes"></textarea></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid #b9b9b9;">
          <button class="cf-booster-btn cf-booster-btn-secondary" id="cfb-popup-skip">Skip</button>
          <button class="cf-booster-btn cf-booster-btn-primary" id="cfb-popup-save">Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('cfb-popup-skip')?.addEventListener('click', () => overlay.remove());

  document.getElementById('cfb-popup-save')?.addEventListener('click', async () => {
    const res = await sendCfMessage({
      type: 'CF_SAVE_PROBLEM',
      meta: {
        contestId: meta.contestId,
        problemIndex: meta.problemIndex,
        name: meta.name,
        rating: meta.rating,
        tags: meta.tags,
        url: meta.url || window.location.href,
      },
      data: {
        status: 'solved',
        solvedSolo: (document.getElementById('cfb-solo') as HTMLInputElement).checked,
        hintUsed: (document.getElementById('cfb-hint') as HTMLInputElement).checked,
        editorialUsed: (document.getElementById('cfb-editorial') as HTMLInputElement).checked,
        difficulty: parseInt((document.getElementById('cfb-difficulty') as HTMLSelectElement).value, 10),
        observation: (document.getElementById('cfb-popup-observation') as HTMLTextAreaElement).value,
        recognitionTrigger: (document.getElementById('cfb-popup-trigger') as HTMLTextAreaElement).value,
        technique: (document.getElementById('cfb-popup-technique') as HTMLTextAreaElement).value,
        mistake: (document.getElementById('cfb-popup-missing') as HTMLTextAreaElement).value,
        personalNotes: (document.getElementById('cfb-popup-notes') as HTMLTextAreaElement).value,
      },
    });

    overlay.remove();
    if (res.success) showToast('Saved to dashboard!');
    else showToast(res.error ?? 'Save failed', true);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function init() {
  const pageType = detectPageType(window.location.href);

  if (pageType === 'problemset' || pageType === 'contest_problem') {
    createSidebar();
    const meta = parseProblemFromDOM();
    if (meta) void populateSidebar(meta);
  }

  if (pageType === 'submission' && isAcceptedSubmission()) {
    const meta = parseSubmissionProblem();
    if (meta) {
      setTimeout(() => showAcceptedPopup(meta), 500);
      chrome.runtime.sendMessage({
        type: 'SUBMISSION_ACCEPTED',
        problemName: meta.name,
      });
    }
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_SIDEBAR') toggleSidebar();
  if (message.type === 'ADD_TO_REVIEW') void handleAddReview();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
