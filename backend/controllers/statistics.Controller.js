/**
 * controlador de estadiaticas
 * get /api/statistics
 * Ath Baerer token requerido
 * Estadisticas disponibles:
 * total de usuarios
 * total productos
 * total de categorias
 * total de subcategorias
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

/**
 * respuestas
 * 200 ok estadisticas obtenidas
 * 500 Error de base de datos
 */

const getStatistics = async (req, res) => {
    try {
        //ejecuta todas las queries en paralelo 
        const [totalUsers, totalProducts, totalCategories, totalSubcategories] = await Promise.all([
            User.countDocuments(),//Contar usuarios
            Product.countDocuments(),//Contar productos
            Category.countDocuments(),//Contar categorias
            Subcategory.countDocuments(),//Contar subactegorias
        ]);

        //Retornar las estadisticas
        res.json({
            totalUsers,
            totalProducts,
            totalCategories,
            totalSubcategories
        });
    } catch (error) {
        console.error('Error en obtener estadisticas', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        })
    }
}
module.exports = { getStatistics };