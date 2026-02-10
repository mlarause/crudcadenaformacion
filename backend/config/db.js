//Conexion con la base de datos
module.exports = {
    url:process.env.MONGODB_URI || "mongodb://localhost:27017/crud-mongocf"
};