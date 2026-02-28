/** 
 * MIDDLEWARE control de roles de usuario
 * 
 * sirve para verificar que el usuario autenticado tiene
 * permisos necesarios para acceder a una ruta especifica
 * 
 * funcion factory checkRole() permite especificar los roles permitidos 
 * funcion Helper para roles especificos isAdmin, isCoordinador, isAuxiliar
 * Requiere que veryfyToken se haya ejecutado primero
 * flujo:
 * verifica que req.userRole exista
 * compara req.userRole contra lista de roles permitidos
 * si esta en lista continua
 * si no esta en la lista retorna 403 Forbidden con mensaje descriptivo
 * si no existe userRole retorna 401 (Token corructo)
 * 
 * uso:
 * checkRole('admin') solo admin
 * checkRole('admin', 'coordinador') admin y coordinador con permisos
 * checkRole('admin', 'coordinador', auxiliar) todos con permisos
 * Roles del sistema:
 * admin  acceso total
 * coordinador no puede eliminar ni gestionar usuarios
 * auxiiar acceso limitado a tereas especificas
 */

/**
 * factory function checkRole
 * retorna middleware que verifica si el usuario tiene uno de los roles permitidos
 * @param {...string} allowedRoles roles permitidos en el sistema
 * @returns {function} middleware de express
 * 
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        // validar que el usuario fue atenticado y veryfyToken ejecutado
        //req,userRole es establecido por veryfyToken middleware
        if (!req.userRole) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido o expirado'
            });
        }

        // verificar  si el rol del usuario esta en la lista de roles permitidos
        if(!allowedRoles.includes(req.userRole)){
            return res.status(403).json({
                success: false,
                message: `Permisos insuficientes Se require: ${allowedRoles.join(' o ')}`
            });
        }
        //usuario tiene permiso continuar 
        next();
    }
};
// funciones helper para roles especificos
//verifica q el usuario es admin
//uso: router.delete('/admin-only'. verifyToken, isAdmin, controller.method);

const isAdmin = (req, res, next) => {
    return checkRole('admin')(req, res, next);
};
// vericar si el usuario es coordinador
const isCoordinador = (req, res, next) => {
    return checkRole('coordinador')(req, res, next);
};
// verificar si el usuario es auxiliar
const isAuxiliar = (req, res, next) => {
    return checkRole('auxiliar')(req, res, next);
};
// modulos a exportar
module.exports = {
    checkRole,
    isAdmin,
    isCoordinador,
    isAuxiliar
}