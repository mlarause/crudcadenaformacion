/**
 * rutas de las estadisticas
 * define el endpoint para obtener las estadisticas generales del sistema
 */

const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/statistics.Controller');

//Get /api/statistics obtiene las estadisticas del sistema 
router.get('/', getStatistics);

module.exports = router;