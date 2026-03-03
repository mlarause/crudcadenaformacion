/**
 * Modulo de conexion a la base de datos MongoDB
 * 
 * Este archivo meneja la conexion de la base de datosa mongodb utilizando Mongoose 
 * establece la conexion con la base de datos
 * configura las opciones de conexion 
 * maneja los errores de conexion
 * Exporta la funcion connectDB para usarla en server.js
 */

const mongoose = require('mongoose');
const { DB_URI } = process.env;

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('ok MongoDB conectado')
    } catch (error) {
        console.error('X Error de conexion a MongoDB:', error.message);
        process.exit(1)
    }
};
module.exports = connectDB;