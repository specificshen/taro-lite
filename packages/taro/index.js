try {
  module.exports = require('./dist/index.js');
} catch (error) {
  if (error?.code !== 'MODULE_NOT_FOUND' || !/[\\/]dist[\\/]index\.js/.test(error.message)) {
    throw error;
  }

  module.exports = require('./src/index.js');
}
