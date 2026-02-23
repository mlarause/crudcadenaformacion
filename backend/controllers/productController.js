/** 
 * Controlador de productos 
 * maneja todas las operaciones (CRUD) relacionadas con productos 
 * Estructura: una subcategoria depende de una categoria padre, una categoria puede tener varias subcategorias, una subcategoria puede tener varios productos relacionados 
 * cuando una subacetgoria se elimina los productos relacionados se desactivan
 * cuando se ejecuta en cascada  soft delete se eliminan de manera permanente
 * Incluye soft delete (marcar como inactivo)
 * y hard delete (eliminación permanente)
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
/**
 * /**
 * CREATE: Crear nuevo producto
 * POST /api/products
 * Body: { name, description, price, stock, category, subcategory }
 * Auth Bearer token requerido 
 * Roles: admin y coordinador
 * 
 * 201: producto creada en MongoDB
 * 400: validacion fallida o nombre duplicado
 * 404: categoria padre no existe
 * 500: Error en base de datos
 */

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, subcategory } = req.body;

        // ===== VALIDACIONES =====
        // Verificar que todos los campos requeridos estén presentes
        if (!name || !description || !price || !stock || !category || !subcategory) {
            return res.status(400).json({
                success: false,
                message: 'todos los campos son obligatorios',
                requiredFields: ['name', 'description', 'price', 'stock', 'category', 'subcategory']
            });
        }

        // Validar que la categoría existe
        const categoryExist = await Category.findById(category);
        if (!categoryExist) {
            return res.status(404).json({
                success: false,
                message: 'la categoría solicitada no existe',
                categoryId: category
            });
        }

        // Validar que la subcategoría existe Y pertenece a la categoría especificada
        const subcategoryExist = await Subcategory.findOne({
            _id: subcategory,
            category: category
        });
        if (!subcategoryExist) {
            return res.status(400).json({
                success: false,
                message: 'la subcategoría no existe o no pertenece a la categoría especificada'
            });
        }
    
 // ===== CREAR PRODUCTO =====
        const product = new Product({
            name, 
            description, 
            price, 
            stock, 
            category, 
            subcategory
        });

        // Si hay usuario autenticado, registrar quién creó el producto
        if (req.user && req.user._id) {
            product.createdBy = req.user._id;
        }

        // Guardar en base de datos
        const savedProduct = await product.save();

        // Obtener producto poblado con datos de relaciones (populate)
        const productWithDetails = await Product.findById(savedProduct._id)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('createdBy', 'username email');

        return res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: productWithDetails
        });

    } catch (error) {
        console.error('Error en createProduct: ', error);
        
        // Manejar error de duplicado (campo único)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un producto con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

/**
 * READ: Obtener productos (con filtro de activos/inactivos)
 * 
 * GET /api/products
 * Query params:
 *   - includeInactive=true : Mostrar también productos desactivados
 *   - Default: Solo productos activos (active: true)
 * 
 * Retorna: Array de productos poblados con categoría y subcategoría
 */
exports.getProducts = async (req, res) => {
    try {
        // Determinar si incluir productos inactivos
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : { active: { $ne: false } };

        // Obtener productos con datos relacionados
        const products = await Product.find(activeFilter)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .sort({ createdAt: -1 });

        // Si el usuario es auxiliar, no mostrar información de quién lo creó
        if (req.user && req.user.role === 'auxiliar') {
            // Ocultar campo createdBy para usuarios auxiliares

            products.forEach(product => {
                product.createdBy = undefined;
            });
        }

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error('Error en getProducts: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

/**
 * READ: Obtener un producto específico por ID
 * 
 * GET /api/products/:id
 * 
 * Retorna: Producto poblado con categoría y subcategoría
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description')
            .populate('subcategory', 'name description');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Ocultar createdBy para usuarios auxiliares
        if (req.user && req.user.role === 'auxiliar') {
            product.createdBy = undefined;
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error en getProductById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

/**
 * UPDATE: Actualizar un producto
 * 
 * PUT /api/products/:id
 * Body: { cualquier campo a actualizar }
 * 
 * - Solo actualiza campos enviados
 * - Valida relaciones si se envían category o subcategory
 * - Retorna producto actualizado
 */
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, subcategory } = req.body;
        const updateData = {};

        // Agregar solo los campos que fueron enviados
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price) updateData.price = price;
        if (stock) updateData.stock = stock;
        if (category) updateData.category = category;
        if (subcategory) updateData.subcategory = subcategory;

        // Validar relaciones si se actualizan
        if (category || subcategory) {
            if (category) {
                const categoryExist = await Category.findById(category);
                if (!categoryExist) {
                    return res.status(404).json({
                        success: false,
                        message: 'La categoría solicitada no existe'
                    });
                }
            }
            if (subcategory) {
                const subcategoryExist = await Subcategory.findOne({
                    _id: subcategory,
                    category: category || updateData.category
                });
                if (!subcategoryExist) {
                    return res.status(404).json({
                        success: false,
                        message: 'La subcategoría no existe o no pertenece a la categoría'
                    });
                }
            }
        }

        // Actualizar producto en BD
        const updateProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        }).populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('createdBy', 'username email');

        if (!updateProduct) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: updateProduct
        });

    } catch (error) {
        console.error('Error en updateProduct: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

/**
 * DELETE: Eliminar o desactivar un producto
 * 
 * DELETE /api/products/:id
 * Query params:
 *   - hardDelete=true : Eliminar permanentemente de la BD
 *   - Default: Soft delete (marcar como inactivo)
 * 
 * SOFT DELETE: Solo marca active: false
 * HARD DELETE: Elimina permanentemente el documento
 */
exports.deleteProduct = async (req, res) => {
    try {
        const isHardDelete = req.query.hardDelete === 'true';
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (isHardDelete) {
            // ===== HARD DELETE: Eliminar permanentemente de la BD =====
            await Product.findByIdAndDelete(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Producto eliminado permanentemente de la base de datos',
                data: product
            });
        } else {
            // ===== SOFT DELETE: Solo marcar como inactivo =====
            product.active = false;
            await product.save();
            res.status(200).json({
                success: true,
                message: 'Producto desactivado exitosamente (soft delete)',
                data: product
            });
        }

    } catch (error) {
        console.error('Error en deleteProduct: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
};