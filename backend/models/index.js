/**
 * Archivo de indice de los modelos 
 * Este archivo centraliza la importacion de los modelos a mongoose
 * permite importar multiples modelos de forma concisa en otros archivos
 */

const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Subcategory = require('./Subcategory');

// Exportar todos los modelos

module.exports = {
    User,
    Product,
    Category,
    Subcategory
};