var Waterline = require('waterline');
module.exports.User = Waterline
    .Collection
    .extend({
        identity: 'users',
        connection: 'gc',
        attributes: {
            username: {
                type: 'string',
                required: true
            },
            password: {
                type: 'string',
                minLength: 6,
                required: true,
                columnName: 'encrypted_password'
            }
        },
        // Lifecycle Callbacks
        beforeCreate: function (values, next) {
            bcrypt
                .hash(values.password, 10, function (err, hash) {
                    if (err) {
                        return next(err);
                    }
                    values.password = hash;
                    next();
                });
        }
    });