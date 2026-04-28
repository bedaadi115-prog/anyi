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
  
  // Parse JSON fields
  const parsed = results.map((row: any) => ({
    ...row,
    flowers: row.flowers ? JSON.parse(row.flowers) : [],
    forum_comments: row.forum_comments ? JSON.parse(row.forum_comments) : [],
    _deleted: row.deleted === 1
  }));
  
  return c.json(parsed);
});

app.post('/forum_posts', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { id, user_id, content, user_name, user_role, user_avatar, image_url } = body;
  await DB.prepare('INSERT INTO forum_posts (id, user_id, content, user_name, user_role, user_avatar, image_url, flowers, forum_comments, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(...[id, user_id, content, user_name, user_role, user_avatar, image_url, '[]', '[]', 0].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

app.put('/forum_posts/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
  if (body.flowers !== undefined) { updates.push('flowers = ?'); values.push(JSON.stringify(body.flowers)); }
  if (body.forum_comments !== undefined) { updates.push('forum_comments = ?'); values.push(JSON.stringify(body.forum_comments)); }
  if (body._deleted !== undefined) { updates.push('deleted = ?'); values.push(body._deleted ? 1 : 0); }
  
  if (updates.length > 0) {
    values.push(id);
    await DB.prepare(`UPDATE forum_posts SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  return c.json({ success: true });
});

app.delete('/forum_posts/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  await DB.prepare('DELETE FROM forum_posts WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Memorials
app.get('/memorials', async (c) => {
  const { DB } = c.env as any;
  const author_id = c.req.query('author_id');
  const status = c.req.query('status');
  
  let query = 'SELECT * FROM memorials ORDER BY created_at DESC';
  let binds: any[] = [];
  
  if (author_id) {
    query = 'SELECT * FROM memorials WHERE author_id = ? ORDER BY created_at DESC';
    binds = [author_id];
  } else if (status === 'accepted,completed') {
    query = 'SELECT * FROM memorials WHERE status IN ("accepted", "completed") ORDER BY created_at DESC LIMIT 50';
  }
  
  const { results } = await DB.prepare(query).bind(...binds).all();
  
  const parsed = results.map((row: any) => ({
    ...row,
    progress_images: row.progress_images ? JSON.parse(row.progress_images) : [],
    completion_images: row.completion_images ? JSON.parse(row.completion_images) : []
  }));
  
  return c.json(parsed);
});

app.post('/memorials', async (c) => {
  const { DB } = c.env as any;
  const body = await c.req.json();
  const { id, name, relation, birth_date, death_date, message, image_url, author_name, author_id, type, status, event_date, plan, remarks } = body;
  
  await DB.prepare('INSERT INTO memorials (id, name, relation, birth_date, death_date, message, image_url, author_name, author_id, type, status, event_date, plan, remarks, progress_images, completion_images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(...[id, name, relation, birth_date, death_date, message, image_url, author_name, author_id, type, status, event_date, plan, remarks, '[]', '[]'].map(v => v === undefined ? null : v)).run();
  return c.json({ id });
});

app.put('/memorials/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
  if (body.completion_time !== undefined) { updates.push('completion_time = ?'); values.push(body.completion_time); }
  if (body.completion_location !== undefined) { updates.push('completion_location = ?'); values.push(body.completion_location); }
  if (body.completion_images !== undefined) { updates.push('completion_images = ?'); values.push(typeof body.completion_images === 'string' ? body.completion_images : JSON.stringify(body.completion_images)); }
  if (body.completion_remarks !== undefined) { updates.push('completion_remarks = ?'); values.push(body.completion_remarks); }
  if (body.progress_images !== undefined) { updates.push('progress_images = ?'); values.push(typeof body.progress_images === 'string' ? body.progress_images : JSON.stringify(body.progress_images)); }
  if (body.completed_at !== undefined) { updates.push('completed_at = ?'); values.push(body.completed_at); }
  
  if (updates.length > 0) {
    values.push(id);
    await DB.prepare(`UPDATE memorials SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  return c.json({ success: true });
});

app.delete('/memorials/:id', async (c) => {
  const { DB } = c.env as any;
  const id = c.req.param('id');
  await DB.prepare('DELETE FROM memorials WHERE id = ?').bind(id).run();
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
