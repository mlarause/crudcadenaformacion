/**
 * Controlador de atenticacion
 * Maneja el registro login y generacion de token JWT
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt =  require('jsonwebtoken');
const config = require('../config/auth.config');

/** 
 * SIGNUP: crear nuevo usuario
 * POST /api/auth/signup
 * Body { username, email, password, role}
 * Crea usuario en la base de datos
 * encripta contraseña antes de guardar con bcrypt
 * genera token JWT
 * Rertorna usuario sin mostrar la contraseña 
 */ 

exports.signup = async (req, res) => {
    try {
        //Crear nuevo usuario
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 'auxiliar'//por defecto el rol es auxiliar
        });

        // Guardar en base de datos
        //la contraseña se encripta automaticamente en el middleware del modedelo
        const savedUser = await user.save();

        //Generar token jwt que expira en 24 horas
        const token = jwt.sign(
            {
                id: savedUser._id,
                role: savedUser.role,
                email: savedUser.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        //Preparando respuesta sin mostrar la contraseña 
        const UserResponse = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            role: savedUser.role,
        };

        res.status(200).json({
            success: true,
            message: 'Usuario registrado correctamente',
            token: token,
            user: UserResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    } 
};

/**
 * SINGIN: iniciar sesion
 * POST /api/auth/singin
 * body { email o usuario, password }
 * busca el ususario por email o username
 * valida la contraseña con bcrypt
 * si es correcto el token JWT
 * Token se usa para autenticar futuras solicitudes
 */

exports.signin = async (req, res) => {
    try {
        //Validar que se envie el email o username
        if (!req.body.email && !req.body.username) {
            return res.status(400).json({
                success: false,
                message: 'email o username requerido'
            });
        }

        // validar que se envie la conraseña
        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'password requerido'
            });
        }

        // buscar usuario por email o username
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email } 
            ]
        }).select('+password'); //include password field

        // si no existe el usuario con este email o username
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //Verifivar que el usuario tenga contraseña
        if (!user.password) {
            return res.status(500).json({
                success: false,
                message: 'Error interno: usuario sin contraseña '
            });
        }

        // Comparar contraseña enviada con el hash almacenado
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        //Generar token JWT 24 horas
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        // prepara respuesta sin mostrar la contraseña
        const UserResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesion exitoso',
            token: token,
            user: UserResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion',
            error: error.message
        });
    }
};
