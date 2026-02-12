/**
 * Modelo de subcategoria MONGODB
 * Define la estructura de la subcategoria
 * la subcategoria depende de una categoria
 * muchos productos pueden pertenecer a una subcategoria
 * Muchas subcategorias dependen de una sola categoria
 */

const mongoose =require('mongoose');

// Campos de la tabla subcategoria

const subcategorySchema = new mongoose.Schema({
    //Nombre de la subcategoria unico y requerido
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true, // no pueden haber dos subcategorias con el mismo nombre
        trim: true // Eliminar espacios al inicio y final
    },

    //Descripcion de la subcategoria - requerida
    description: {
        type: String,
        required: [true, 'la descripcion es requerida'],
        trim: true
    },

    // Categoria padre esta subcategoria pertenece a una categoria
    // relacion 1 - muchos Una categoria puede tener muchas subcategorias 

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // puede ser poblado con .populate('category')
        required: [true, 'La categoria es requerida']
    },

    // Active desactiva la subcategoria pero no la elimina
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
subcategorySchema.post('save', function(error, doc, next) {
    // verificar si es error de mongoDb por violacion de indice unico
        if (error.name === 'MongoServerError' && error.code ===1000) {
            next(new Error('Ya existe una subcategoria con ese nombre'));        
    } else {
        // pasar el error tal como es 
        next(error);
    }
});

/**
 * Crear indice unico
 * 
 * Mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name que ya exista
 * aumenta la velocidad de las busquedas
 */



//Exportar el modelo
module.exports = mongoose.model('Subcategory', subcategorySchema);



