document.addEventListener('DOMContentLoaded', () => {
  // DB
  const db = new PouchDB('personas');

  // Elementos del DOM
  const btnsubmit = document.getElementById('savebtn');
  const inputName = document.getElementById('name');
  const inputEmail = document.getElementById('email');
  const inputAge = document.getElementById('age');
  const btnList = document.getElementById('listbtn');
  const userListContainer = document.getElementById('userListContainer');

  // Guardar
  btnsubmit.addEventListener('click', async (event) => {
    event.preventDefault();

    const persona = {
      _id: new Date().toISOString(),
      name: inputName.value.trim(),
      age: inputAge.value.trim(),
      email: inputEmail.value.trim(),
      status: 'pending'
    };

    try {
      const response = await db.put(persona);
      console.log('Data saved successfully:', response);

      // Limpia campos
      inputName.value = '';
      inputEmail.value = '';
      inputAge.value = '';

      // Feedback
      const msg = document.getElementById('mensaje-resultado');
      if (msg) {
        msg.textContent = '✅ Usuario guardado';
        setTimeout(() => (msg.textContent = ''), 2000);
      }

      // Refresca lista
      listarUsuarios();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  });

  // Listar usuarios
  btnList.addEventListener('click', (e) => {
    e.preventDefault();
    listarUsuarios();
  });

  async function listarUsuarios() {
    try {
      const result = await db.allDocs({ include_docs: true });

      // Limpia contenedor
      userListContainer.innerHTML = `
        <h4 class="text-center mb-3">Lista de usuarios</h4>
        <div id="userList" class="row justify-content-center"></div>
      `;
      const list = document.getElementById('userList');

      if (!result.rows.length) {
        list.innerHTML = '<p class="text-center text-muted">No hay usuarios registrados.</p>';
        return;
      }

      result.rows.forEach(({ doc: user }) => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.style.maxWidth = '420px';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
        card.style.borderRadius = '10px';

        card.innerHTML = `
          <div class="card-body ${user.status === 'inactive' ? 'bg-light text-muted' : ''}">
            <h5 class="card-title mb-1">${user.name || '(sin nombre)'}</h5>
            <p class="card-text mb-1">${user.email || ''}</p>
            <p class="card-text mb-2">${user.age ? `${user.age} años` : ''}</p>
            <span class="badge ${user.status === 'inactive' ? 'bg-secondary' : 'bg-success'}">
              ${user.status}
            </span>
            <div class="mt-3 d-flex justify-content-around">
              ${
                user.status === 'active'
                  ? `<button class="btn btn-danger btn-sm" onclick="cambiarEstado('${user._id}', 'inactive')">Eliminar</button>`
                  : `<button class="btn btn-success btn-sm" onclick="cambiarEstado('${user._id}', 'active')">Reactivar</button>`
              }
            </div>
          </div>
        `;

        list.appendChild(card);
      });
    } catch (err) {
      console.error('Error al obtener las personas:', err);
    }
  }

  // Cambiar estado del usuario (activo/inactivo) — se expone globalmente
  window.cambiarEstado = async function (id, nuevoEstado) {
    try {
      const user = await db.get(id);
      user.status = nuevoEstado;
      await db.put(user);
      listarUsuarios();
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
    }
  };

  // Mostrar lista automáticamente al cargar
  listarUsuarios();
});
