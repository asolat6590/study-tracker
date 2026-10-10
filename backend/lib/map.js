function mapSubject(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    taskCount: Number(row.task_count || 0),
    studySeconds: Number(row.study_seconds || 0),
  };
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    durationSeconds: Number(row.duration_seconds),
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

module.exports = { mapSubject, mapTask, mapSession };
