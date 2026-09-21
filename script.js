/* ==========================================================
   STUDENT ACTIVITY DASHBOARD
   Every DOM concept from the assignment is used below, with
   a comment pointing out which one and why.
   ========================================================== */

/* ---------- 1. FINDING ELEMENTS ON THE PAGE ---------- */
// getElementById() grabs a single, known element by its unique id.
const studentForm   = document.getElementById("studentForm");
const studentNameInput   = document.getElementById("studentName");
const studentStatusSelect = document.getElementById("studentStatus");
const studentList   = document.getElementById("studentList");
const emptyState    = document.getElementById("emptyState");
const searchInput   = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");
const darkModeToggle = document.getElementById("darkModeToggle");

const totalCountEl    = document.getElementById("totalCount");
const activeCountEl   = document.getElementById("activeCount");
const inactiveCountEl = document.getElementById("inactiveCount");

/* ---------- App state ----------
   The "source of truth" lives in this array, not in the DOM.
   Every time it changes, we re-render the list from scratch.
   This keeps the DOM and the data in sync and is a common
   pattern once you move past tiny scripts. */
let students = [];
let nextId = 1;

let currentFilter = "all";   // "all" | "active" | "inactive"
let currentSearch = "";

/* ==========================================================
   RENDERING
   ========================================================== */
function renderStudents() {
  // querySelectorAll() would let us grab existing cards by a CSS
  // selector (e.g. document.querySelectorAll(".student-card")).
  // Here we clear the container instead, then rebuild it -
  // simplest way to keep the list in sync with `students`.
  studentList.textContent = "";

  const term = currentSearch.trim().toLowerCase();

  const visibleStudents = students.filter((student) => {
    const matchesFilter =
      currentFilter === "all" || student.status === currentFilter;
    const matchesSearch = student.name.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  // Showing/hiding the "no results" message with the `hidden` class.
  // classList.toggle(className, condition) adds the class when
  // condition is true and removes it when false.
  emptyState.classList.toggle("hidden", visibleStudents.length > 0);

  visibleStudents.forEach((student) => {
    studentList.appendChild(createStudentCard(student));
  });

  updateStats();
}

/* ---------- 2. CREATING AND ADDING ELEMENTS ---------- */
function createStudentCard(student) {
  // createElement() builds a new element in memory. It doesn't
  // appear on the page until we attach it somewhere with
  // appendChild().
  const card = document.createElement("div");
  card.className = "student-card";

  // ---------- 5. STORING AND READING DATA ----------
  // setAttribute() stores extra information directly on the
  // element itself - here, the student's id and status - so we
  // can read it back later (e.g. with getAttribute()) without
  // keeping a separate lookup table in the DOM.
  card.setAttribute("data-id", student.id);
  card.setAttribute("data-status", student.status);

  const info = document.createElement("div");
  info.className = "student-info";

  const nameSpan = document.createElement("span");
  nameSpan.className = "student-name";
  // textContent sets the visible text safely (no HTML injection).
  nameSpan.textContent = student.name;

  const badge = document.createElement("span");
  badge.className = `status-badge ${student.status}`;
  badge.textContent = student.status === "active" ? "Active" : "Inactive";

  info.appendChild(nameSpan);
  info.appendChild(badge);

  const actions = document.createElement("div");
  actions.className = "student-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.textContent =
    student.status === "active" ? "Mark inactive" : "Mark active";
  // ---------- 7. RESPONDING TO USER ACTIONS ----------
  // addEventListener() wires up a click handler for this one card.
  toggleBtn.addEventListener("click", () => toggleStatus(student.id));

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => removeStudent(student.id));

  actions.appendChild(toggleBtn);
  actions.appendChild(removeBtn);

  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

/* ==========================================================
   STATE-CHANGING ACTIONS
   ========================================================== */
function addStudent(name, status) {
  students.push({ id: nextId++, name, status });
  renderStudents();
}

function toggleStatus(id) {
  // getAttribute() would let us read data-status straight off a
  // clicked card's DOM node; since we already keep the same data
  // in the `students` array, we update the array (the source of
  // truth) and let renderStudents() rebuild the attributes/DOM.
  students = students.map((student) =>
    student.id === id
      ? { ...student, status: student.status === "active" ? "inactive" : "active" }
      : student
  );
  renderStudents();
}

function removeStudent(id) {
  // ---------- 6. REMOVING ELEMENTS ----------
  // In a larger app you might grab the exact card with
  // querySelector(`[data-id="${id}"]`) and call card.remove().
  // Here we remove it from the data array and re-render, which
  // removes the corresponding card from the page too.
  students = students.filter((student) => student.id !== id);
  renderStudents();
}

/* ---------- Live stats ---------- */
function updateStats() {
  const total = students.length;
  const active = students.filter((s) => s.status === "active").length;
  const inactive = total - active;

  // Reading/changing content with textContent.
  totalCountEl.textContent = total;
  activeCountEl.textContent = active;
  inactiveCountEl.textContent = inactive;
}

/* ==========================================================
   EVENT LISTENERS
   ========================================================== */

/* ---------- Add student form ---------- */
studentForm.addEventListener("submit", (event) => {
  // event.preventDefault() stops the browser's default behavior
  // for a form submit, which is to reload the page.
  event.preventDefault();

  // input.value reads what the user typed / selected.
  const name = studentNameInput.value.trim();
  const status = studentStatusSelect.value;

  if (!name) {
    studentNameInput.focus();
    return;
  }

  addStudent(name, status);

  // form.reset() clears every field back to its default value.
  studentForm.reset();
  studentNameInput.focus();
});

/* ---------- Live search ---------- */
searchInput.addEventListener("input", (event) => {
  currentSearch = event.target.value;
  renderStudents();
});

/* ---------- Filter buttons (Active / Inactive / All) ---------- */
// ---------- 3. FINDING ELEMENTS WITH querySelectorAll ----------
// querySelectorAll() finds every element matching a CSS selector
// and returns a NodeList we can loop over.
const allFilterButtons = filterButtons.querySelectorAll(".filter-btn");

filterButtons.addEventListener("click", (event) => {
  // event.target is whatever the user actually clicked. Using one
  // listener on the parent (.filter-buttons) instead of one per
  // button is called "event delegation".
  const clickedButton = event.target.closest(".filter-btn");
  if (!clickedButton) return;

  currentFilter = clickedButton.getAttribute("data-filter");

  // ---------- 4. WORKING WITH CLASSES ----------
  allFilterButtons.forEach((btn) => {
    // classList.remove() takes the highlight off every button...
    btn.classList.remove("active");
  });
  // ...then classList.add() highlights only the one just clicked.
  clickedButton.classList.add("active");

  renderStudents();
});

/* ---------- Dark mode toggle ---------- */
darkModeToggle.addEventListener("click", () => {
  const isDark = document.body.getAttribute("data-theme") === "dark";

  if (isDark) {
    document.body.removeAttribute("data-theme");
    darkModeToggle.textContent = "🌙 Dark mode";
  } else {
    document.body.setAttribute("data-theme", "dark");
    darkModeToggle.textContent = "☀️ Light mode";
  }

  // classList.contains() / toggle() are the more common way to do
  // this; shown here for reference:
  // document.body.classList.toggle("dark-mode");
  // if (document.body.classList.contains("dark-mode")) { ... }
});

/* ---------- Initial render ---------- */
renderStudents();
