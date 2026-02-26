/**
 * MIDDLEWARE: Autenticacion JWT
 * 
 * Verifica que el usuario tenga un token valido y carga los datos del usuario en req.user
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Autenticar usuario
 * valida el token Bearer en el haeder Authorization
 * si es valido carga el usuario en req.user
 * si no es valido o no existe retorna 401 Unauthorized
 */

exports.authenticate = async (req, res, next) => {
    try {
        // Extraer el token del header Bearer <token>
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // si no hay token rechaza la solicitud 
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticacion requerido',
                details: 'Incluye Authorization Bearer <token>'
            });
        }

        //Verificar y decodificar el token 
        const decoded = jwt.verify(token, process.env.JWR_SECRET);

        // Buscar el usuario en la base de datos
        const user = await User.findById(decoded.id);

        //Si el usuario no existe 
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o ha sido eliminado',
            })
        }

        // cargar el usuario en el request para usar en los suguientes middlewares o controladores 

        req.user = user;

        // LLamar el siguiente middleware o controller

        next();
    } catch (error) {
        // token invalido o error en la verificacion
        let message = 'Token invalido o expirado';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expirado, Por favor inicia sesion de nuevo nuevamente';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token invalido o mal formado';
        }

        return res.status(401).json({
            success: false,
            message: message,
            error: error.message
        });
    }
};

/**
 * middleware para autorizar por rol
 * Verifica que el usuario tiene uno de los roles requeridos se usa despues del middleware authenticate
 * @param {Array} roles - array de roles permitidos
 * @return {Function} Middleware function
 * 
 * uso: app.delete('/api/products/:id', authenticate, authorize (['admin']))
 */
exports.authorize = (roles) => {
    return (req, res, next) => {
        // Verificar si el rol del usuario esta en la lista de roles permitidos 
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes autorizacion para esta accion',
                requiredRoles: roles,
                currentRole: req.user.role,
                details: `Tu rol es "${req.user.role}" pero se requiere uno de: ${roles.join(', ')}`
            });
        }
        // si el usuario tiene permiso continuar
        next();
    };
};