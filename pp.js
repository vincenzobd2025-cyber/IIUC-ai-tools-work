/* ==========================================================
   STUDENT ACTIVITY DASHBOARD — script.js
   Vanilla JavaScript only. Works with the provided index.html.

   HTML ids used:
     themeToggle, themeIcon, themeLabel
     totalCount, activeCount, inactiveCount
     studentForm, studentName, studentId, studentDepartment,
     studentStatus, formError
     searchInput, studentList, emptyState, notification
   HTML hooks used:
     .filter-btn[data-filter="all|Active|Inactive"]

   CLASS NAMES THIS SCRIPT ADDS (style them in style.css):
     Dark mode        -> body.dark-mode  (and <html data-theme="dark">)
     Student card     -> li.student-card
                         .student-info  .student-name  .student-meta
                         .status-badge  .badge-active / .badge-inactive
                         .student-actions
                         button.btn.btn-toggle  /  button.btn.btn-delete
     Notification     -> #notification.notification.success | .error
                         (hidden with the .hidden class)
     Filter buttons   -> .active class + aria-pressed (already in HTML)
   ========================================================== */

"use strict";

// ============================
// DATA
// ============================
// Each student: { id: "CSE-101", name: "John Doe", department: "CSE", status: "Active" }
// The Student ID typed in the form is the unique key of each record.
let students = [];

const STATUS_ACTIVE = "Active";
const STATUS_INACTIVE = "Inactive";

// ============================
// STATE
// ============================
const state = {
  searchTerm: "",      // lowercase text from the search box
  statusFilter: "all", // "all" | "Active" | "Inactive"
  isDarkMode: false
};

let notificationTimer = null; // so a new message restarts the auto-hide timer

// ============================
// LOCAL STORAGE
// ============================
const STORAGE_KEY = "studentDashboardData";
const THEME_KEY = "studentDashboardTheme";

// Keep only records that have every field we need (protects against corrupted data)
function isValidStudent(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" && item.id.trim() !== "" &&
    typeof item.name === "string" && item.name.trim() !== "" &&
    typeof item.department === "string" && item.department.trim() !== "" &&
    (item.status === STATUS_ACTIVE || item.status === STATUS_INACTIVE)
  );
}

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    students = Array.isArray(stored) ? stored.filter(isValidStudent) : [];
  } catch (error) {
    // Corrupted JSON or storage blocked: start with an empty list
    students = [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    showNotification("Could not save data in this browser.", "error");
  }
}

function loadTheme() {
  try {
    state.isDarkMode = localStorage.getItem(THEME_KEY) === "dark";
  } catch (error) {
    state.isDarkMode = false;
  }
}

function saveTheme() {
  try {
    localStorage.setItem(THEME_KEY, state.isDarkMode ? "dark" : "light");
  } catch (error) {
    // Theme simply won't be remembered; nothing else to do
  }
}

// ============================
// DOM ELEMENTS
// ============================
let themeToggleBtn, themeIconEl, themeLabelEl;
let totalCountEl, activeCountEl, inactiveCountEl;
let studentFormEl, nameInput, idInput, departmentInput, statusSelect, formErrorEl;
let searchInputEl, studentListEl, emptyStateEl, notificationEl;
let filterButtons;

function cacheDOMElements() {
  themeToggleBtn = document.getElementById("themeToggle");
  themeIconEl = document.getElementById("themeIcon");
  themeLabelEl = document.getElementById("themeLabel");

  totalCountEl = document.getElementById("totalCount");
  activeCountEl = document.getElementById("activeCount");
  inactiveCountEl = document.getElementById("inactiveCount");

  studentFormEl = document.getElementById("studentForm");
  nameInput = document.getElementById("studentName");
  idInput = document.getElementById("studentId");
  departmentInput = document.getElementById("studentDepartment");
  statusSelect = document.getElementById("studentStatus");
  formErrorEl = document.getElementById("formError");

  searchInputEl = document.getElementById("searchInput");
  studentListEl = document.getElementById("studentList");
  emptyStateEl = document.getElementById("emptyState");
  notificationEl = document.getElementById("notification");

  filterButtons = document.querySelectorAll(".filter-btn");
}

// ============================
// RENDER FUNCTIONS
// ============================

// Small helper: create an element with a class and text (textContent is safe from HTML injection)
function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createStudentCard(student) {
  const isActive = student.status === STATUS_ACTIVE;

  const card = createElement("li", "student-card");
  card.dataset.id = student.id;

  // Left side: name + "ID • Department"
  const info = createElement("div", "student-info");
  info.appendChild(createElement("h3", "student-name", student.name));
  info.appendChild(
    createElement("p", "student-meta", `${student.id} • ${student.department}`)
  );

  // Status badge
  const badge = createElement(
    "span",
    `status-badge ${isActive ? "badge-active" : "badge-inactive"}`,
    student.status
  );

  // Action buttons
  const actions = createElement("div", "student-actions");

  const toggleBtn = createElement(
    "button",
    "btn btn-toggle",
    isActive ? "Mark Inactive" : "Mark Active"
  );
  toggleBtn.type = "button";
  toggleBtn.dataset.action = "toggle";
  toggleBtn.dataset.id = student.id;

  const deleteBtn = createElement("button", "btn btn-delete", "Delete");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  deleteBtn.dataset.id = student.id;

  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(info);
  card.appendChild(badge);
  card.appendChild(actions);

  return card;
}

function renderStudents(items) {
  studentListEl.replaceChildren();

  items.forEach(function (student) {
    studentListEl.appendChild(createStudentCard(student));
  });

  renderEmptyState(items.length);
}

// Shows the empty message when nothing is displayed
function renderEmptyState(visibleCount) {
  const showEmpty = visibleCount === 0;
  emptyStateEl.hidden = !showEmpty;
  emptyStateEl.classList.toggle("hidden", !showEmpty);

  if (!showEmpty) return;

  const titleEl = emptyStateEl.querySelector(".empty-title");
  const textEl = emptyStateEl.querySelector(".empty-text");
  if (!titleEl || !textEl) return;

  if (students.length === 0) {
    titleEl.textContent = "No students added yet.";
    textEl.textContent = "Add your first student using the form above.";
  } else {
    titleEl.textContent = "No students found.";
    textEl.textContent = "Try a different search or filter.";
  }
}

function renderDashboard() {
  renderStudents(getFilteredStudents());
  updateStatistics();
}

function renderTheme() {
  document.body.classList.toggle("dark-mode", state.isDarkMode);
  document.documentElement.setAttribute("data-theme", state.isDarkMode ? "dark" : "light");
  themeToggleBtn.setAttribute("aria-pressed", String(state.isDarkMode));
  themeIconEl.textContent = state.isDarkMode ? "☀️" : "🌙";
  themeLabelEl.textContent = state.isDarkMode ? "Light Mode" : "Dark Mode";
}

// ============================
// CALCULATIONS
// ============================
// Counters are always calculated from the students array (never hard-coded)
function updateStatistics() {
  const total = students.length;
  const active = students.filter(function (student) {
    return student.status === STATUS_ACTIVE;
  }).length;
  const inactive = total - active;

  totalCountEl.textContent = total;
  activeCountEl.textContent = active;
  inactiveCountEl.textContent = inactive;
}

// ============================
// SEARCH & FILTER
// ============================

// Search and filter are combined: a student must match BOTH
function getFilteredStudents() {
  return students.filter(function (student) {
    const matchesStatus =
      state.statusFilter === "all" || student.status === state.statusFilter;

    const matchesSearch =
      state.searchTerm === "" ||
      student.name.toLowerCase().includes(state.searchTerm) ||
      student.id.toLowerCase().includes(state.searchTerm);

    return matchesStatus && matchesSearch;
  });
}

function searchData(event) {
  state.searchTerm = event.target.value.trim().toLowerCase();
  renderDashboard();
}

function filterData(event) {
  const clickedButton = event.currentTarget;
  state.statusFilter = clickedButton.dataset.filter;

  filterButtons.forEach(function (button) {
    const isSelected = button === clickedButton;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  renderDashboard();
}

// ============================
// SORTING
// ============================
// The HTML has no sortable columns (students are shown as cards), so there is
// nothing to sort. New students are added at the top so the newest is visible first.

// ============================
// MODALS
// ============================
// This dashboard has no modals: students are added with the inline form,
// and delete uses the browser's confirm() dialog.

// ============================
// CRUD OPERATIONS
// ============================

// ---- Validation ----
function validateStudent(name, id, department) {
  if (name === "" || id === "" || department === "") {
    return "Please fill in the student name, ID and department.";
  }

  const idAlreadyExists = students.some(function (student) {
    return student.id.toLowerCase() === id.toLowerCase();
  });
  if (idAlreadyExists) {
    return `Student ID "${id}" already exists. Please use a different ID.`;
  }

  return ""; // empty string = no error
}

function showFormError(message) {
  formErrorEl.textContent = message;
  formErrorEl.hidden = message === "";
}

function clearFormError() {
  showFormError("");
}

// ---- Add ----
function addStudent(event) {
  event.preventDefault();

  // Collapse extra spaces so "  John   Doe " becomes "John Doe"
  const name = nameInput.value.trim().replace(/\s+/g, " ");
  const id = idInput.value.trim();
  const department = departmentInput.value.trim();
  const status = statusSelect.value === STATUS_INACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;

  const errorMessage = validateStudent(name, id, department);
  if (errorMessage) {
    showFormError(errorMessage);
    showNotification(errorMessage, "error");
    return;
  }

  clearFormError();
  students.unshift({ id: id, name: name, department: department, status: status });
  saveData();

  // Reset the form; the search/filter stay as they are
  studentFormEl.reset();
  statusSelect.value = STATUS_ACTIVE;
  nameInput.focus();

  // If the new student is hidden by the current search/filter, tell the user why
  const isVisible = getFilteredStudents().some(function (student) {
    return student.id === id;
  });

  renderDashboard();
  showNotification(
    isVisible
      ? `${name} was added successfully.`
      : `${name} was added, but is hidden by the current search or filter.`,
    "success"
  );
}

// ---- Edit (change status) ----
function toggleStatus(studentId) {
  const student = students.find(function (item) {
    return item.id === studentId;
  });
  if (!student) return;

  student.status = student.status === STATUS_ACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;
  saveData();
  renderDashboard();
  showNotification(`${student.name} is now ${student.status}.`, "success");
}

// ---- Delete ----
function deleteStudent(studentId) {
  const student = students.find(function (item) {
    return item.id === studentId;
  });
  if (!student) return;

  const confirmed = confirm(`Are you sure you want to delete ${student.name} (${student.id})?`);
  if (!confirmed) return;

  students = students.filter(function (item) {
    return item.id !== studentId;
  });
  saveData();
  renderDashboard();
  showNotification(`${student.name} was deleted.`, "success");
}

// One click listener for all buttons inside the list (event delegation).
// This keeps working even though the cards are re-created on every render.
function handleStudentListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const studentId = button.dataset.id;
  if (button.dataset.action === "toggle") toggleStatus(studentId);
  if (button.dataset.action === "delete") deleteStudent(studentId);
}

// ---- Notifications ----
function showNotification(message, type) {
  const messageType = type === "error" ? "error" : "success";

  notificationEl.textContent = message;
  notificationEl.className = `notification ${messageType}`;
  notificationEl.classList.remove("hidden");

  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(function () {
    notificationEl.classList.add("hidden");
  }, 3000);
}

// ---- Theme ----
function toggleTheme() {
  state.isDarkMode = !state.isDarkMode;
  saveTheme();
  renderTheme();
}

// ============================
// CHARTS
// ============================
// No charts on this dashboard, so there is nothing to draw here.

// ============================
// EVENT LISTENERS
// ============================
function setupEventListeners() {
  studentFormEl.addEventListener("submit", addStudent);

  // Hide the error message as soon as the user starts fixing the form
  [nameInput, idInput, departmentInput].forEach(function (input) {
    input.addEventListener("input", clearFormError);
  });

  searchInputEl.addEventListener("input", searchData);

  filterButtons.forEach(function (button) {
    button.addEventListener("click", filterData);
  });

  studentListEl.addEventListener("click", handleStudentListClick);
  themeToggleBtn.addEventListener("click", toggleTheme);
}

// ============================
// INITIALIZATION
// ============================
function initializeApp() {
  cacheDOMElements();
  loadData();
  loadTheme();

  // Make sure the UI matches the default state (in case the browser restored form values)
  searchInputEl.value = "";
  statusSelect.value = STATUS_ACTIVE;
  clearFormError();
  notificationEl.classList.add("hidden");

  setupEventListeners();
  renderTheme();
  renderDashboard();
}

initializeApp();
