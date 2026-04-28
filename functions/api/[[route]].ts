import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono().basePath('/api');

// Upload avatar to R2
app.post('/upload', async (c) => {
  const env = c.env as any;
  const BUCKET = env.BUCKET;
  
  const body = await c.req.parseBody();
  const file = body['file'] as File;
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }
  
  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  
  await BUCKET.put(filename, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type
    }
  });
  
  return c.json({ url: `/api/assets/${filename}` });
});

// Serve assets from R2
app.get('/assets/:key', async (c) => {
  const env = c.env as any;
  const BUCKET = env.BUCKET;
  const key = c.req.param('key');
  
  const object = await BUCKET.get(key);
  if (!object) return c.notFound();
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  return new Response(object.body as any, { headers });
});

// Users
app.get('/users', async (c) => {
  const { DB } = c.env as any;
  const username = c.req.query('username');
  if (username) {
    const { results } = await DB.prepare('SELECT * FROM users WHERE username = ?').bind(...[username].map(v => v === undefined ? null : v)).all();
    return c.json(results);
  }
  return c.json([]);
});

app.get('/users/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  const { results } = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(...[id].map(v => v === undefined ? null : v)).all();
  return c.json(results);
});

app.post('/users', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { username, password, name, email, role, id } = body;
  await DB.prepare('INSERT INTO users (id, username, password, name, email, role) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(...[id, username, password, name, email, role].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

app.put('/users/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, avatar } = body;
  await DB.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?').bind(...[name, avatar, id].map(v => v === undefined ? null : v)).run();
  return c.json({ success: true });
});

// Forum Posts
app.get('/forum_posts', async (c) => {
  const { DB } = c.env as any;
  const { results } = await DB.prepare('SELECT * FROM forum_posts ORDER BY created_at DESC LIMIT 100').all();
  return c.json(results);
});

app.post('/forum_posts', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { id, user_id, content, user_name, user_role, user_avatar } = body;
  await DB.prepare('INSERT INTO forum_posts (id, user_id, content, user_name, user_role, user_avatar) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(...[id, user_id, content, user_name, user_role, user_avatar].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

// Memorials
app.get('/memorials', async (c) => {
  const { DB } = c.env as any;
  const author_id = c.req.query('author_id');
  const status = c.req.query('status');
  
  if (author_id) {
    const { results } = await DB.prepare('SELECT * FROM memorials WHERE author_id = ? ORDER BY created_at DESC').bind(...[author_id].map(v => v === undefined ? null : v)).all();
    return c.json(results);
  }
  
  if (status === 'accepted,completed') {
    const { results } = await DB.prepare('SELECT * FROM memorials WHERE status IN ("accepted", "completed") ORDER BY created_at DESC LIMIT 50').all();
    return c.json(results);
  }
  
  const { results } = await DB.prepare('SELECT * FROM memorials ORDER BY created_at DESC').all();
  return c.json(results);
});

app.post('/memorials', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { id, name, relation, birth_date, death_date, message, image_url, author_name, author_id, type, status, event_date, plan, remarks } = body;
  
  await DB.prepare('INSERT INTO memorials (id, name, relation, birth_date, death_date, message, image_url, author_name, author_id, type, status, event_date, plan, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(...[id, name, relation, birth_date, death_date, message, image_url, author_name, author_id, type, status, event_date, plan, remarks].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

app.put('/memorials/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  if (body.status === 'completed') {
    const { completion_time, completion_location, completion_images, completion_remarks } = body;
    await DB.prepare('UPDATE memorials SET status = ?, completion_time = ?, completion_location = ?, completion_images = ?, completion_remarks = ? WHERE id = ?')
      .bind(...[body.status, completion_time, completion_location, completion_images, completion_remarks, id].map(v => v === undefined ? null : v)).run();
  } else {
    await DB.prepare('UPDATE memorials SET status = ? WHERE id = ?').bind(...[body.status, id].map(v => v === undefined ? null : v)).run();
  }
  
  return c.json({ success: true });
});

// Comments
app.get('/comments', async (c) => {
  const { DB } = c.env as any;
  const { results } = await DB.prepare('SELECT * FROM comments').all();
  return c.json(results);
});

app.post('/comments', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { id, memorial_id, user_id, content, user_name } = body;
  await DB.prepare('INSERT INTO comments (id, memorial_id, user_id, content, user_name) VALUES (?, ?, ?, ?, ?)')
    .bind(...[id, memorial_id, user_id, content, user_name].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

// Messages
app.get('/messages', async (c) => {
  const { DB } = c.env as any;
  const memorial_id = c.req.query('memorial_id');
  if (memorial_id) {
    const { results } = await DB.prepare('SELECT * FROM messages WHERE memorial_id = ? ORDER BY created_at ASC').bind(...[memorial_id].map(v => v === undefined ? null : v)).all();
    return c.json(results);
  }
  return c.json([]);
});

app.post('/messages', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { id, memorial_id, sender_id, content } = body;
  await DB.prepare('INSERT INTO messages (id, memorial_id, sender_id, content) VALUES (?, ?, ?, ?)')
    .bind(...[id, memorial_id, sender_id, content].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

export const onRequest = handle(app);
