/**
 * Tasks rendering component
 * Displays tasks with progress clocks (1-6 ticks)
 */

/**
 * Render a progress clock for a task
 * @param {object} task - Task object with id, currentTicks, maxTicks
 * @param {boolean} interactive - Whether the clock is clickable
 * @returns {string} HTML string for the clock
 */
function renderClock(task, interactive = true) {
  let html = '<div class="task-clock">';

  for (let i = 0; i < task.maxTicks; i++) {
    const filled = i < task.currentTicks;
    const action = interactive ? ` data-action="tickTask" data-params='{"id":"${task.id}"}'` : '';
    html += `<div class="clock-tick ${filled ? 'filled' : ''}"${action}></div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render the tasks section
 * @param {object} character - Character object
 * @param {boolean} showAddForm - Whether to show the add task form
 * @returns {string} HTML string
 */
export function renderTasks(character, showAddForm = false) {
  const char = character;
  let html = '<div><h2 class="section-header">Tasks</h2>';

  // Render existing tasks
  for (let i = 0; i < char.tasks.length; i++) {
    const task = char.tasks[i];

    if (task.editing) {
      // Editing mode
      html += '<div class="task-row editing" style="margin-bottom: 8px;">';
      html += '<input type="text" ';
      html += `value="${task.name}" `;
      html += 'placeholder="Task name..." ';
      html += `data-action="updateTaskName" `;
      html += `data-params='{"id":"${task.id}"}' `;
      html += 'style="flex: 1; margin-right: 8px;">';

      html += '<select ';
      html += `data-action="updateTaskMaxTicks" `;
      html += `data-params='{"id":"${task.id}"}' `;
      html += 'style="margin-right: 8px;">';
      for (let ticks = 1; ticks <= 6; ticks++) {
        html += `<option value="${ticks}"${task.maxTicks === ticks ? ' selected' : ''}>${ticks} ticks</option>`;
      }
      html += '</select>';

      html += `<button data-action="toggleTaskEditing" data-params='{"id":"${task.id}"}' style="padding: 4px 12px;">✓</button>`;
      html += '</div>';
    } else {
      // Display mode
      html += '<div class="task-row" style="margin-bottom: 8px;">';
      html += '<div style="flex: 1; display: flex; align-items: center; gap: 12px;">';
      html += `<div class="task-name">${task.name || 'Unnamed Task'}</div>`;
      html += renderClock(task, true);
      html += `<div class="task-progress">${task.currentTicks}/${task.maxTicks}</div>`;
      html += '</div>';
      html += '<div style="display: flex; gap: 8px;">';
      html += `<button class="icon-button" data-action="toggleTaskEditing" data-params='{"id":"${task.id}"}' title="Edit">✎</button>`;
      html += `<button class="icon-button" data-action="deleteTask" data-params='{"id":"${task.id}"}' title="Delete">✕</button>`;
      html += '</div>';
      html += '</div>';
    }
  }

  // Show add form if requested (after existing tasks)
  if (showAddForm) {
    html += renderAddTaskForm();
  }

  // Add new task button (only show if form is not open)
  if (!showAddForm) {
    const marginTop = char.tasks.length > 0 ? '12' : '0';
    html += `<button class="ghost" data-action="openAddTaskForm" style="width: 100%; margin-top: ${marginTop}px;">+ New Task</button>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render the add task form
 * @returns {string} HTML string
 */
export function renderAddTaskForm() {
  let html = '<div class="task-row editing" style="margin-bottom: 8px;">';
  html += '<input type="text" id="new-task-name" placeholder="Task name..." style="flex: 1; margin-right: 8px;">';

  html += '<select id="new-task-ticks" style="margin-right: 8px;">';
  for (let ticks = 1; ticks <= 6; ticks++) {
    html += `<option value="${ticks}"${ticks === 4 ? ' selected' : ''}>${ticks} ticks</option>`;
  }
  html += '</select>';

  html += '<button data-action="saveNewTask" style="padding: 4px 12px; margin-right: 4px;">✓</button>';
  html += '<button data-action="cancelNewTask" style="padding: 4px 12px;">✕</button>';
  html += '</div>';

  return html;
}
