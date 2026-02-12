/**
 * Modelo de producto MONGODB
 * Define la estructura de la producto
 * el producto depende de una  subcategoria depende de una categoria
 * muchos productos pueden pertenecer a una subcategoria
 * Tiene relacion un user para ver quien creo el producto
 * Soporte de imagenes (array de url)
 * validacion de valores numericos (no negativos)
 */

const mongoose =require('mongoose');

// Campos de la tabla producto

const productSchema = new mongoose.Schema({
    //Nombre del producto  unico y requerido
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true, // no pueden haber dos productos con el mismo nombre
        trim: true // Eliminar espacios al inicio y final
    },

    //Descripcion del producto - requerida
    description: {
        type: String,
        required: [true, 'la descripcion es requerida'],
        trim: true
    },

    //Precio en unidades monetarias
    // No puede ser negativo
    price: {
        type: Number,
        required: [true, 'el precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },

    // Cantidad de stock
    // No puede ser negativa
    stock: {
        type: Number,
        required: [true, 'el stock es obligatorio'],
        min: [0, 'El stock no puede ser negativo']
    },

    // Categoria padre esta subcategoria pertenece a una categoria 
    // relacion 1 - muchos Una categoria puede tener muchas subcategorias 
    //un producto pertenece a una subcategoria pero una subcategoria puede tener muchos productos reclacion 1 a muchos 

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // puede ser poblado con .populate('category')
        required: [true, 'La categoria es requerida']
    },

    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory', // puede ser poblado con .populate('subcategory')
        required: [true, 'La subcategoria es requerida']
    },

    // quien creo el producto
    //Referencia de User no requerido
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'// puede ser poblado para mostrar los usuarios
    },

    //Array de urls de imagenes de productos
    images: [{
        type: String, // url de la imegen
    }],

    // Active desactiva el producto pero no la elimina
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, // agrega createdAt y updatedAt automaticamente 
    versionKey: false, // No incliur campos __V
});

/**
 * MIDDLEWARE PRE-SAVE
 * limpia indices duplicados
 * Mongodb a veces crea multiples indices con el mismo nombre 
 * esto causa conflictos al intentar dropIndex o recrear indices
 * este middleware limpia los indices problematicos
 * Proceso
 * 1 obtine una lista de todos los indices de la coleccion
 * 2 busca si existe indice con nombre name_1 (antiguo o duplicado)
 * si existe lo elimina antes de nuevas operaciones 
 * ignora errores si el indice no existe 
 * continua con el guardado normal
 */
productSchema.post('save', function(error, doc, next) {
    // verificar si es error de mongoDb por violacion de indice unico
        if (error.name === 'MongoServerError' && error.code ===11000){
            return next(new Error('Ya exixte un producto con ese nombre'))
        }
        // pasar el error tal como es 
        next(error);
});

/**
 * Crear indice unico
 * 
 * Mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name que ya exista
 * aumenta la velocidad de las busquedas
 */



//Exportar el modelo
module.exports = mongoose.model('Product', productSchema);



