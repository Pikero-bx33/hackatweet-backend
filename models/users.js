const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        // lowercase: true, // allow JohnCena like in the video, unicity should be checked in express route
        trim: true,
    },
    fullName:  {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
//        unique: true, // l'unicité devrait etre controlée que si non nul, sinon tel quel, 2 cas nuls declenche une violation de contrainte d'intégrité
        // had to run one shot the following code , to remove the constraint:
        //  User.collection.dropIndex('email_1').then(()=>console.log('Index email_1 dropped'));

        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, "Please provide a valid email"],
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    token: {
        type: String,
        required: true,
    },
});

/*
// proposition IA pour l'unicité email uniquement si non nul
    // Index unique partiel sur email : uniquement quand email existe et n'est pas null

    userSchema.index(
    { email: 1 }, // single-field index + sort order @ https://www.mongodb.com/docs/manual/core/indexes/index-types/index-single/#std-label-indexes-single-field
    {
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } }, // https://www.mongodb.com/docs/manual/reference/method/db.collection.createIndex/#mongodb-method-db.collection.createIndex
    }
    );
*/

const User = mongoose.model('users', userSchema);

module.exports = User;