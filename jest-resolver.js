const { resolve } = require('path');
const { existsSync } = require('fs');

module.exports = function resolver(path, options) {
  // Check if this is a relative import ending with .js
  if (path.match(/^\.\.?\/.*\.js$/)) {
    const tsPath = path.replace(/\.js$/, '.ts');
    const fullPath = resolve(options.basedir, tsPath);
    
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // Fall back to default resolution
  return options.defaultResolver(path, options);
};