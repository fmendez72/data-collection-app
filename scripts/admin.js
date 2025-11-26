// scripts/admin.js
// Admin panel logic for managing users and templates

// ============================================================
// IMPORTS
// ============================================================

import { auth, db } from '../firebase-config.js';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ============================================================
// GLOBAL STATE
// ============================================================

let currentAdmin = null;

// ============================================================
// DOM ELEMENTS
// ============================================================

const adminLoginScreen = document.getElementById('admin-login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginError = document.getElementById('admin-login-error');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminEmailDisplay = document.getElementById('admin-email-display');

const usersCsvFile = document.getElementById('users-csv-file');
const uploadUsersBtn = document.getElementById('upload-users-btn');
const usersUploadMessage = document.getElementById('users-upload-message');

const jobIdInput = document.getElementById('job-id');
const jobTitleInput = document.getElementById('job-title');
const jobDescriptionInput = document.getElementById('job-description');
const templateCsvFile = document.getElementById('template-csv-file');
const uploadTemplateBtn = document.getElementById('upload-template-btn');
const templateUploadMessage = document.getElementById('template-upload-message');

const viewResponsesBtn = document.getElementById('view-responses-btn');
const responsesContainer = document.getElementById('responses-container');

// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', user.email));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      currentAdmin = user;
      showAdminDashboard();
    } else {
      alert('Access denied. Admin privileges required.');
      await signOut(auth);
      showAdminLogin();
    }
  } else {
    currentAdmin = null;
    showAdminLogin();
  }
});

adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    adminLoginError.classList.add('d-none');
  } catch (error) {
    adminLoginError.textContent = `Login failed: ${error.message}`;
    adminLoginError.classList.remove('d-none');
  }
});

adminLogoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
  }
});

// ============================================================
// UI NAVIGATION
// ============================================================

function showAdminLogin() {
  adminLoginScreen.classList.remove('d-none');
  adminDashboard.classList.add('d-none');
}

function showAdminDashboard() {
  adminLoginScreen.classList.add('d-none');
  adminDashboard.classList.remove('d-none');
  adminEmailDisplay.textContent = currentAdmin.email;
}

// ============================================================
// USER MANAGEMENT
// ============================================================

uploadUsersBtn.addEventListener('click', async () => {
  const file = usersCsvFile.files[0];
  if (!file) {
    showMessage(usersUploadMessage, 'Please select a CSV file', 'warning');
    return;
  }

  uploadUsersBtn.disabled = true;
  uploadUsersBtn.textContent = 'Processing...';
  showMessage(usersUploadMessage, 'Reading CSV file...', 'info');

  try {
    const csvText = await file.text();
    const users = parseUsersCSV(csvText);

    showMessage(usersUploadMessage, `Parsed ${users.length} users. Creating accounts...`, 'info');

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Try to create Firebase Auth user first
        try {
          await createUserWithEmailAndPassword(auth, user.email, user.password);
        } catch (authError) {
          // If user already exists in Auth, that's okay, continue to Firestore
          if (authError.code !== 'auth/email-already-in-use') {
            throw authError;
          }
        }

        // Create/update user document in Firestore (works regardless of Auth result)
        await setDoc(doc(db, 'users', user.email), {
          email: user.email,
          assigned_jobs: user.assigned_jobs,
          role: user.role,
          created_at: new Date().toISOString()
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to process user ${user.email}:`, error);
        errorCount++;
      }
    }

    showMessage(
      usersUploadMessage,
      `Complete! Created/Updated: ${successCount}, Errors: ${errorCount}`,
      errorCount === 0 ? 'success' : 'warning'
    );

    uploadUsersBtn.disabled = false;
    uploadUsersBtn.textContent = 'Upload Users CSV';
  } catch (error) {
    console.error('Error processing users CSV:', error);
    showMessage(usersUploadMessage, `Error: ${error.message}`, 'danger');
    uploadUsersBtn.disabled = false;
    uploadUsersBtn.textContent = 'Upload Users CSV';
  }
});

function parseUsersCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const users = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const user = {};

    headers.forEach((header, index) => {
      user[header] = values[index] || '';
    });

    // Parse assigned_jobs (comma-separated, possibly quoted)
    const assignedJobsStr = user.assigned_jobs.replace(/^"|"$/g, '');
    user.assigned_jobs = assignedJobsStr.split(',').map(j => j.trim()).filter(j => j);

    users.push({
      email: user.user_email,
      password: user.password,
      assigned_jobs: user.assigned_jobs,
      role: user.role || 'coder'
    });
  }

  return users;
}

// ============================================================
// TEMPLATE MANAGEMENT
// ============================================================

uploadTemplateBtn.addEventListener('click', async () => {
  const file = templateCsvFile.files[0];
  const jobId = jobIdInput.value.trim();
  const jobTitle = jobTitleInput.value.trim();
  const jobDescription = jobDescriptionInput.value.trim();

  if (!file) {
    showMessage(templateUploadMessage, 'Please select a CSV file', 'warning');
    return;
  }

  if (!jobId) {
    showMessage(templateUploadMessage, 'Please enter a Job ID', 'warning');
    return;
  }

  if (!jobTitle) {
    showMessage(templateUploadMessage, 'Please enter a Job Title', 'warning');
    return;
  }

  uploadTemplateBtn.disabled = true;
  uploadTemplateBtn.textContent = 'Processing...';
  showMessage(templateUploadMessage, 'Reading CSV file...', 'info');

  try {
    const csvText = await file.text();
    const questions = parseTemplateCSV(csvText);

    showMessage(templateUploadMessage, `Parsed ${questions.length} questions. Saving to Firestore...`, 'info');

    // Create template document in Firestore
    await setDoc(doc(db, 'templates', jobId), {
      job_id: jobId,
      title: jobTitle,
      description: jobDescription,
      questions: questions,
      created_at: new Date().toISOString(),
      version: 1
    });

    showMessage(templateUploadMessage, `Template "${jobTitle}" created successfully!`, 'success');

    // Clear form
    jobIdInput.value = '';
    jobTitleInput.value = '';
    jobDescriptionInput.value = '';
    templateCsvFile.value = '';

    uploadTemplateBtn.disabled = false;
    uploadTemplateBtn.textContent = 'Upload Template CSV';
  } catch (error) {
    console.error('Error processing template CSV:', error);
    showMessage(templateUploadMessage, `Error: ${error.message}`, 'danger');
    uploadTemplateBtn.disabled = false;
    uploadTemplateBtn.textContent = 'Upload Template CSV';
  }
});

function parseTemplateCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Parse answer options
    let answerType = 'text';
    let answerOptions = [];

    if (row.Answer && row.Answer.startsWith('[')) {
      // Parse JSON array
      try {
        answerOptions = JSON.parse(row.Answer);
        answerType = 'dropdown';
      } catch (e) {
        console.warn(`Failed to parse answer options for question ${row.id}:`, e);
      }
    }

    questions.push({
      id: row.id,
      item: row.Item || '',
      answer_type: answerType,
      answer_options: answerOptions,
      source: '',
      definition: row.Definition || '',
      comment: ''
    });
  }

  return questions;
}

// ============================================================
// VIEW RESPONSES
// ============================================================

viewResponsesBtn.addEventListener('click', async () => {
  viewResponsesBtn.disabled = true;
  viewResponsesBtn.textContent = 'Loading...';

  try {
    const responsesQuery = query(collection(db, 'responses'), where('status', '==', 'submitted'));
    const querySnapshot = await getDocs(responsesQuery);

    if (querySnapshot.empty) {
      responsesContainer.innerHTML = '<p class="text-muted">No submitted responses yet.</p>';
    } else {
      let html = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
      html += '<th>User</th><th>Job ID</th><th>Status</th><th>Submitted At</th><th>Actions</th>';
      html += '</tr></thead><tbody>';

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        html += `<tr>
          <td>${data.user_email}</td>
          <td>${data.job_id}</td>
          <td><span class="badge bg-success">${data.status}</span></td>
          <td>${new Date(data.submitted_at).toLocaleString()}</td>
          <td><button class="btn btn-sm btn-primary view-response-btn" data-id="${doc.id}">View</button></td>
        </tr>`;
      });

      html += '</tbody></table></div>';
      responsesContainer.innerHTML = html;

      // Add event listeners to view buttons
      document.querySelectorAll('.view-response-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const responseId = e.target.dataset.id;
          const responseDoc = await getDoc(doc(db, 'responses', responseId));
          if (responseDoc.exists()) {
            const data = responseDoc.data();
            const jsonStr = JSON.stringify(data.data, null, 2);
            alert(`Response Data:\n\n${jsonStr}`);
            // In production, you might want to show this in a modal or export as CSV
          }
        });
      });
    }

    viewResponsesBtn.disabled = false;
    viewResponsesBtn.textContent = 'Load All Responses';
  } catch (error) {
    console.error('Error loading responses:', error);
    responsesContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    viewResponsesBtn.disabled = false;
    viewResponsesBtn.textContent = 'Load All Responses';
  }
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"' && inQuotes) {
      // Double quote inside quoted field - add single quote
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote mode
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Comma outside quotes - field delimiter
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `alert alert-${type}`;
  element.classList.remove('d-none');
}

console.log('Admin panel initialized');
