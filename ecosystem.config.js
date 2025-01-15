module.exports = {
    apps: [
      {
        name: "Api-Iwabri",              // Name of your application
        script: "./server.js",      // Path to the main file
        instances: "max",           // Auto-detect the number of instances (for clustering)
        exec_mode: "cluster",       // Run in cluster mode
        env: {
          NODE_ENV: "development",  // Environment variables for development
        },
        env_production: {
          NODE_ENV: "production",   // Environment variables for production
        },
      },
    ],
  };
  