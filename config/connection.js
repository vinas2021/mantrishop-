const mongoose = require('mongoose');

const dbconnect = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('mongoDb connected');
        })
        .catch((err) => {
            console.log('mongoDb connection failed', err)
        })
}

module.exports = dbconnect