-- schema.sql
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS memorials;
CREATE TABLE memorials (
  id TEXT PRIMARY KEY,
  name TEXT,
  relation TEXT,
  birth_date TEXT,
  death_date TEXT,
  message TEXT,
  image_url TEXT,
  author_name TEXT,
  author_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  event_date TEXT,
  plan INTEGER,
  remarks TEXT,
  location TEXT,
  completion_time TEXT,
  completion_location TEXT,
  completion_images TEXT,
  completion_remarks TEXT
);

DROP TABLE IF EXISTS forum_posts;
CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_name TEXT,
  user_role TEXT,
  user_avatar TEXT,
  image_url TEXT
);

DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  memorial_id TEXT,
  user_id TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_name TEXT
);

DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  memorial_id TEXT,
  sender_id TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (optional default)
-- INSERT INTO users (id, username, password, name, email, role) VALUES ('admin', 'admin', 'admin123', 'Admin', 'admin@system.local', 'admin');
