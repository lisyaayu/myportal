const $ = id => document.getElementById(id);
let tasks = JSON.parse(localStorage.getItem('tugas') || '[]');
const save = () => localStorage.setItem('tugas', JSON.stringify(tasks));
const prio = {Tinggi: 3, Sedang: 2, Rendah: 1};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => new Date(d).toLocaleString('id-ID', {weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});
const isLate = t => !t.done && new Date(t.deadline) < new Date();

function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }

function sisa(d){
  const ms = new Date(d) - new Date();
  const h = Math.floor(ms / 36e5), hari = Math.floor(h / 24);
  if (ms < 0) return 'sudah lewat';
  return hari > 0 ? `${hari} hari lagi` : `${h} jam lagi`;
}

function render(){
  const total = tasks.length, done = tasks.filter(t => t.done).length, late = tasks.filter(isLate).length;
  $('sTotal').textContent = total; $('sDone').textContent = done;
  $('sTodo').textContent = total - done; $('sLate').textContent = late;
  const p = total ? Math.round(done / total * 100) : 0;
  $('bar').style.width = p + '%'; $('pct').textContent = p + '% tugas selesai';

  const nxt = tasks.filter(t => !t.done && new Date(t.deadline) > new Date()).sort((a,b) => new Date(a.deadline) - new Date(b.deadline))[0];
  $('next').hidden = !nxt;
  if (nxt) $('next').innerHTML = `<b>Deadline terdekat:</b> ${esc(nxt.judul)} (${esc(nxt.mk)}), ${sisa(nxt.deadline)}`;

  const q = $('cari').value.toLowerCase(), st = $('fStatus').value, urut = $('fUrut').value;
  let list = tasks.filter(t => (t.judul + t.mk).toLowerCase().includes(q) &&
    (st === 'semua' || (st === 'done' && t.done) || (st === 'todo' && !t.done) || (st === 'late' && isLate(t))));
  list.sort((a, b) => urut === 'prioritas' ? prio[b.prioritas] - prio[a.prioritas]
    : urut === 'baru' ? b.id - a.id : new Date(a.deadline) - new Date(b.deadline));

  $('empty').hidden = list.length > 0;
  $('list').innerHTML = list.map(t => `
    <li class="item ${t.done ? 'done' : ''} ${isLate(t) ? 'late' : ''}">
      <input type="checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}" aria-label="Tandai selesai">
      <div>
        <span class="mk">${esc(t.mk)}</span>
        <h3>${esc(t.judul)}<span class="tag ${t.prioritas}">${t.prioritas}</span>${isLate(t) ? '<span class="tag late">Terlambat</span>' : ''}</h3>
        <p class="meta">Deadline: ${fmt(t.deadline)} (${t.done ? 'sudah dikumpul' : sisa(t.deadline)})</p>
        ${t.catatan ? `<p class="note">${esc(t.catatan)}</p>` : ''}
      </div>
      <div class="acts">
        ${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">Buka link</a>` : ''}
        <button class="del" data-del="${t.id}">Hapus</button>
      </div>
    </li>`).join('');
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  tasks.push({id: Date.now(), mk: $('mk').value.trim(), judul: $('judul').value.trim(), deadline: $('deadline').value,
    prioritas: $('prioritas').value, link: $('link').value.trim(), catatan: $('catatan').value.trim(), done: false});
  save(); e.target.reset(); $('prioritas').value = 'Sedang'; render(); toast('Tugas disimpan');
});

$('list').addEventListener('click', e => {
  const id = +(e.target.dataset.id || e.target.dataset.del);
  if (e.target.dataset.id) { const t = tasks.find(x => x.id === id); t.done = e.target.checked; save(); render(); toast(t.done ? 'Tugas selesai 🎉' : 'Tugas dibuka lagi'); }
  if (e.target.dataset.del && confirm('Hapus tugas ini?')) { tasks = tasks.filter(x => x.id !== id); save(); render(); toast('Tugas dihapus'); }
});

['cari', 'fStatus', 'fUrut'].forEach(i => $(i).addEventListener('input', render));
$('hapusSemua').onclick = () => { if (confirm('Hapus semua data tugas?')) { tasks = []; save(); render(); } };

$('nama').textContent = localStorage.getItem('nama') || 'Mahasiswa';
$('nama').addEventListener('blur', () => localStorage.setItem('nama', $('nama').textContent.trim() || 'Mahasiswa'));
$('tanggal').textContent = new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
render(); setInterval(render, 60000);
