/**
 * Contralador de usuarios 
 * Este modulo maneja todas las operaciones del crud para gestion de usuarios
 * incluye control de acceso badaso en roles 
 * Roles permitidos admin, coordinador, auxiliar 
 * Seguridad
 * Las contraseñas nunca se devuelven en respuestas 
 * los auxiliares no pueden ver y actualizar  otros usuarios 
 * los coordinadores no puden ver los administradores
 * activas y desactivar usuarios
 * eliminar permanentemete un usuario solo admin
 * 
 * operaciones 
 * getAlluser listar usuarios con filtro por rol
 * getuserById optener usuario especifico
 * createUser crear un nuevo usuario con validacion
 * updateUser actualizar usuario con restricciones de rol
 * delete user eliminar usuario con restricciones de rol
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Obtener lista de usuarios 
 * GET /api/users
 * Auth token requerido
 * query params incluir activo o desactivados 
 * 
 * retorna 
 * 200 array de usuarios filtrados
 * 500 Error de servidor 
 */

exports.getAllUsers = async (req, res) => {
    try {
        // por defecto solo mostrar usuarios activos 
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : { active: { $ne: false }};

        let users;
        // control de acceso  basado en rol
        if (req.userRole === 'auxiliar') {
            // los auxiliares  solo pueden verse a si mismo
            users = await User.find({_id: req.userId, ...activeFilter}).select('-password');
        } else {
            // los admin y coordinadores ven todos los usuarios
            users = await User.find(activeFilter).select('-password');
        }
        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('[CONTROLLER] Error en getAllusers: ', error.message);
        res.status(500).json({
            success: false,
            message: 'error an obtener todos los usuarios'
        });
    }
}; 

/**
 * Read optener un usuario especifico por id 
 * GET /api/users/:id
 * auth token requerido
 * respuestas
 * 200 usuario encontrado
 * 403 sin permiso para ver el usuario
 * 404 usuario no encontrado 
 * 500 error de sevidor 
 */

exports.getUserById = async (req, res) => {
    try {         
        const user = await user.findById(req.params.id).select('-password');
       
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // validaciones de acceso 
        // los auxiliares solo pueden ver su propio perfil 
        if (req.userRole === 'auxiliar' && req.userId!== user.id.toString()) {
            return res.status(403).json({
                success: false,
                message:'no tienes permiso para ver este usuario'
            });
        }

        // los coordinadores no pueden ver administradores
        if (req.userRole === 'coordinador' && role === 'admin') {
            return res.status(403).json({
                success: false,
                message:'no puedes ver usuarios admin'
            });
        }

        res.status(200).json({
            success: true,
            user
        });


    } catch (error) {
        console.error('Error  en getUserById', error);
        res.status(500).json({
            success: false,
            message: 'error al encontrar al usuario especifico',
            error: error.message
        });
    }
};

/**
 * CREATE crear un nuevo usuario
 * POST /api/users
 * Auth Bearer token requerido
 * Roles admin y coordinador (con restricciones)
 * validaciones 
 * 201 Usuario creado 
 * 400 Validacion fallida
 * 500 error de srvidor
 */

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        //Crear usuario nuevo 
        const user = new User({
            username,
            email,
            password,
            role
        });

        // Guardar en DB 
        const savedUser = await user.save();

        res.status(201).json({
            success: true,
            message: 'Usuario creado',
            user:{
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        });
    } catch (error) {
        cosole.error('Error en createUser', error);
        res.status(500).json({
            success: false,
            message: 'error al crear usuario',
            error: error.message
        });
    }
};

/**
 * UPDATE actualizar un usuario existente
 * PUT /api/users/:id
 * Auth Bearer token requerido
 * validaciones
 * auxiliar  solo puede actualizar su propio perfil
 * auxliar no puede cambiar su rol
 * admin, coordinador pueden actualizar otros usuarios
 * 200 usuario actualizado
 * 403 sin permiso para actualizar
 * 404 usuario no encontrado 
 * 500 error de servidor
 */

exports.updateUser = async (req, res) => {
    try {
        //Restriccion: auxiliar solo puede actualizar su propio perfil
        if (req.userRole === 'auxiliar' && req.userId.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'no tienes permiso para actualizar este usuario'
            });
        }

        //Restriccion: auxiliar no puede cambiar su rol
        if (req.userRole === 'auxiliar' && req.body.role) {
            return res.status(403).json({
                success: false,
                message: 'no tienes permiso para modificar su rol '
            });
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true } // retorna documento actualizado
        ).select('-password');// no retornar contraseña 

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado',
            user: updatedUser
        })        
    } catch (error) {
        console.error('Error en updateUser', error);
        res.status(500).json({
            success: false,
            message: ' Error al actualizar usuario',
            error: error.message
        });
    }
};

/**
 * DELETE eliminar usuario
 * delete /api/users/:id
 * roles: admin
 * query params: 
 * hardDelete=true eliminar permanentemente
 * default soft delete desactivar
 * 
 * El admin solo puede desactivar otro admin
 * retorna 
 * 200 usuario eliminado o desactivado
 * 403 sin permiso
 * 404 usuario no encontrado
 * 500 error de servidor
 */

exports.deleteUser = async (req, res ) => {
    try {
        const ishardDelete = req.query.hardDelete === 'true';
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Usuariono encontrado'
            });
        }

        // proteccion no permitir desactivar otros admin
        // solp el admin puede desactivarse o eliminar otro admin

        if (userToDelete.role === 'admin' && userToDelete._id.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'no tienes permiso para eliminar o desactivar administradores'
            });
        }

        if (ishardDelete) {
            // Eliminar permanenetemente
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Usuario eliminado permanentemente',
                data: userToDelete
            });
        } else {
            // soft delete desactivar usuario
            userToDelete.active = false;
            await userToDelete.save();

            res.status(200).json({
                success: true,
                message: 'Usuario desactivado',
                data: userToDelete
            });
        }
    } catch (error) {
        console.error('Error en deleteUser', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar usuario',
            error: error.message
        });
    }
};
