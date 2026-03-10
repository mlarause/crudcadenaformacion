/**
 * Test Suite Completo para CRUD-Mongo API
 * Valida todos los endpoints según postman.md
 * Ejecutar: npm test o node test.js (requiere servidor corriendo en localhost:3000)
 */

const API_URL = 'http://localhost:3000/api'; // URL base del servidor; todas las peticiones se enviarán a este servidor
let token = null;         // Almacena el JWT del admin tras el login; se incluye en todas las peticiones autenticadas
let categoryId = null;    // Almacena el _id de la categoría creada durante las pruebas
let subcategoryId = null; // Almacena el _id de la subcategoría creada durante las pruebas
let productId = null;     // Almacena el _id del producto creado durante las pruebas
let userId = null;        // Almacena el _id del usuario creado durante las pruebas

// Utilidad para hacer requests
async function request(method, endpoint, body = null, headers = {}) { // Función reutilizable para hacer peticiones HTTP al API
  const options = { // Objeto de opciones que se pasa a fetch()
    method,          // Método HTTP: GET, POST, PUT, DELETE
    headers: {       // Headers de la petición
      'Content-Type': 'application/json', // Indica que el body es JSON
      ...headers     // Merge con headers adicionales que se pasen como parámetro
    }
  };

  if (body) options.body = JSON.stringify(body); // Si hay body, lo convierte a JSON string antes de enviarlo
  if (token) options.headers['Authorization'] = `Bearer ${token}`; // Si ya se tiene token, lo agrega automáticamente al header

  try { // Intenta hacer la petición HTTP; si falla (red caída, servidor apagado) lo captura el catch
    const response = await fetch(`${API_URL}${endpoint}`, options); // Envía la petición HTTP al servidor
    const data = await response.json(); // Convierte la respuesta JSON a objeto JavaScript
    return { status: response.status, data, ok: response.ok }; // Retorna código HTTP, datos y booleano de éxito
  } catch (error) { // Captura errores de red o si el servidor no está corriendo
    return { status: 0, data: { error: error.message }, ok: false }; // Retorna status 0 indicando error de conexión
  }
}

// Utilidad para logs bonitos
function log(test, status, details = '') { // Imprime el resultado de un test con ícono verde/rojo y nombre del test
  const icon = status ? '\u2705' : '\u274c';           // ✅ si pasó, ❌ si falló
  const color = status ? '\x1b[32m' : '\x1b[31m'; // Verde si pasó, rojo si falló (códigos ANSI de terminal)
  const reset = '\x1b[0m';                         // Resetea el color al valor por defecto
  console.log(`${icon} ${color}${test}${reset} ${details}`); // Imprime: icono + nombre del test (coloreado) + detalles
}

// Utilidad para ver errores
function error(endpoint, response) { // Imprime detalles del error si el test falló (mensaje y detalle técnico)
  if (response.data?.message) console.log(`   \u2514\u2500 Error: ${response.data.message}`); // Imprime el mensaje de error del API si existe
  if (response.data?.error) console.log(`   \u2514\u2500 Detalle: ${JSON.stringify(response.data.error)}`); // Imprime el detalle técnico del error si existe
}

// Suite de pruebas
async function runTests() { // Función principal que ejecuta todos los tests en orden
  const timestamp = Date.now(); // Genera un número único basado en la hora actual para evitar duplicados en username/nombre
  console.log('\n\ud83d\ude80 INICIANDO PRUEBAS DEL API CRUD-MONGO\n'); // Imprime encabezado de inicio de pruebas

  // ============= AUTENTICACIÓN =============
  console.log('📋 TEST 1: AUTENTICACIÓN');
  console.log('─────────────────────────────');

  // Login - Admin
  let res = await request('POST', '/auth/signin', { // Envía petición de login con credenciales de admin
    username: 'admin',      // Usuario admin creado con seedUsers.js
    password: 'admin123'    // Contraseña del admin
  });
  log('Login admin', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica que el login respondió 200 OK
  if (res.ok) { // Si el login fue exitoso
    token = res.data.token; // Guarda el JWT para usarlo en todas las peticiones siguientes
    log('Token obtenido', !!token, `Token: ${token?.substring(0, 20)}...`); // Verifica que el token no sea null/undefined
  }

  // Login fallido
  res = await request('POST', '/auth/signin', { // Envía petición de login con contraseña incorrecta
    username: 'admin',
    password: 'wrongpassword'  // Contraseña incorrecta para probar que el API la rechaza
  });
  log('Login fallido rechazado', !res.ok && res.status === 401, `(Status: ${res.status})`); // Verifica que el API retornó 401

  // ============= USUARIOS =============
  console.log('\n📋 TEST 2: USUARIOS');
  console.log('─────────────────────────────');

  // Listar usuarios
  res = await request('GET', '/users'); // Petición GET /api/users con el token del admin
  const usersArray = res.data?.data || res.data; // Extrae el array de usuarios (puede estar en res.data.data o en res.data)
  const usersOk = res.ok && res.status === 200 && Array.isArray(usersArray); // Verifica que la respuesta sea exitosa y contenga un array
  log('GET /users', usersOk, `(${Array.isArray(usersArray) ? usersArray.length : '?'} usuarios)`); // Imprime resultado con cantidad de usuarios
  if (!usersOk) error('/users', res); // Si falló, imprime detalles del error

  // Crear usuario
  const newUser = { // Datos del usuario de prueba con timestamp para evitar duplicados
    username: `testuser${timestamp}`, // Username único gracias al timestamp
    email: `test${timestamp}@example.com`, // Email único gracias al timestamp
    password: 'test123',  // Contraseña del usuario de prueba
    role: 'auxiliar'      // Rol menos privilegiado
  };
  res = await request('POST', '/users', newUser); // Petición POST /api/users con datos del nuevo usuario
  const userCreated = res.data?.data || res.data; // Extrae el usuario creado de la respuesta
  const userCreateOk = res.ok && res.status === 201; // Verifica que se recibió 201 Created
  log('POST /users (crear)', userCreateOk, `(Status: ${res.status})`); // Imprime resultado del test
  if (!userCreateOk) error('/users POST', res); // Si falló, imprime detalles del error
  if (userCreated?._id) userId = userCreated._id; // Guarda el _id para usarlo en tests de GET, PUT y DELETE

  // Obtener usuario por ID
  if (userId) { // Solo ejecuta si el usuario fue creado exitosamente
    res = await request('GET', `/users/${userId}`); // Petición GET /api/users/:id
    const userData = res.data?.data || res.data;   // Extrae el usuario de la respuesta
    const userFound = res.ok && res.status === 200 && userData?._id; // Verifica que se recibió 200 OK y hay datos
    log('GET /users/:id', userFound, `(ID: ${userId.substring(0, 8)}...)`); // Imprime resultado con primeros 8 chars del ID
    if (!userFound) error(`/users/${userId}`, res); // Si falló, imprime detalles del error
  }

  // Actualizar usuario
  if (userId) { // Solo ejecuta si el usuario fue creado exitosamente
    res = await request('PUT', `/users/${userId}`, { email: 'updated@example.com' }); // Petición PUT para cambiar el email
    log('PUT /users/:id (actualizar)', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica que se recibió 200 OK
  }

  // ============= CATEGORÍAS =============
  console.log('\n📋 TEST 3: CATEGORÍAS');
  console.log('─────────────────────────────');

  // Listar categorías
  res = await request('GET', '/categories'); // Petición GET /api/categories (endpoint público, sin token necesario)
  const catsArray = res.data?.data || res.data; // Extrae el array de categorías de la respuesta
  const catsOk = res.ok && res.status === 200 && Array.isArray(catsArray); // Verifica que la respuesta sea exitosa y contenga un array
  log('GET /categories', catsOk, `(${Array.isArray(catsArray) ? catsArray.length : '?'} categorías)`); // Imprime resultado con cantidad
  if (!catsOk) error('/categories', res); // Si falló, imprime detalles del error

  // Crear categoría
  const newCategory = { // Datos de la categoría de prueba con timestamp para evitar duplicados
    name: `Test Category ${timestamp}`,  // Nombre único gracias al timestamp
    description: 'Categoría de prueba'  // Descripción de la categoría
  };
  res = await request('POST', '/categories', newCategory); // Petición POST /api/categories con token de admin
  const catCreated = res.data?.data || res.data; // Extrae la categoría creada de la respuesta
  const catCreateOk = res.ok && res.status === 201; // Verifica que se recibió 201 Created
  log('POST /categories (crear)', catCreateOk, `(Status: ${res.status})`); // Imprime resultado del test
  if (!catCreateOk) error('/categories POST', res); // Si falló, imprime detalles del error
  if (catCreated?._id) categoryId = catCreated._id; // Guarda el _id para usarlo en tests de subcategorías, productos y DELETE

  // Obtener categoría por ID
  if (categoryId) { // Solo ejecuta si la categoría fue creada exitosamente
    res = await request('GET', `/categories/${categoryId}`); // Petición GET /api/categories/:id
    const catData = res.data?.data || res.data;             // Extrae la categoría de la respuesta
    const catFound = res.ok && res.status === 200 && catData?._id; // Verifica que hay datos y status 200
    log('GET /categories/:id', catFound, `(ID: ${categoryId.substring(0, 8)}...)`); // Imprime resultado
    if (!catFound) error(`/categories/${categoryId}`, res); // Si falló, imprime detalles del error
  }

  // Actualizar categoría
  if (categoryId) { // Solo ejecuta si la categoría fue creada exitosamente
    res = await request('PUT', `/categories/${categoryId}`, { name: `Updated Category ${timestamp}` }); // Petición PUT para cambiar el nombre
    log('PUT /categories/:id (actualizar)', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica 200 OK
  }

  // ============= SUBCATEGORÍAS =============
  console.log('\n📋 TEST 4: SUBCATEGORÍAS');
  console.log('─────────────────────────────');

  // Listar subcategorías
  res = await request('GET', '/subcategories'); // Petición GET /api/subcategories (endpoint público)
  const subcatsArray = res.data?.data || res.data; // Extrae el array de subcategorías de la respuesta
  const subcatsOk = res.ok && res.status === 200 && Array.isArray(subcatsArray); // Verifica respuesta exitosa con array
  log('GET /subcategories', subcatsOk, `(${Array.isArray(subcatsArray) ? subcatsArray.length : '?'} subcategorías)`); // Imprime resultado
  if (!subcatsOk) error('/subcategories', res); // Si falló, imprime detalles del error

  // Crear subcategoría
  const newSubcategory = { // Datos de la subcategoría de prueba con timestamp para evitar duplicados
    name: `Test Subcategory ${timestamp}`,       // Nombre único
    description: 'Subcategoría de prueba',       // Descripción
    category: categoryId || '000000000000000000000001' // ID de la categoría padre (creada antes); valor fallback si no existe
  };
  res = await request('POST', '/subcategories', newSubcategory); // Petición POST /api/subcategories con token de admin
  const subcatCreated = res.data?.data || res.data; // Extrae la subcategoría creada de la respuesta
  const subCreateOk = res.ok && res.status === 201; // Verifica que se recibió 201 Created
  log('POST /subcategories (crear)', subCreateOk, `(Status: ${res.status})`); // Imprime resultado del test
  if (!subCreateOk) error('/subcategories POST', res); // Si falló, imprime detalles del error
  if (subcatCreated?._id) subcategoryId = subcatCreated._id; // Guarda el _id para tests siguientes

  // Obtener subcategoría por ID
  if (subcategoryId) { // Solo ejecuta si la subcategoría fue creada exitosamente
    res = await request('GET', `/subcategories/${subcategoryId}`); // Petición GET /api/subcategories/:id
    const subcatData = res.data?.data || res.data;               // Extrae la subcategoría de la respuesta
    const subcatFound = res.ok && res.status === 200 && subcatData?._id; // Verifica datos y status 200
    log('GET /subcategories/:id', subcatFound, `(ID: ${subcategoryId.substring(0, 8)}...)`); // Imprime resultado
    if (!subcatFound) error(`/subcategories/${subcategoryId}`, res); // Si falló, imprime detalles
  }

  // Actualizar subcategoría
  if (subcategoryId) { // Solo ejecuta si la subcategoría fue creada exitosamente
    res = await request('PUT', `/subcategories/${subcategoryId}`, { name: `Updated Subcategory ${timestamp}` }); // Petición PUT para cambiar nombre
    log('PUT /subcategories/:id (actualizar)', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica 200 OK
  }

  // ============= PRODUCTOS =============
  console.log('\n📋 TEST 5: PRODUCTOS');
  console.log('─────────────────────────────');

  // Listar productos
  res = await request('GET', '/products'); // Petición GET /api/products con token (requiere autenticación)
  const prodsArray = res.data?.data || res.data; // Extrae el array de productos de la respuesta
  const prodsOk = res.ok && res.status === 200 && Array.isArray(prodsArray); // Verifica respuesta exitosa con array
  log('GET /products', prodsOk, `(${Array.isArray(prodsArray) ? prodsArray.length : '?'} productos)`); // Imprime resultado
  if (!prodsOk) error('/products', res); // Si falló, imprime detalles del error

  // Crear producto
  const newProduct = { // Datos del producto de prueba con timestamp para evitar duplicados
    name: `Test Product ${timestamp}`,   // Nombre único
    description: 'Producto de prueba',   // Descripción
    price: 99.99,                        // Precio de prueba (positivo, válido)
    stock: 10,                           // Stock de prueba (positivo, válido)
    category: categoryId || '000000000000000000000001',    // ID de la categoría creada; fallback si no existe
    subcategory: subcategoryId || '000000000000000000000001' // ID de la subcategoría creada; fallback si no existe
  };
  res = await request('POST', '/products', newProduct); // Petición POST /api/products con token de admin
  const prodCreated = res.data?.data || res.data; // Extrae el producto creado de la respuesta
  const prodCreateOk = res.ok && res.status === 201; // Verifica que se recibió 201 Created
  log('POST /products (crear)', prodCreateOk, `(Status: ${res.status})`); // Imprime resultado del test
  if (!prodCreateOk) error('/products POST', res); // Si falló, imprime detalles del error
  if (prodCreated?._id) productId = prodCreated._id; // Guarda el _id para tests siguientes

  // Obtener producto por ID
  if (productId) { // Solo ejecuta si el producto fue creado exitosamente
    res = await request('GET', `/products/${productId}`); // Petición GET /api/products/:id con token
    const prodData = res.data?.data || res.data;         // Extrae el producto de la respuesta
    const prodFound = res.ok && res.status === 200 && prodData?._id; // Verifica datos y status 200
    log('GET /products/:id', prodFound, `(ID: ${productId.substring(0, 8)}...)`); // Imprime resultado
    if (!prodFound) error(`/products/${productId}`, res); // Si falló, imprime detalles
  }

  // Actualizar producto
  if (productId) { // Solo ejecuta si el producto fue creado exitosamente
    res = await request('PUT', `/products/${productId}`, { price: 89.99, stock: 8 }); // Petición PUT para cambiar precio y stock
    log('PUT /products/:id (actualizar)', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica 200 OK
  }

  // ============= ESTADÍSTICAS =============
  console.log('\n📋 TEST 6: ESTADÍSTICAS');
  console.log('─────────────────────────────');

  res = await request('GET', '/statistics'); // Petición GET /api/statistics para obtener conteos de todas las colecciones
  log('GET /statistics', res.ok && res.status === 200 && res.data?.totalProducts !== undefined, `(Status: ${res.status})`); // Verifica 200 y que exista el campo totalProducts
  if (res.ok) { // Si la petición fue exitosa
    console.log(`   Productos: ${res.data.totalProducts}, Categorías: ${res.data.totalCategories}, Usuarios: ${res.data.totalUsers}`); // Imprime los totales principales
  }

  // ============= TEST 7: DESACTIVACIÓN (Soft Delete con Cascadas) =============
  console.log('\n📋 TEST 7: DESACTIVACIÓN (Soft Delete con Cascadas)');
  console.log('─────────────────────────────');

  // Desactivar producto
  if (productId) { // Solo ejecuta si el producto existe
    res = await request('DELETE', `/products/${productId}`); // Petición DELETE /api/products/:id (sin ?hardDelete=true → soft delete)
    log('DELETE /products/:id (desactivar)', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica 200 OK
    if (res.ok) { // Si la desactivación fue exitosa
      const prodData = res.data?.data || res.data; // Extrae el producto desactivado de la respuesta
      console.log(`   \u2514\u2500 Producto desactivado (active=${prodData?.active})`); // Imprime el nuevo valor del campo active
    }
  }

  // Desactivar subcategoría (cascada a productos)
  if (subcategoryId) { // Solo ejecuta si la subcategoría existe
    res = await request('DELETE', `/subcategories/${subcategoryId}`); // Petición DELETE /api/subcategories/:id (soft delete con cascada)
    const subDeleteOk = res.ok && res.status === 200; // Verifica que la respuesta fue exitosa
    log('DELETE /subcategories/:id (cascada)', subDeleteOk, `(Status: ${res.status})`); // Imprime resultado del test
    if (res.ok) { // Si la desactivación fue exitosa
      const subData = res.data?.data; // Extrae los datos de la respuesta
      if (subData?.productsDeactivated !== undefined) { // Si la respuesta incluye conteo de productos afectados
        console.log(`   \u2514\u2500 Subcategoría desactivada, productos desactivados: ${subData.productsDeactivated}`); // Muestra cuantos productos se desactivaron en cascada
      } else { // Si no incluye el conteo, muestra el estado de la subcategoría
        console.log(`   \u2514\u2500 Subcategoría desactivada (active=${subData?.subcategory?.active})`);
      }
    }
  }

  // Desactivar categoría (cascada a subcategorías y productos)
  if (categoryId) { // Solo ejecuta si la categoría existe
    res = await request('DELETE', `/categories/${categoryId}`); // Petición DELETE /api/categories/:id (soft delete con cascada doble)
    const catDeleteOk = res.ok && res.status === 200; // Verifica que la respuesta fue exitosa
    log('DELETE /categories/:id (cascada)', catDeleteOk, `(Status: ${res.status})`); // Imprime resultado del test
    if (res.ok) { // Si la desactivación fue exitosa
      const catData = res.data?.data; // Extrae los datos con conteos de cascada de la respuesta
      console.log(`   \u2514\u2500 Categoría desactivada`); // Confirma que la categoría se desactivó
      console.log(`   \u2514\u2500 Subcategorías afectadas: ${catData?.subcategoriesDeactivated || 0}`); // Muestra cuantas subcategorías se desactivaron
      console.log(`   \u2514\u2500 Productos afectados: ${catData?.productsDeactivated || 0}`); // Muestra cuantos productos se desactivaron
    }
  }

  // Desactivar usuario
  if (userId) { // Solo ejecuta si el usuario existe
    res = await request('DELETE', `/users/${userId}`); // Petición DELETE /api/users/:id (soft delete por defecto)
    log('DELETE /users/:id (desactivar)', res.ok && res.status === 200, `(Status: ${res.status})`); // Verifica 200 OK
    if (res.ok) { // Si la desactivación fue exitosa
      const userData = res.data?.data || res.data; // Extrae el usuario desactivado de la respuesta
      console.log(`   \u2514\u2500 Usuario desactivado (active=${userData?.active})`); // Imprime el nuevo valor del campo active
    }
  }

  // ============= RESUMEN =============
  console.log('\n\u2705 PRUEBAS COMPLETADAS\n'); // Imprime mensaje final indicando que todas las pruebas terminaron
}

// Ejecutar tests
runTests().catch(err => { // Ejecuta la suite de tests; si lanza error no capturado lo maneja el callback
  console.error('Error en las pruebas:', err); // Imprime el error en consola
  process.exit(1); // Termina el proceso con código de error 1
});
