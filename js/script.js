/* script.js — prototipo cliente para ECO-TECH
   Funciones:
   - registrar residuos en localStorage
   - listar residuos en dashboard
   - asignar recolección (simulada)
   - generar certificado (descarga JSON)
   - mostrar centros de reciclaje de ejemplo
*/
(function () {
  // Keys
  const WASTES_KEY = 'ecotech_wastes_v1';
  const COLLECTIONS_KEY = 'ecotech_collections_v1';

  // Helpers
  function readWastes() {
    try {
      return JSON.parse(localStorage.getItem(WASTES_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function writeWastes(data) {
    localStorage.setItem(WASTES_KEY, JSON.stringify(data));
  }

  function readCollections() {
    try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function writeCollections(v) { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(v)); }

  function uid(prefix='id') {
    return prefix + '_' + Math.random().toString(36).slice(2,9);
  }

  // Register waste (from register.html)
  window.registerWaste = function (ev) {
    ev.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const type = document.getElementById('wasteType').value;
    const weight = parseFloat(document.getElementById('weightKg').value) || 0;
    const condition = document.getElementById('condition').value;
    const address = document.getElementById('pickupAddress').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!name || !email || !type || !address) {
      showMessage('Completa los campos obligatorios', 'error');
      return false;
    }

    const waste = {
      id: uid('w'),
      user: { name, email },
      type,
      weightKg: weight,
      condition,
      pickupPoint: { address },
      description,
      status: 'pendiente', // pendiente, asignado, en_transito, recibido, procesado
      createdAt: new Date().toISOString()
    };

    const list = readWastes();
    list.unshift(waste);
    writeWastes(list);

    // redirect to dashboard
    showMessage('Residuo registrado correctamente. Redirigiendo al panel...', 'success');
    setTimeout(()=> { window.location.href = 'dashboard.html'; }, 900);
    return false;
  };

  // show message small
  function showMessage(text, type='info') {
    const el = document.getElementById('message');
    if (!el) return;
    el.innerHTML = `<div class="card"><strong>${text}</strong></div>`;
    setTimeout(()=> el.innerHTML = '', 3000);
  }

  // Dashboard rendering
  function renderDashboard() {
    const container = document.getElementById('wastesList');
    if (!container) return;
    container.innerHTML = '';
    const wastes = readWastes();
    if (!wastes.length) {
      container.innerHTML = '<div class="card"><p>No hay residuos registrados aún. <a href="register.html">Registrar ahora</a></p></div>';
      return;
    }

    const tpl = document.getElementById('waste-card-tpl');
    wastes.forEach(w => {
      const node = tpl.content.cloneNode(true);
      node.querySelector('.waste-type').textContent = `${capitalize(w.type)} (${w.description ? w.description.slice(0,40) : ''})`;
      node.querySelector('.waste-user').textContent = w.user.name + ' — ' + w.user.email;
      node.querySelector('.waste-weight').textContent = (w.weightKg || 0).toFixed(2);
      node.querySelector('.waste-condition').textContent = translateCondition(w.condition);
      node.querySelector('.waste-status').textContent = translateStatus(w.status);

      // buttons
      const assignBtn = node.querySelector('.assign-btn');
      assignBtn.onclick = () => assignCollection(w.id);

      const certBtn = node.querySelector('.generate-cert-btn');
      certBtn.onclick = () => generateCertificate(w.id);

      const delBtn = node.querySelector('.delete-btn');
      delBtn.onclick = () => {
        if (!confirm('Eliminar este registro?')) return;
        const arr = readWastes().filter(x => x.id !== w.id);
        writeWastes(arr);
        renderDashboard();
      };

      container.appendChild(node);
    });
  }

  function translateCondition(c) {
    return { 'funciona':'Funciona', 'no_funciona':'No funciona', 'parcial':'Parcial' }[c] || c;
  }
  function translateStatus(s) {
    return { 'pendiente':'Pendiente', 'asignado':'Asignado', 'en_transito':'En tránsito', 'recibido':'Recibido', 'procesado':'Procesado' }[s] || s;
  }
  function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }

  // Assign collection (simulate)
  function assignCollection(wasteId) {
    const wastes = readWastes();
    const w = wastes.find(x => x.id === wasteId);
    if (!w) return alert('Residuo no encontrado');
    if (w.status !== 'pendiente') return alert('Ya fue asignado u otro estado.');

    // create collection record
    const collections = readCollections();
    const col = {
      id: uid('c'),
      wasteId: w.id,
      transporter: { id: 'trans_001', name: 'Transportadora Demo' },
      scheduledAt: new Date(Date.now() + 24*3600*1000).toISOString(),
      pickedAt: null,
      status: 'programada'
    };
    collections.unshift(col);
    writeCollections(collections);

    // update waste status
    w.status = 'asignado';
    writeWastes(wastes);
    alert('Recolección asignada. Ver panel de transportadores.');
    renderDashboard();
  }

  // Generate certificate (download JSON file as demo)
  function generateCertificate(wasteId) {
    const wastes = readWastes();
    const w = wastes.find(x => x.id === wasteId);
    if (!w) return alert('Residuo no encontrado');

    const cert = {
      certificateId: uid('cert'),
      wasteId: w.id,
      user: w.user,
      type: w.type,
      weightKg: w.weightKg,
      condition: w.condition,
      status: w.status,
      generatedAt: new Date().toISOString(),
      note: 'Certificado generado por prototipo ECO-TECH (no válido legalmente).'
    };

    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado_ecotech_${w.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Render transport collections page
  function renderCollectionsPage() {
    const container = document.getElementById('collectionsList');
    if (!container) return;
    const cols = readCollections();
    if (!cols.length) {
      container.innerHTML = '<div class="card"><p>No hay recolecciones programadas.</p></div>';
      return;
    }
    container.innerHTML = '';
    cols.forEach(c => {
      const card = document.createElement('div');
      card.className = 'card';
      const waste = readWastes().find(w => w.id === c.wasteId) || { type: 'N/D', user: { name: 'N/D' } };
      card.innerHTML = `
        <h4>Recolección: ${capitalize(waste.type)}</h4>
        <p><strong>Usuario:</strong> ${waste.user.name}</p>
        <p><strong>Transportador:</strong> ${c.transporter.name}</p>
        <p><strong>Programada:</strong> ${new Date(c.scheduledAt).toLocaleString()}</p>
        <div style="margin-top:10px;"><button class="btn" data-id="${c.id}">Marcar como recogida</button></div>
      `;
      const btn = card.querySelector('button');
      btn.onclick = () => {
        c.pickedAt = new Date().toISOString();
        c.status = 'recogida';
        writeCollections(cols);
        // update waste
        const wastes = readWastes();
        const w = wastes.find(x => x.id === c.wasteId);
        if (w) { w.status = 'en_transito'; writeWastes(wastes); }
        renderCollectionsPage();
        alert('Recolección marcada como recogida. Estado actualizado.');
      };
      container.appendChild(card);
    });
  }

  // Centers of recycling (demo)
  function renderCenters() {
    const centers = [
      { id:'rc_001', name:'ReciclaTech SAS', address:'Calle 10 # 5-20', certified:true },
      { id:'rc_002', name:'Centro Verde', address:'Av. Principal 123', certified:true },
      { id:'rc_003', name:'Gestiona E-Waste', address:'Carrera 34 # 12-45', certified:false }
    ];
    const el = document.getElementById('centersList');
    if (!el) return;
    el.innerHTML = centers.map(c => `<li class="card"><strong>${c.name}</strong><div>${c.address} ${c.certified ? '<span style="color:green">• Certificado</span>':''}</div></li>`).join('');
  }

  // Init on load: decide which page to render
  document.addEventListener('DOMContentLoaded', function () {
    renderDashboard();
    renderCollectionsPage();
    renderCenters();
  });

})();
