module.exports.connections = {

    gc: {
        adapter: 'sails-mongo',
        host: 'localhost', // defaults to `localhost` if omitted
        port: 27017, // defaults to 27017 if omitted
        // user: 'username_here', // or omit if not relevant password: 'password_here',
        // // or omit if not relevant
        database: 'gc' // or omit if not relevant
    }
};
