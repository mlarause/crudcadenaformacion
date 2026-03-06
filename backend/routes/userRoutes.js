/**
 * Rutas de usuarios
 * Define endpoints parra gestion de usuarios en el sistema
 * POST /api/users
 * GET /api/users
 * GET /xxxapi/users/:id
 * PUT /api/users/:id
 * DELETE /api/users/:id
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');

// revision de problemas de autenticacion y autorizacion

router.use((req, res, next) => {
    console.log('\n=== DIAGNOSTICO FR RUTA ===');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', {
        'Authorization': req.headers.authorization ? '***' + req.headers.authorization.slice(8) : null,
        'x-access-token' : req.headers['x-access-token'] ? '***' + req.headers['x-access-token'].slice(8) : null,
        'user-agent': req.headers['user-agent']
    });
    next();
})

//rutas de usuario
router.post('/',
    verifyToken,
    checkRole('admin', 'coordinador'),
    userController.createUser
    );

    router.get('/',
    verifyToken,
    checkRole('admin', 'coordinador', 'auxiliar'),
    userController.getAllUsers
    );

    router.get('/:id',
    verifyToken,
    checkRole('admin', 'coordinador', 'auxiliar'),
    userController.getUserById
    );

    router.put('/:id',
    verifyToken,
    checkRole('admin', 'coordinador', 'auxiliar'),
    userController.updateUser
    );

    router.delete('/:id',
    verifyToken,
    checkRole('admin'),
    userController.deleteUser
    );  
module.exports = router;