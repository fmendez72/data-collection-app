// app.js
// Main Application Logic - Updated for new architecture

// ============================================================
// IMPORTS
// ============================================================

import { auth, db } from './firebase-config.js';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let userProfile = null;
let currentJob = null;
let currentTemplate = null;
let currentResponse = null;
let hotInstance = null;
let allAssignedJobs = [];

// ============================================================
// DOM ELEMENTS
// ============================================================

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const jobsList = document.getElementById('jobs-list');
const jobsLoading = document.getElementById('jobs-loading');
const noJobs = document.getElementById('no-jobs');
const noJobSelected = document.getElementById('no-job-selected');
const jobWorkspace = document.getElementById('job-workspace');
const currentJobTitle = document.getElementById('current-job-title');
const currentJobDescription = document.getElementById('current-job-description');
const jobStatusBadge = document.getElementById('job-status-badge');
const handsontableContainer = document.getElementById('handsontable-container');
const saveDraftBtn = document.getElementById('save-draft-btn');
const submitFinalBtn = document.getElementById('submit-final-btn');
const saveMessage = document.getElementById('save-message');
// const generateMockBtn = document.getElementById('generate-mock-btn'); // Removed - button no longer in UI

// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // Load user profile from Firestore
    await loadUserProfile();
    showDashboard();
  } else {
    currentUser = null;
    userProfile = null;
    showLogin();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.classList.add('d-none');
  } catch (error) {
    loginError.textContent = `Login failed: ${error.message}`;
    loginError.classList.remove('d-none');
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Logout failed. Please try again.');
  }
});

// ============================================================
// USER PROFILE
// ============================================================

async function loadUserProfile() {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.email));
    if (userDoc.exists()) {
      userProfile = userDoc.data();
    } else {
      console.warn('User profile not found in Firestore');
      userProfile = { email: currentUser.email, assigned_jobs: [], role: 'coder' };
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    userProfile = { email: currentUser.email, assigned_jobs: [], role: 'coder' };
  }
}

// ============================================================
// UI NAVIGATION
// ============================================================

function showLogin() {
  loginScreen.classList.remove('d-none');
  dashboardScreen.classList.add('d-none');
}

function showDashboard() {
  loginScreen.classList.add('d-none');
  dashboardScreen.classList.remove('d-none');
  userEmailSpan.textContent = currentUser.email;
  loadAssignedJobs();
}

// ============================================================
// JOBS MANAGEMENT
// ============================================================

async function loadAssignedJobs() {
  try {
    jobsLoading.classList.remove('d-none');
    jobsList.classList.add('d-none');
    noJobs.classList.add('d-none');

    allAssignedJobs = [];

    if (!userProfile || !userProfile.assigned_jobs || userProfile.assigned_jobs.length === 0) {
      jobsLoading.classList.add('d-none');
      noJobs.classList.remove('d-none');
      return;
    }

    // Load each assigned job
    for (const jobId of userProfile.assigned_jobs) {
      const templateDoc = await getDoc(doc(db, 'templates', jobId));
      if (templateDoc.exists()) {
        const template = templateDoc.data();

        // Check if response exists
        const responseId = `${currentUser.email}_${jobId}`;
        const responseDoc = await getDoc(doc(db, 'responses', responseId));

        let status = 'new';
        let responseData = null;

        if (responseDoc.exists()) {
          const response = responseDoc.data();
          status = response.status;
          responseData = response;
        }

        allAssignedJobs.push({
          job_id: jobId,
          title: template.title,
          description: template.description,
          status: status,
          template: template,
          response: responseData
        });
      }
    }

    jobsLoading.classList.add('d-none');

    if (allAssignedJobs.length === 0) {
      noJobs.classList.remove('d-none');
    } else {
      renderJobsList();
      jobsList.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error loading assigned jobs:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      userProfile: userProfile,
      currentUser: currentUser?.email
    });
    jobsLoading.classList.add('d-none');
    alert(`Failed to load jobs: ${error.message}\n\nCheck browser console for details.`);
  }
}

function renderJobsList() {
  jobsList.innerHTML = '';

  allAssignedJobs.forEach((job) => {
    const listItem = document.createElement('a');
    listItem.href = '#';
    listItem.className = 'list-group-item list-group-item-action';
    listItem.dataset.jobId = job.job_id;
    listItem.innerHTML = `
      <div class="d-flex w-100 justify-content-between">
        <h6 class="mb-1">${job.title}</h6>
        <small class="badge ${getStatusBadgeClass(job.status)}">${job.status}</small>
      </div>
      <small class="text-muted">${job.description || ''}</small>
    `;

    listItem.addEventListener('click', (e) => {
      e.preventDefault();
      selectJob(job);
    });

    jobsList.appendChild(listItem);
  });
}

function selectJob(job) {
  currentJob = job;
  currentTemplate = job.template;
  currentResponse = job.response;

  // Update active state in jobs list
  const listItems = jobsList.querySelectorAll('.list-group-item');
  listItems.forEach(item => {
    if (item.dataset.jobId === job.job_id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Show job workspace
  noJobSelected.classList.add('d-none');
  jobWorkspace.classList.remove('d-none');

  // Update job header
  currentJobTitle.textContent = job.title;
  currentJobDescription.textContent = job.description || '';
  updateStatusBadge(job.status);

  // Load data into Handsontable
  loadJobData();
}

function updateStatusBadge(status) {
  jobStatusBadge.textContent = status.toUpperCase();
  jobStatusBadge.className = 'badge';

  switch(status) {
    case 'new':
      jobStatusBadge.classList.add('badge-new');
      break;
    case 'draft':
      jobStatusBadge.classList.add('badge-draft');
      break;
    case 'submitted':
      jobStatusBadge.classList.add('badge-submitted');
      break;
  }
}

function getStatusBadgeClass(status) {
  switch(status) {
    case 'new': return 'bg-info';
    case 'draft': return 'bg-warning text-dark';
    case 'submitted': return 'bg-success';
    default: return 'bg-secondary';
  }
}

// ============================================================
// HANDSONTABLE INTEGRATION
// ============================================================

function loadJobData() {
  // Prepare data for Handsontable
  let dataToLoad = [];

  if (currentResponse && currentResponse.data) {
    // Load saved response
    dataToLoad = currentResponse.data.map(q => [
      q.id,
      q.item,
      q.answer,
      q.source,
      q.definition,
      q.comment
    ]);
  } else {
    // Load template (new job)
    dataToLoad = currentTemplate.questions.map(q => [
      q.id,
      q.item,
      '', // answer
      q.source,
      q.definition,
      q.comment
    ]);
  }

  const isReadOnly = currentJob.status === 'submitted';

  // Destroy existing instance
  if (hotInstance) {
    hotInstance.destroy();
  }

  // Build column definitions (base configuration)
  const columns = [
    {
      data: 0, // id
      type: 'text',
      readOnly: true,
      className: 'htDimmed'
    },
    {
      data: 1, // item
      type: 'text',
      readOnly: true,
      className: 'htDimmed word-wrap',
      wordWrap: true,
      width: 250
    },
    {
      data: 2, // answer
      type: 'text',
      readOnly: isReadOnly,
      width: 150
    },
    {
      data: 3, // source
      type: 'text',
      readOnly: isReadOnly,
      width: 200
    },
    // Definition column hidden - shown as tooltip
    {
      data: 4, // definition
      type: 'text',
      readOnly: true,
      width: 1,
      className: 'htDimmed d-none'
    },
    {
      data: 5, // comment
      type: 'text',
      readOnly: isReadOnly,
      width: 200
    }
  ];

  hotInstance = new Handsontable(handsontableContainer, {
    data: dataToLoad,
    colHeaders: ['ID', 'Item', 'Answer', 'Source', 'Definition', 'Comment'],
    columns: columns,
    rowHeaders: true,
    width: '100%',
    height: 500,
    licenseKey: 'non-commercial-and-evaluation',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
    manualColumnResize: true,
    manualRowResize: true,
    contextMenu: true,
    // Per-cell configuration for dropdowns (row-specific)
    cells: function(row, col) {
      const cellProperties = {};

      // Configure Answer column (col 2) based on question type
      if (col === 2 && currentTemplate.questions[row]) {
        const question = currentTemplate.questions[row];
        if (question.answer_type === 'dropdown' && question.answer_options.length > 0) {
          cellProperties.type = 'dropdown';
          cellProperties.source = question.answer_options;
          cellProperties.strict = false; // Allow typing to filter options
        }
      }

      return cellProperties;
    },
    afterOnCellMouseOver: function(_event, coords, TD) {
      // Show definition as tooltip on Item column hover
      if (coords.row >= 0 && coords.col === 1) {
        const definition = this.getDataAtCell(coords.row, 4); // definition column
        if (definition) {
          TD.title = definition;
        }
      }
    }
  });

  // Update button states
  if (isReadOnly) {
    saveDraftBtn.disabled = true;
    submitFinalBtn.disabled = true;
    showSaveMessage('This job has been submitted and is now read-only.', 'info');
  } else {
    saveDraftBtn.disabled = false;
    submitFinalBtn.disabled = false;
    hideSaveMessage();
  }
}

// ============================================================
// SAVE & SUBMIT FUNCTIONALITY
// ============================================================

saveDraftBtn.addEventListener('click', async () => {
  try {
    // Force Handsontable to commit any active cell edits before saving
    const activeEditor = hotInstance.getActiveEditor();
    if (activeEditor) {
      activeEditor.finishEditing();
    }

    saveDraftBtn.disabled = true;
    saveDraftBtn.textContent = 'Saving...';

    const currentData = hotInstance.getData();
    const jsonData = convertToJsonArray(currentData);

    const responseId = `${currentUser.email}_${currentJob.job_id}`;

    // Update or create response in Firestore
    await setDoc(doc(db, 'responses', responseId), {
      response_id: responseId,
      user_email: currentUser.email,
      job_id: currentJob.job_id,
      status: 'draft',
      data: jsonData,
      created_at: currentResponse ? currentResponse.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: null
    });

    // Update local state
    currentJob.status = 'draft';
    currentResponse = {
      status: 'draft',
      data: jsonData,
      updated_at: new Date().toISOString()
    };

    updateStatusBadge('draft');
    renderJobsList();
    showSaveMessage('Draft saved successfully!', 'success');

    saveDraftBtn.disabled = false;
    saveDraftBtn.textContent = 'Save Draft';
  } catch (error) {
    console.error('Error saving draft:', error);
    showSaveMessage('Failed to save draft. Please try again.', 'danger');
    saveDraftBtn.disabled = false;
    saveDraftBtn.textContent = 'Save Draft';
  }
});

submitFinalBtn.addEventListener('click', async () => {
  // Force Handsontable to commit any active cell edits before proceeding
  const activeEditor = hotInstance.getActiveEditor();
  if (activeEditor) {
    activeEditor.finishEditing();
  }

  const confirmed = confirm(
    'Are you sure you want to submit this job? Once submitted, you will not be able to make any further changes.'
  );

  if (!confirmed) return;

  try {
    submitFinalBtn.disabled = true;
    submitFinalBtn.textContent = 'Submitting...';

    const currentData = hotInstance.getData();
    const jsonData = convertToJsonArray(currentData);

    const responseId = `${currentUser.email}_${currentJob.job_id}`;

    // Update response in Firestore
    await setDoc(doc(db, 'responses', responseId), {
      response_id: responseId,
      user_email: currentUser.email,
      job_id: currentJob.job_id,
      status: 'submitted',
      data: jsonData,
      created_at: currentResponse ? currentResponse.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString()
    });

    // Update local state
    currentJob.status = 'submitted';
    currentResponse = {
      status: 'submitted',
      data: jsonData,
      submitted_at: new Date().toISOString()
    };

    updateStatusBadge('submitted');
    renderJobsList();
    showSaveMessage('Job submitted successfully!', 'success');

    // Make grid read-only
    hotInstance.updateSettings({
      cells: function(_row, col) {
        const cellProperties = {};
        if (col !== 0 && col !== 1 && col !== 4) {
          cellProperties.readOnly = true;
        }
        return cellProperties;
      }
    });

    saveDraftBtn.disabled = true;
    submitFinalBtn.disabled = true;
  } catch (error) {
    console.error('Error submitting job:', error);
    showSaveMessage('Failed to submit job. Please try again.', 'danger');
    submitFinalBtn.disabled = false;
    submitFinalBtn.textContent = 'Submit Final';
  }
});

function convertToJsonArray(dataArray) {
  return dataArray.map((row) => ({
    id: row[0] || '',
    item: row[1] || '',
    answer: row[2] || '',
    source: row[3] || '',
    definition: row[4] || '',
    comment: row[5] || ''
  }));
}

function showSaveMessage(message, type) {
  saveMessage.textContent = message;
  saveMessage.className = `alert alert-${type}`;
  saveMessage.classList.remove('d-none');

  setTimeout(() => {
    hideSaveMessage();
  }, 5000);
}

function hideSaveMessage() {
  saveMessage.classList.add('d-none');
}

// ============================================================
// MOCK DATA GENERATOR (DEPRECATED - Use Admin Panel)
// ============================================================

// Button removed from UI - code kept for reference
// generateMockBtn.addEventListener('click', () => {
//   alert('Mock data generation has been moved to the Admin Panel. Please use admin.html to upload templates and manage users.');
// });

// ============================================================
// INITIALIZATION
// ============================================================

console.log('Data Collection App initialized (v2.0)');
