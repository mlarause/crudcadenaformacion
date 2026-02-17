/** 
 * Controlador de subcategorias
 * maneja todas las operaciones (CRUD) relacionadas con subcategorias
 * Estructura: una subcategoria depende de una categoria padre, una categoria puede tener varias subcategorias, una subcategoria puede tener varios productos relacionados 
 * cuando una subacetgoria se elimina los productos relacionados se desactivan
 * cuando se ejecuta en cascada  soft delete se eliminan de manera permanente
 * 
 */

const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
/**
 * create: crear nueva categoria
 * POST /api/subcategories 
 * Auth Bearer token requerido 
 * Roles: admin y coordinador
 * body requerido:
 * name nombre de la categoria
 * description: descripcion de la subcategoria
 * category: id de la categoria padre a la que pertenece
 * retorna:
 * 201: subcategoria creada en MongoDB
 * 400: validacion fallida o nombre duplicado
 * 404: categoria padre no existe
 * 500: Error en base de datos
 */

exports.createSubcategory = async (req, res) => {
    try{
        const { name, description, category } = req.body;

        //Validar que la categoria padre exista
        const parentCategory = await Category.findById(category);
        if(!parentCategory) {
            return res.status(404).json({
                success: false,
                message: 'La categoria no existe',
            });
        }
 
        // crear nueva subcategoria
        const newSubcategory = new Subcategory({
            name: name.trim(),
            description: description.trim(),
            category: category
        });

        await newSubcategory.save();

        res.status(201).json({
            success: true,
            message: 'Subcategoria creada exitosamente',
            data: newSubcategory
        });
    } catch (error) {
        console.error('Error en crear la Subcategoria:', error);
        //manejo de error de indice unico
        if (error.message.includes('duplicate key') || error.message.includes('Ya existe')) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una subcategoria con ese nombre'
            });
        }
        // Error generico del servidor
        res.status(500).json({
            success: false,
            message: 'Error al crear subcategoria',
        });
    }
};

/**
 * GET consultar listado de subcategorias
 * GET /api/subcategories
 * por defecto retorna solo las subcategorias activas
 * con includeInactive=true retorna todas las subcategorias incluyebdo las inactivas
 * Ordena por desendente por fecha de creacion 
 * retorna: 
 * 200: lista de subcategorias
 * 500: error de base de datos
 */

exports.getSubcategories = async (req, res) => {
    try {
    // por defecto solo las subcategorias activas
    //IncludeInactive=true permite ver desactivadas
    const includeInactive = req.query.includeInactive === 'true';
    const activeFilter = includeInactive ? {} : { active: { $ne: false } };

    const subcategories = await Subcategory.find(activeFilter).populate('category', 'name');
    res.status(200).json({
        success: true,
        data: subcategories
    });
} catch (error) {
    console.error('Error al obtener subcategorias', error);
    res.status(500).json({
        success: false,
        message: 'Error al obtener subcategorias',
    });    
}
};

/**
 * READ Obtener una subcategoria especificapor id
 * GET /api/subcategories/:id
 */

exports.getSubcategoryById = async (req, res) => {
    try {
    // por defecto solo las subcategorias activas
    //IncludeInactive=true permite ver desactivadas
    const subcategory = await Subcategory.findById(req.params.id).populate('category', 'name');

    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        });
    }
    res.status(200).json({
        success: true,
        data: subcategory
    });
} catch (error) {
    console.error('Error en obtener subcategorias por id', error);
    res.status(500).json({
        success: false,
        message: 'Error al obtener subcategorias por id',
        
    });    
}
};

/**
 * UPDATE Actualizar subcategoria existente
 * PUT /api/subcategories/:id
 * Auth Bearer token requerido
 * roles: admin y coordinador
 * body 
 * name: Nuevo nombre de la subcategoria
 * description: nueva descripcion 
 * category nuevo id de la categoria
 * validaciones
 * si se cambia la categoria verifica que exista
 * si quiere solo actualiza el nombreo solo la descripcion o los dos 
 * Retorna:
 * 200: subcategoria actualizada 
 * 404: subcategoria no encontrada
 * 500: error de base de datos
 */
exports.updateSubcategory = async (req, res) => {
    try {
        const { name, description, category } = req.body;

        //Verificar si cambia la categoria padre
        if (category) {
            const parentCategory = await Category.findById(category);
            if (!parentCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'la categoria no existe'
                });
            }
        }

        //Construir onjeto de actualizacion solo con campos enviados
        const updateSubcategory = await Subcategory.findByIdAndUpdate(
            req.params.id,
            { 
                name: name ? name.trim() : undefined,
                description: description ? description.trim() : undefined,
                category
            },
            {new: true, runValidators: true}
        );

        if (!updateSubcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subcategoria actualizada exitosamente',
            data: updateSubcategory
        });
    } catch (error) {
        console.error('Error en actualizar subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la subcategoria',
        });
    }
};

/**
 * Delete eliminar o desactivar una subcategoria
 * DELETE /api/subcategories/:id
 * Auth Bearer token reqierido
 * roles: admin
 * query param:
 * hardDelete=true elimina permanentemente de  la base de datos
 * Default: Soft delete (solo desactivar)
 * SOFT Delete: marca la subcategoria como inactiva 
 * Desactiva en cascada todas los, productos relacionados
 * al activar retorna todos los datos incluyendo los inactivos
 * 
 * HARD Delete: elimina permanentemente la subcategoria de la base de datos
 * elimina en cascada la subcategoria y productos realcionados
 * NO se puede recuperar
 * 
 * Retorna:
 * 200: subcategoria eliminada o desactivada
 * 404: subcategoria no encontrada
 * 500: Error de base de datos
 */

exports.deleteSubcategory = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const isHardDelete = req.query.hardDelete === 'true';

        //Buscar la subcategoria a eliminar 
        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }
        if (isHardDelete) {
            //Eliminar en cascada subcategoria y productos relacionados
            //paso 1 obtener IDs de todas los productos relacionados
            await Product.deleteMany({ subcategory: req.params.id });
            //paso 2 eliminar la subcategoria
            await Subcategory.findByIdAndDelete(req.params.id );            

            return res.status(200).json({
                success: true,
                message: 'Subcategoria eliminada permanentemente y productos relacionados ',
                data: {
                    subcategory: subcategory
                }
            });
        } else {
            //soft delete solo marcar como inactivo con cascada 
            subcategory.active = false;
            await subcategory.save();

            //Desactivar todas los productos relacionados 
  
            const products = await Product.updateMany(
                { category: req.params.id },
                { active: false } 
            );
            return res.status(200).json({
                success: true,
                message: 'Subcategoria desactivada exitosamente y sus productos asociados',
                data: {
                    subcategory: subcategory,
                    productsDeactivated: products.modifiedCount
                }
            });
        }
    } catch (error) {
        console.error('Error al desactivar la subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar la subcategoria',
            error: error.message
        });
    }
};