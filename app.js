// app.js
// Main Application Logic

// ============================================================
// IMPORTS
// ============================================================

// Firebase Configuration
import { auth, db } from './firebase-config.js';

// Firebase Auth methods
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firestore methods
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let currentJob = null;
let hotInstance = null;
let allJobs = [];

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
const generateMockBtn = document.getElementById('generate-mock-btn');

// ============================================================
// AUTHENTICATION
// ============================================================

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    showDashboard();
  } else {
    currentUser = null;
    showLogin();
  }
});

// Login form submission
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

// Logout button
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Logout failed. Please try again.');
  }
});

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
  loadUserJobs();
}

// ============================================================
// JOBS MANAGEMENT
// ============================================================

async function loadUserJobs() {
  try {
    jobsLoading.classList.remove('d-none');
    jobsList.classList.add('d-none');
    noJobs.classList.add('d-none');

    // Query jobs assigned to current user
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('assigned_to', '==', currentUser.email)
    );

    const querySnapshot = await getDocs(jobsQuery);
    allJobs = [];

    querySnapshot.forEach((doc) => {
      allJobs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    jobsLoading.classList.add('d-none');

    if (allJobs.length === 0) {
      noJobs.classList.remove('d-none');
    } else {
      renderJobsList();
      jobsList.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error loading jobs:', error);
    jobsLoading.classList.add('d-none');
    alert('Failed to load jobs. Please refresh the page.');
  }
}

function renderJobsList() {
  jobsList.innerHTML = '';

  allJobs.forEach((job) => {
    const listItem = document.createElement('a');
    listItem.href = '#';
    listItem.className = 'list-group-item list-group-item-action';
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

  // Update active state in jobs list
  const listItems = jobsList.querySelectorAll('.list-group-item');
  listItems.forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');

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
  // Determine which data to load
  let dataToLoad;

  if (currentJob.status === 'new') {
    // Load template data
    dataToLoad = currentJob.template_json;
  } else {
    // Load saved response data (for draft or submitted)
    dataToLoad = currentJob.saved_response_json || currentJob.template_json;
  }

  // Check if job is submitted (make read-only)
  const isReadOnly = currentJob.status === 'submitted';

  // Initialize or update Handsontable
  if (hotInstance) {
    hotInstance.destroy();
  }

  hotInstance = new Handsontable(handsontableContainer, {
    data: dataToLoad,
    colHeaders: ['ID', 'Item', 'Answer', 'Source', 'Definition', 'Comment'],
    columns: [
      {
        data: 'id',
        type: 'text',
        readOnly: true,
        className: 'htDimmed'
      },
      {
        data: 'item',
        type: 'text',
        readOnly: true,
        className: 'htDimmed word-wrap',
        wordWrap: true,
        width: 250
      },
      {
        data: 'answer',
        type: 'dropdown',
        source: ['Yes', 'No'],
        readOnly: isReadOnly,
        width: 100
      },
      {
        data: 'source',
        type: 'text',
        readOnly: isReadOnly,
        width: 200
      },
      {
        data: 'definition',
        type: 'text',
        readOnly: true,
        className: 'htDimmed word-wrap',
        wordWrap: true,
        width: 250
      },
      {
        data: 'comment',
        type: 'text',
        readOnly: isReadOnly,
        width: 200
      }
    ],
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
    dropdownMenu: true,
    filters: true,
    columnSorting: true
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
    saveDraftBtn.disabled = true;
    saveDraftBtn.textContent = 'Saving...';

    const currentData = hotInstance.getData();
    const jsonData = convertToJson(currentData);

    // Update Firestore
    const jobRef = doc(db, 'jobs', currentJob.id);
    await updateDoc(jobRef, {
      saved_response_json: jsonData,
      status: 'draft'
    });

    // Update local state
    currentJob.saved_response_json = jsonData;
    currentJob.status = 'draft';

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
  const confirmed = confirm(
    'Are you sure you want to submit this job? Once submitted, you will not be able to make any further changes.'
  );

  if (!confirmed) return;

  try {
    submitFinalBtn.disabled = true;
    submitFinalBtn.textContent = 'Submitting...';

    const currentData = hotInstance.getData();
    const jsonData = convertToJson(currentData);

    // Update Firestore
    const jobRef = doc(db, 'jobs', currentJob.id);
    await updateDoc(jobRef, {
      saved_response_json: jsonData,
      status: 'submitted'
    });

    // Update local state
    currentJob.saved_response_json = jsonData;
    currentJob.status = 'submitted';

    updateStatusBadge('submitted');
    renderJobsList();
    showSaveMessage('Job submitted successfully!', 'success');

    // Make grid read-only
    hotInstance.updateSettings({
      readOnly: true
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

function convertToJson(dataArray) {
  // Convert Handsontable data array to JSON array of objects
  return dataArray.map((row, index) => ({
    id: row[0] || (index + 1).toString(),
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

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideSaveMessage();
  }, 5000);
}

function hideSaveMessage() {
  saveMessage.classList.add('d-none');
}

// ============================================================
// MOCK DATA GENERATOR (FOR TESTING)
// ============================================================

generateMockBtn.addEventListener('click', async () => {
  const confirmed = confirm(
    'This will create two mock jobs assigned to your email. Continue?'
  );

  if (!confirmed) return;

  try {
    generateMockBtn.disabled = true;
    generateMockBtn.textContent = 'Generating...';

    await generateMockData();

    alert('Mock data generated successfully! Refresh your jobs list.');
    loadUserJobs();

    generateMockBtn.disabled = false;
    generateMockBtn.textContent = 'Generate Mock Data';
  } catch (error) {
    console.error('Error generating mock data:', error);
    alert('Failed to generate mock data. Check console for details.');
    generateMockBtn.disabled = false;
    generateMockBtn.textContent = 'Generate Mock Data';
  }
});

async function generateMockData() {
  const userEmail = currentUser.email;

  // Job 1: Referendums
  const job1Template = [
    {
      id: '1',
      item: 'Is there a citizen-initiated referendum?',
      answer: '',
      source: '',
      definition: 'Add Long Definition 1',
      comment: ''
    },
    {
      id: '2',
      item: 'Is there an explicit legal basis?',
      answer: '',
      source: '',
      definition: 'Add Long Definition 2',
      comment: ''
    }
  ];

  await addDoc(collection(db, 'jobs'), {
    title: 'Referendums 2024',
    description: 'Data collection for Referendums',
    assigned_to: userEmail,
    status: 'new',
    template_json: job1Template,
    saved_response_json: null
  });

  // Job 2: Agenda
  const job2Template = [
    {
      id: '1',
      item: 'Is there a citizen-initiated agenda proposal?',
      answer: '',
      source: '',
      definition: 'Add Long Definition 1',
      comment: ''
    },
    {
      id: '2',
      item: 'What is the time limit for collecting signatures?',
      answer: '',
      source: '',
      definition: 'Add Long Definition 5',
      comment: ''
    }
  ];

  await addDoc(collection(db, 'jobs'), {
    title: 'Agenda Initiatives',
    description: 'Data collection for Agenda Initiatives',
    assigned_to: userEmail,
    status: 'new',
    template_json: job2Template,
    saved_response_json: null
  });

  console.log('Mock data generated successfully!');
}

// ============================================================
// INITIALIZATION
// ============================================================

console.log('Data Collection App initialized');
