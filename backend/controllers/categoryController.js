/** 
 * Controlador de categorias
 * maneja todas las operaciones (CRUD) relacionadas con categorias
 * 
 */

const Category = require('../models/Category');
/**
 * create: crear nueva categoria
 * POST /api/categories 
 * Auth Bearer token requerido 
 * Roles: admin y coordinador
 * body requerido:
 * name nombre de la categoria
 * description: descripcion de la categoria 
 * retorna:
 * 201: categoria creada en MongoDB
 * 400: validacion fallida o nombre duplicado
 * 500: Error en base de datos
 */

exports.createCategory = async (req, res) => {
    try{
        const { name, description } = req.body;
        // validacion de los campos de entrada
        if(!name || typeof name !== 'string'|| !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorioy debe ser texto valido'
            });
        }

        if(!description || typeof description !== 'string'|| !description.trim()) {
            return res.status(400).json({
                success: false,
                message: 'La descripción es obligatoria y debe ser texto válido'
            });
        }

        // limpiar espacios en blanco
        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        //Verficar si ya existe una categoria con el mismo nombre
        const existingCategory = await Category.findOne({ name: trimmedName });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoria con ese nombre'
            });
        }

        // crear nueva categoria
        const newCategory = new Category({
            name: trimmedName,
            description: trimmedDesc
        });

        await newCategory.save();

        res.status(201).json({
            success: true,
            message: 'Categoria creada exitosamente',
            data: newCategory
        });
    } catch (error) {
        console.error('Error en createCategory:', error);
        //manejo de error de indice unico
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoria con ese nombre'
            });
        }
        // Error generico del servidor
        res.status(500).json({
            success: false,
            message: 'Error al crear categoria',
            error: error.message
        });
    }
};

/**
 * GET consultar listado de categorias
 * GET /api/categories
 * por defecto retorna solo las categorias activas
 * con includeInactive=true retorna todas las actegorias incluyebdo las inactivas
 * Ordena por desendente por fecha de creacion 
 * retorna: 
 * 200: lista de categorias
 * 500: error de base de datos
 */

exports.getCategories = async (req, res) => {
    try {
    // por defecto solo las categorias activas
    //IncludeInactive=true permite ver desactivadas
    const includeInactive = req.query.includeInactive === 'true';
    const activeFilter = includeInactive ? {} : { active: { $ne: false } };

    const categories = await Category.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: categories
    });
} catch (error) {
    console.error('Error en getCategorias', error);
    res.status(500).json({
        success: false,
        message: 'Error al obtener categorias',
        error: error.message
    });    
}
};

/**
 * READ Obtener una categoria especificapor id
 * GET /api/Categories/:id
 */

exports.getCategoryById = async (req, res) => {
    try {
    // por defecto solo las categorias activas
    //IncludeInactive=true permite ver desactivadas
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Categoria no encontrada'
        });
    }
    res.status(200).json({
        success: true,
        data: category
    });
} catch (error) {
    console.error('Error en getCategoryById', error);
    res.status(500).json({
        success: false,
        message: 'Error al obtener categoria',
        error: error.message
    });    
}
};

/**
 * UPDATE Actualizar categoria existente
 * PUT /api/categories/:id
 * Auth Bearer token requerido
 * roles: admin y coordinador
 * body 
 * name: Nuevo nombre de la categoria
 * description: nueva descripcion 
 * validaciones
 * si quiere solo actualiza el nombreo solo la descripcion o los dos 
 * Retorna:
 * 200: categoria actualizada
 * 400: Nombre duplicado
 * 404: Categoria no encontrada
 * 500: error de base de datos
 */
exports.updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const updateData = {};

        //Solo actualizar campos q fueron enviados

        if (name) {
            updateData.name = name.trim();

            //Verificar si el nuevo nombre ya exixte  en otra categoria
            const existing = await Category.findOne({
                name: updateData.name,
                _id: { $ne: req.params.id } // asegura q el nombre no sea el mismo id
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Este nombre ya existe'
                });
            }
        }

        if (description) {
            updateData.description = description.trim();
        }

        //Acatualizar la categoria en la base de datos
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true}
        );

        if (!updatedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Categoria actualizada exitosamente',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error en updateCategory', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la categoria',
            error: error.message
        });
    }
};

/**
 * Delete eliminar o desactivar una categoria
 * DELETE /api/categories/:id
 * Auth Bearer token reqierido
 * roles: admin
 * query param:
 * hardDelete=true elimina permanentemente de la la base de datos
 * Default: Soft delete (solo desactivar)
 * SOFT Delete: marca la categoria como inactiva 
 * Desactiva en cascada todas las subcategorias, productos relacionados
 * al activar retorna todos los datos incluyendo los inactivos
 * 
 * HARD Delete: elimina permanentemente la categoria de la base de datos
 * elimina en cascada la actegoria, subcategorias y productos realcionados
 * NO se puede recuperar
 * 
 * Retorna:
 * 200: Categoria eliminada o desactivada
 * 404: categoria no encontrada
 * 500: Error de base de datos
 */

exports.deleteCategory = async (req, res) => {
    try {
        const SubCategory = require('../models/Subcategory');
        const Product = require('../models/Product');
        const isHardDelete = req.query.hardDelete === 'true';

        //Buscar la categoria a eliminar 
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        if (isHardDelete) {
            //Eliminar en cascada subcategorias y productos relacionados
            //paso 1 obtener IDs de todas las subcategorias relacionadas
            const subIds = (await Subcategory.find({ category: req.params.id })).map(s => s._id);
            //paso 2 eliminar todos productos  de categoria
            await Product.deleteMany({ category: req.params.id });
            // paso 3 eliminar todos los productos de lasubcategorias de esta categoria
            await Product.deleteMany({ subcategory: { $in: subIds} });
            //paso 4 eliminar todas las subcategoriasde esta categoria
            await SubCategory.deleteMany({ category: req.params.id });
            //paso 5 eliminar la categoria misma
            await Category.findByIdAndDelete(req.params.id);

            res.status(200).json({
                success: true,
                message: 'Categoria eliminada permanentemente y sus subcategorias y productos realcionados ',
                data: {
                    category: category
                }
            });
        } else {
            //soft delete solo marcar como inactivo con cascada 
            category.active = false;
            await category.save();

            //Desactivar todas las subcategorias relacionadas 
            const subcategories = await Subcategory.updateMany(
                { category: req.params.id },
                { active: false}
            );

            //desactivar todos los productos realacionados  por la categoria y subcategoria
            const products = await Product.updateMany(
                { category: req.params.id },
                { active: false } 
            );

            res.status(200).json({
                success: true,
                message:'Categoria desactivada exitosamente y sus subcategorias y productos asociados',
                data: {
                    category: category,
                    subcategoriesDeactivated: subcategories.modifiedCount,
                    productsDeactivated: products.modifiedCount
                }
            });
        }
    } catch (error) {
        console.error('Error en deleteCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar la categoria',
            error: error.message
        });
    }
};