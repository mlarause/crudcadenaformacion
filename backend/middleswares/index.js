/**
 * archivo indice de middlewares
 * centraliza la importacion de todos los middlewares de autenticacion y autorizacion
 * permite importar multiples middlewares de forma concisa en las rutas
 */

const authJWT = require('./authJwt');
const verifySignUp = require('./verifySignUp');

// exportar los middlewares agrupados or modulo

module.exports = {
    authJWT: require('./authJwt'),
    verifySignUp: require('./verifySignUp'),
    role: require('./role')
};