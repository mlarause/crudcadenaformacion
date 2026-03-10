// Script para poblar categorías, subcategorías y productos con relaciones
// Ejecutar con: node seedData.js (desde la carpeta backend)

// mongoose → librería ODM para conectar Node.js con MongoDB
const mongoose = require('mongoose');

// dbConfig → contiene la URL de conexión a MongoDB
// Archivo: backend/config/db.js
const dbConfig = require('./config/db');

// Modelos → cada uno representa una colección en MongoDB
// Archivos: backend/models/Category.js, Subcategory.js, Product.js
const Category = require('./models/Category');
const Subcategory = require('./models/Subcategory');
const Product = require('./models/Product');

async function seedData() { // Función async que inserta datos de ejemplo en la BD
  await mongoose.connect(dbConfig.url, { useNewUrlParser: true, useUnifiedTopology: true }); // Conecta a MongoDB usando la URL de dbConfig

  // Limpiar datos previos
  await Product.deleteMany({}); // Elimina TODOS los productos existentes (tabla limpia antes de insertar)
  await Subcategory.deleteMany({}); // Elimina TODAS las subcategorías existentes
  await Category.deleteMany({}); // Elimina TODAS las categorías existentes

  // Crear categorías
  const categories = await Category.insertMany([ // Inserta múltiples categorías en un solo comando; retorna array con los documentos creados (incluye sus _id)
    { name: 'Electrónica', description: 'Dispositivos electrónicos' }, // Categoría 0: categories[0]
    { name: 'Ropa', description: 'Prendas de vestir' },                  // Categoría 1: categories[1]
    { name: 'Hogar', description: 'Artículos para el hogar' }           // Categoría 2: categories[2]
  ]);

  // Crear subcategorías
  const subcategories = await Subcategory.insertMany([ // Inserta subcategorías referenciando los _id de las categorías creadas arriba
    { name: 'Celulares', description: 'Subcategoría de celulares', category: categories[0]._id }, // Hijo de Electrónica; subcategories[0]
    { name: 'Laptops', description: 'Subcategoría de laptops', category: categories[0]._id },    // Hijo de Electrónica; subcategories[1]
    { name: 'Camisetas', description: 'Subcategoría de camisetas', category: categories[1]._id }, // Hijo de Ropa; subcategories[2]
    { name: 'Pantalones', description: 'Subcategoría de pantalones', category: categories[1]._id }, // Hijo de Ropa; subcategories[3]
    { name: 'Cocina', description: 'Subcategoría de cocina', category: categories[2]._id },       // Hijo de Hogar; subcategories[4]
    { name: 'Decoración', description: 'Subcategoría de decoración', category: categories[2]._id } // Hijo de Hogar; subcategories[5]
  ]);

  // Crear productos
  await Product.insertMany([ // Inserta productos referenciando los _id de categorías y subcategorías creadas
    { name: 'iPhone 14', description: 'Smartphone Apple', price: 1200, stock: 10, subcategory: subcategories[0]._id, category: categories[0]._id }, // Celular de Electrónica
    { name: 'Samsung Galaxy S23', description: 'Smartphone Samsung', price: 1000, stock: 15, subcategory: subcategories[0]._id, category: categories[0]._id }, // Celular de Electrónica
    { name: 'MacBook Pro', description: 'Laptop Apple', price: 2500, stock: 5, subcategory: subcategories[1]._id, category: categories[0]._id }, // Laptop de Electrónica
    { name: 'Camiseta básica', description: 'Camiseta de algodón', price: 20, stock: 50, subcategory: subcategories[2]._id, category: categories[1]._id }, // Camiseta de Ropa
    { name: 'Pantalón jeans', description: 'Pantalón de mezclilla', price: 40, stock: 30, subcategory: subcategories[3]._id, category: categories[1]._id }, // Pantalón de Ropa
    { name: 'Sartén antiadherente', description: 'Para cocina', price: 30, stock: 20, subcategory: subcategories[4]._id, category: categories[2]._id }, // Cocina de Hogar
    { name: 'Florero decorativo', description: 'Para sala', price: 25, stock: 25, subcategory: subcategories[5]._id, category: categories[2]._id } // Decoración de Hogar
  ]);

  console.log('Datos de ejemplo insertados correctamente.'); // Confirma en consola que todos los datos se insertaron
  mongoose.connection.close(); // Cierra la conexión a MongoDB para liberar recursos
}

seedData().catch(err => { // Ejecuta la función; si lanza error lo captura el callback
  console.error(err);           // Imprime el error en consola
  mongoose.connection.close();  // Cierra la conexión incluso si hubo error
});
