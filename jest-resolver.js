module.exports = (path, options) => {
  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(path, {
    ...options,
    // Use packageFilter to process parsed `package.json` before the resolution (see https://www.npmjs.com/package/resolve#resolveid-opts-cb)
    packageFilter: (pkg) => {
      return {
        ...pkg,
        // Alter the value of `main` before resolving the package
        main: pkg.module || pkg.main,
      };
    },
    // For TypeScript files that import with .js extension, resolve without the extension
    extensions: options.extensions,
    pathFilter: (pkg, path, relativePath) => {
      // Remove .js extension when importing TypeScript files
      if (relativePath.endsWith('.js')) {
        const tsPath = relativePath.replace(/\.js$/, '.ts');
        const tsxPath = relativePath.replace(/\.js$/, '.tsx');
        
        // Check if TypeScript file exists
        try {
          require.resolve(tsPath);
          return tsPath;
        } catch {
          try {
            require.resolve(tsxPath);
            return tsxPath;
          } catch {
            // If no TypeScript file, keep the .js
            return relativePath;
          }
        }
      }
      return relativePath;
    },
  });
};