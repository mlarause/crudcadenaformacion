/**
 * Rutas de autenticacion
 * defeine los endpoints realativos  a autenticacion de usuarios
 * POST /api/auth/signin registrar un nuevo usuario
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { verifySignUp } = require('../middleswares');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');

// Rutas de autenticacion

//Requiere email-usuario y password
router.post('/signin', authController.signin);

router.post('/signup',
    verifyToken,
    checkRole('admin'),
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted,
    authController.signup
);
module.exports = router;
