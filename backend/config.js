/**
 * Archivo de configuracion central del backend,
 * Este archivo centraliza todas las configuraciones preincipales de la aplicaccion
 * configuracion de JWT tokens de autenticacion
 * consfiguracion de conexion a MongoDB
 * definicion de roles del sistema 
 * 
 * Las varibles de entorno tienen prioridad sobre los valores por defecto
 */

module.exports = {
    // configuracion de jwt
    SECRET: process.env.JWT_SECRET || 'tusecretoparalostokens',
    TOKEN_EXPRIATION: process.env.JWT_EXPIRATION || '24h',

    //configuracion de base de datos
    DB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/crud-mongocf',
    DB: {
        URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/crud-mongocf',
        OPTIONS: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    },

    // Roles del sistema
    ROLES: {
        ADMIN: 'admin',
        COORDINADOR: 'coordinador',
        AUXILIAR: 'auxiliar'
    }
};

