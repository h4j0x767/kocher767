// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "file:///C:/Users/Laptop%20Duhok/Downloads/dr.-badini-ai%20(4)/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Laptop%20Duhok/Downloads/dr.-badini-ai%20(4)/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Laptop Duhok\\Downloads\\dr.-badini-ai (4)";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3e3,
      host: "0.0.0.0",
      allowedHosts: true
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "."),
        // Stub out Capacitor packages so they never cause import errors in the browser
        "@capacitor-community/biometric-auth": path.resolve(__vite_injected_original_dirname, "src/stubs/capacitor-stub.ts"),
        "@capacitor/local-notifications": path.resolve(__vite_injected_original_dirname, "src/stubs/capacitor-stub.ts")
      }
    },
    optimizeDeps: {
      exclude: ["@capacitor-community/biometric-auth", "@capacitor/local-notifications"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMYXB0b3AgRHVob2tcXFxcRG93bmxvYWRzXFxcXGRyLi1iYWRpbmktYWkgKDQpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMYXB0b3AgRHVob2tcXFxcRG93bmxvYWRzXFxcXGRyLi1iYWRpbmktYWkgKDQpXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9MYXB0b3AlMjBEdWhvay9Eb3dubG9hZHMvZHIuLWJhZGluaS1haSUyMCg0KS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gICAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCAnLicsICcnKTtcbiAgICByZXR1cm4ge1xuICAgICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICAgIGRlZmluZToge1xuICAgICAgICAncHJvY2Vzcy5lbnYuQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5HRU1JTklfQVBJX0tFWSksXG4gICAgICAgICdwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5HRU1JTklfQVBJX0tFWSlcbiAgICAgIH0sXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOiB7XG4gICAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLicpLFxuICAgICAgICAgIC8vIFN0dWIgb3V0IENhcGFjaXRvciBwYWNrYWdlcyBzbyB0aGV5IG5ldmVyIGNhdXNlIGltcG9ydCBlcnJvcnMgaW4gdGhlIGJyb3dzZXJcbiAgICAgICAgICAnQGNhcGFjaXRvci1jb21tdW5pdHkvYmlvbWV0cmljLWF1dGgnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3N0dWJzL2NhcGFjaXRvci1zdHViLnRzJyksXG4gICAgICAgICAgJ0BjYXBhY2l0b3IvbG9jYWwtbm90aWZpY2F0aW9ucyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvc3R1YnMvY2FwYWNpdG9yLXN0dWIudHMnKSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICBleGNsdWRlOiBbJ0BjYXBhY2l0b3ItY29tbXVuaXR5L2Jpb21ldHJpYy1hdXRoJywgJ0BjYXBhY2l0b3IvbG9jYWwtbm90aWZpY2F0aW9ucyddLFxuICAgICAgfSxcbiAgICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1WLE9BQU8sVUFBVTtBQUNwVyxTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLFdBQVc7QUFGbEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDdEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxLQUFLLEVBQUU7QUFDakMsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sY0FBYztBQUFBLElBQ2hCO0FBQUEsSUFDQSxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsUUFBUTtBQUFBLE1BQ04sdUJBQXVCLEtBQUssVUFBVSxJQUFJLGNBQWM7QUFBQSxNQUN4RCw4QkFBOEIsS0FBSyxVQUFVLElBQUksY0FBYztBQUFBLElBQ2pFO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxHQUFHO0FBQUE7QUFBQSxRQUVoQyx1Q0FBdUMsS0FBSyxRQUFRLGtDQUFXLDZCQUE2QjtBQUFBLFFBQzVGLGtDQUFrQyxLQUFLLFFBQVEsa0NBQVcsNkJBQTZCO0FBQUEsTUFDekY7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsdUNBQXVDLGdDQUFnQztBQUFBLElBQ25GO0FBQUEsRUFDRjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
