/**
 * Rutas de productos
 * defiene los endpoints CRUD para la gestion de productos
 * los productos son elementos dentro de las subcategorias
 * endpoints:
 * Post /api/products crea un nuevo producto
 * Get /api/products obtiene todos los productos
 * Get /api/products/:id obtiene un producto por id
 * Put /api/products/:id actualiza un producto por id
 * Delete /api/products/:id elimina un producto/desactivar
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { check } = require('express-validator');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');

const validateProduct = [
    check('name')
        .not().isEmpty()
        .withMessage('el nombre es obliatorio'),

    check('description')
        .not().isEmpty()
        .withMessage('la descripcion es obliatorio'),

    check('price')
        .not().isEmpty()
        .withMessage('el precio es obliatorio'),

    check('stock')
        .not().isEmpty()
        .withMessage('el stock es obliatorio'),
    
    check('category')
        .not().isEmpty()
        .withMessage('la categoria es obliatorio'),

    check('subcategory')
        .not().isEmpty()
        .withMessage('la subcategoria es obliatorio'),
];
// Rutas CRUD

router.post('/',
    verifyToken,
    checkRole(['admin', 'coordinador', 'auxiliar']),
    validateProduct,
    productController.createProduct
);

router.get('/', 
        verifyToken,
        productController.getProducts);

router.get('/:id',
    verifyToken,
     productController.getProductById);

router.put('/:id',
    verifyToken,
    checkRole(['admin', 'coordinador']),
    validateProduct,
    productController.updateProduct
);

router.delete('/:id',
    verifyToken,
    checkRole('admin'),    
    productController.deleteProduct
);

module.exports = router;

