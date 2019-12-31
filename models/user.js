var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/ichat',{ useNewUrlParser: true, useUnifiedTopology: true })
var Schema = mongoose.Schema
var userSchema = new Schema({
    username:{
        type: String,
        required:true
    },
    password:{
        type:String,
        required:true
    },

})

module.exports = mongoose.model('User',userSchema)