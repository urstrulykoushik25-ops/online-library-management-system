const $ = id => document.getElementById(id);
const message = text => { $('message').textContent = text; };
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed'); return data;
}
const body = data => JSON.stringify(data);
async function refresh() { await Promise.all([loadBooks(), loadStudents(), loadIssues()]); }
async function loadBooks() {
  const books = await api('/api/books?q=' + encodeURIComponent($('search').value));
  $('booksBody').innerHTML = books.map(b => `<tr><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${b.available ? 'Available' : 'Issued'}</td><td><button class="edit" data-id="${b.id}">Edit</button><button class="danger delete" data-id="${b.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="4">No books found</td></tr>';
  const available = books.filter(b => b.available); $('issueBook').innerHTML = '<option value="">Select available book</option>' + available.map(b => `<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');
}
async function loadStudents() { const students = await api('/api/students'); $('issueStudent').innerHTML = '<option value="">Select student</option>' + students.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join(''); }
async function loadIssues() { const issues = await api('/api/issues'); $('issuesBody').innerHTML = issues.map(i => `<tr><td>${escapeHtml(i.book?.title || 'Deleted book')}</td><td>${escapeHtml(i.student?.name || 'Unknown')}</td><td>${i.dueDate}</td><td>${i.returnedAt ? 'Returned' : 'Issued'} / ₹${i.fine}</td><td>${i.returnedAt ? '—' : `<button class="return" data-id="${i.id}">Return</button>`}</td></tr>`).join('') || '<tr><td colspan="5">No issued books</td></tr>'; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
$('loginForm').addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/login', { method:'POST', body:body({ username:$('username').value, password:$('password').value }) }); $('loginPanel').hidden = true; $('dashboard').hidden = false; message('Login successful.'); await refresh(); } catch(err) { alert(err.message); } });
$('logoutBtn').addEventListener('click', async () => { await api('/api/logout',{method:'POST'}); $('dashboard').hidden = true; $('loginPanel').hidden = false; });
$('bookForm').addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/books',{method:'POST',body:body({title:$('bookTitle').value,author:$('bookAuthor').value})}); e.target.reset(); message('Book added successfully.'); await loadBooks(); } catch(err){message(err.message);} });
$('studentForm').addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/students',{method:'POST',body:body({name:$('studentName').value,email:$('studentEmail').value})}); e.target.reset(); message('Student registered successfully.'); await loadStudents(); } catch(err){message(err.message);} });
$('issueForm').addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/issues',{method:'POST',body:body({bookId:$('issueBook').value,studentId:$('issueStudent').value,dueDate:$('dueDate').value})}); message('Book issued successfully.'); await refresh(); } catch(err){message(err.message);} });
$('search').addEventListener('input', () => loadBooks().catch(err=>message(err.message)));
$('booksBody').addEventListener('click', async e => { const id=e.target.dataset.id; if(!id)return; try { if(e.target.classList.contains('delete')) { if(confirm('Delete this book?')) await api('/api/books/'+id,{method:'DELETE'}); } else if(e.target.classList.contains('edit')) { const title=prompt('Enter updated book title'); if(title===null)return; const author=prompt('Enter updated author'); if(author===null)return; await api('/api/books/'+id,{method:'PUT',body:body({title,author})}); } await refresh(); } catch(err){message(err.message);} });
$('issuesBody').addEventListener('click', async e => { if(!e.target.classList.contains('return'))return; try { const result=await api('/api/issues/'+e.target.dataset.id+'/return',{method:'POST'}); message(`Book returned. Fine: ₹${result.fine}`); await refresh(); } catch(err){message(err.message);} });
