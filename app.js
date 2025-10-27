const btnsubmit = document.getElementById('savebtn');
const inputName = document.getElementById('name');
const inputEmail = document.getElementById('email');
const inputAge = document.getElementById('age');
const btnList = document.getElementById('listbtn');
const db = new PouchDB('personas');

btnsubmit.addEventListener('click', event => {
    event.preventDefault();

    const persona = {
        _id: new Date().toISOString(),
        name: inputName.value,
        age: inputAge.value,
        email: inputEmail.value,
        status:'pending'
    };
    db.put(persona)
        .then((response)=>{
            console.log(response);
            console.log('Data saved successfully:', response);
            inputName.value = '';
            inputEmail.value = '';
            inputAge.value = '';
        }).catch((error)=>{
            console.error('Error saving data:', error);
        });
});

// Listar usuarios
btnList.addEventListener('click', listarUsuarios);

async function listarUsuarios() {
  try {
    const result = await db.allDocs({ include_docs: true });
    userListContainer.innerHTML = ''; // Limpiar antes de mostrar

    if (result.rows.length === 0) {
      userListContainer.innerHTML = '<p class="text-center text-muted">No hay usuarios registrados.</p>';
      return;
    }

    result.rows.forEach((row) => {
      const user = row.doc;

      // Crear card visual
      const card = document.createElement('div');
      card.className = 'card mb-3';
      card.style.width = '90%';
      card.style.maxWidth = '400px';
      card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
      card.style.borderRadius = '10px';

      card.innerHTML = `
        <div class="card-body ${user.status === 'inactive' ? 'bg-light text-muted' : ''}">
          <h5 class="card-title">${user.name}</h5>
          <p class="card-text mb-1"> ${user.email}</p>
          <p class="card-text mb-2"> ${user.age} años</p>
          <span class="badge ${user.status === 'inactive' ? 'bg-secondary' : 'bg-success'}">${user.status}</span>
          <div class="mt-3 d-flex justify-content-around">
            ${
              user.status === 'active'
                ? `<button class="btn btn-danger btn-sm" onclick="cambiarEstado('${user._id}', 'inactive')">Eliminar</button>`
                : `<button class="btn btn-success btn-sm" onclick="cambiarEstado('${user._id}', 'active')">Reactivar</button>`
            }
          </div>
        </div>
      `;

      userListContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Error al obtener las personas:', err);
  }
}

// Cambiar estado del usuario (activo/inactivo)
async function cambiarEstado(id, nuevoEstado) {
  try {
    const user = await db.get(id);
    user.status = nuevoEstado;
    await db.put(user);
    listarUsuarios();
  } catch (err) {
    console.error('Error al actualizar el estado:', err);
  }
}

// Mostrar lista automáticamente al cargar
document.addEventListener('DOMContentLoaded', listarUsuarios);