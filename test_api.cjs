fetch('https://anyi-byb.pages.dev/api/memorials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: "test-id-123", name: "test", author_id: "test-author", type: "person", status: "accepted" })
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
