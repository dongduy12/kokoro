const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    key: { type: String, unique: true }, // Ví dụ: 'hero_image', 'site_title'
    value: String
});

module.exports = mongoose.model('Config', configSchema);