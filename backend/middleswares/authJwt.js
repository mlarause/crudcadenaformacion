/**
 * MIDDLEWARE DE VERIFICACION JWT
 * middleware para verificar y validar tokens JWT en las solicitudes 
 * se usa en todas las rutas protegidas para autenticar usuarios
 * caracteristicas:
 * soporta dos formatos de token
 * 1 Authorization: Bearer <token> (Estandar REST)
 * 2 x-access-token (header personalizado)
 * extrae informacion del token (id role email)
 * la adjunta a req.userId req.userRole, req.userEmail para uso en los controladores
 * manejo de errores con codigos 403/401 apropiados
 * flujo:
 * 1. lee el header Authorization o x-access-token
 * 2. Extrae el token (quita el Bearer si es necesario)
 * 3. verifica el token con JWT_SECRET
 * 4. si es valido continua al siguiente middleware
 * 5. si es invalido retorna 401 Unauthorized
 * 6 si falta retorna 403 Forbidden
 * 
 * Validacio del token
 * 1. verifica firma criptografica con JWT_SECRET
 * 2. comprueba que no haya expirado
 * 3. Extrae payload {id, role, email}
 */
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
 
/**
 * Verificar token
 * funcionalidad
 * busca el token en las ubicaciones posibles (orden de procedencia)
 * 1. header Authorization con formato Bearer <token>
 * 2. header x-access-token 
 * si encuentra el token verifica su validez 
 * si no encuentra retorna 403 Forbidden
 * si token es invalido/ expirado retorna 401 Unauthorized
 * si es valido  adjunta datos del usuario a req y continua
 * 
 * Headers soportados:
 * 1. Authorization bearer <shdskdfklHhsdndJJsfdb...>
 * 2. x-access-token: <dhdujfnGsnjdndmj..> id, role, email
 * propiedades del request despues del middleware:
 * req.userId = (string) Id del usuario MongoDB
 * req.userRole = (string) rol del usuario (admin, coordinador, auxiliar)
 * req.userEmail = (string) email del usuario
 */
const verifyTokenFn = (req, res, next) => {
    try {
        // soportar dos formatos Authorization bearer o access-token
        let token = null;

        // fomato Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // Extraer token quitando el Beader 
            token = req.headers.authorization.substring(7);
        }

        // formato access-token
        else if (req.headers['x-access-token']) {
            token = req.headers['x-access-token'];
        }

        // si no encontro token rechaza la solicitud
        if (!token) {
            return res.status(403).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        //verificar el token con la clave secreta
        const decoded = jwt.verify(token, config.secret);

        // adjuntar informacion del usuario al request object para que otros middlewares y rutas puedan acceder a ella 
        req.userId = decoded.id;// id de mongoDb
        req.userRole = decoded.role; //Rol de usuario
        req.userEmail = decoded.email;// email de usuario

        // token es valido continuar siguiente middleware o ruta 
        next();
    } catch (error) {
        //n token invalido o expirado
        return res.status(401).json({
            success: false,
            message: 'Token inavalido o expirado',
            error: error.message
        })
    }
};

/**
 * Vaidacion de funcion para mejor seguridad y manejo de errores
 * verificar que verifyTokenFn sea una funcion valida 
 * esto es una vlidacion de seguridad para que le middleware se exporte correctamente
 * si algo sale mal en su definicion lanzara un error en tiempo de carga del modulo
 */
if (typeof verifyTokenFn !== 'function') {
    console.error('Error: verifyTokenFn no es una funcion valida');
    throw new Error('verifyTokenFn debe ser una funcion');
}
//exportar el middleware
module.exports = {
    verifyTokenFn: verifyTokenFn
};