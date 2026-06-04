CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_created_at ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_user_status_created_at ON tasks(user_id, status, created_at DESC);