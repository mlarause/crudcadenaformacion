/**
 * middleware de validacion de signup
 * 
 * middleware paera validar datos durante el proceso de resgistro de nuevos usuarios
 * se ejecuta en la ruta post /api/auth/sinup Despues de verificar el token
 * Validaciones:
 * 1. checkDuplicateUsernameOrEmail: vreifica inicidad del usernamey email
 * 2. checkRolesExisted: valida que el rol solicitado sea valido 
 * 
 * Flujo de signup:
 * 1. cliente envia post /api/auth/signup con datos
 * 2. verifyToken confirma que usuario atenticado admin
 * 3. checkRole('admin') verifica que es admin
 * 4. checkDuplicateUsernameOrEmail valida unicidad 
 * 5. checkRolesExisted valida rol
 * 6. authController.signup crea usuario si todo el valido
 * 
 * Errores retornados:
 * 400 Username / email duplicado o rol invalido
 * 500 error de base de datos
 */

const User = require('../models/User');

/**
 * Vericar que username y email sean unicos
 * validaciones
 * username no debe existir en la basde de datos
 * email no debe existir en la base datos
 * ambos campos debe estar presente en el request
 * 
 * Busqueda: usa MOngoDB $or para verificar ambas condiciones en una sola query
 * @param {Object} req request object con req.body{username, email}
 * @param {Object} res response object para enviar errores
 * @param {Function} next Callback al siguiente middleware
 * 
 * respuestas:
 * 400 si username/email falta o ya existe
 * 500 error de base de datos
 * next() si la validacion pasa 
 */

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // validar que ambos campos estan presentes
        if (!req.body.username || !req.body.email) {
            return res.status(400).json({
                message: 'Username y email don requeridos'
            });
        }

        // Buscar usuario existente con igual username o email
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        }) .exec();

        // si encuentra un usuario retornar error 
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'Username o email ya existente'
            });
        }

        // no hay duplicados continuar 
        next();
    } catch (err) {
        console.error('[verifySignUp] Error en checkDuplicateUsernameOrEmail:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar credenciales',
            error: err.message
        });
    }
};

/**
 * MIDDLEWARE verificar que el rol solicitado sea valido 
 * roles validos en sistema:
 * admin: Administrador total
 * coordibador: Gestor de datos
 * auxiliar usuario basico
 * caracteristicas
 * permite pasar solo un rol 
 * filtrar y rechazar roles invalidos
 * si algun rol es invalido rechaza todo el request
 * si campo role no esta presente  permite continuar default a rol auxiliar
 * @param {Object} req request object con req.body.{role....}
 * @param {Object} res response object 
 * @param {Function} next callback al siguiente middleware
 * respuestas:
 *400 si algun rol es invalido
 next() si todos los roles son validos o role no esta especificado 
 */
const checkRolesExisted = (req, res, next) => {
    //lista blanca de roles validos en el sistema 
    const validRoles = ['admin', 'coordinador', 'auxiliar'];

    // si role esta presente en el request
    if (req.body.role) {
        // convertir a array si es string (soporta ambos formatos)
        const roles = Array.isArray(req.body.role) ? req.body.role: [req.body.role];

        //  filtrar roles que no estan en la lista valida
        const invalidRoles = roles.filter(role => !validRoles.includes(role));

        // si hay roles invalido  rechazar 
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Rol(es) no validos: ${invalidRoles.join(', ')}`
            });
        }
    }
    // todos los roles son validos o no especifico continuar
    next();
};

/**
 * Exportar middlewares 
 * uso de rutas:
 * router.post('/signup....)
 */
module.exports = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
};