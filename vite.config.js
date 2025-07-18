import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-spa-configs',
      closeBundle() {
        // Upewnij się, że katalog dist istnieje
        const distDir = './dist';
        if (!existsSync(distDir)) {
          try {
            mkdirSync(distDir, { recursive: true });
            console.log('Created dist directory');
          } catch (err) {
            console.error('Error creating dist directory:', err);
            return; // Przerwij jeśli nie można utworzyć katalogu
          }
        }
        
        try {
          // Tworzenie pliku _redirects dla SPA
          writeFileSync('./dist/_redirects', '/*    /index.html   200');
          console.log('Created _redirects file for SPA routing');
        } catch (err) {
          console.error('Error creating _redirects file:', err);
        }
        
        try {
          // Tworzenie pliku web.config dla IIS
          writeFileSync('./dist/web.config', `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`);
          console.log('Created web.config file for SPA routing');
        } catch (err) {
          console.error('Error creating web.config file:', err);
        }
        
        try {
          // Tworzenie pliku staticwebapp.config.json
          writeFileSync('./dist/staticwebapp.config.json', JSON.stringify({
            "navigationFallback": {
              "rewrite": "index.html",
              "exclude": ["/images/*", "/css/*", "/js/*", "/assets/*"]
            }
          }, null, 2));
          console.log('Created staticwebapp.config.json file for SPA routing');
        } catch (err) {
          console.error('Error creating staticwebapp.config.json file:', err);
        }
        
        try {
          // Tworzenie pliku serve.json
          writeFileSync('./dist/serve.json', JSON.stringify({
            "rewrites": [
              { "source": "/admin", "destination": "/index.html" },
              { "source": "/register", "destination": "/index.html" },
              { "source": "/login", "destination": "/index.html" },
              { "source": "/metamorfozy", "destination": "/index.html" },
              { "source": "/blog/**", "destination": "/index.html" },
              { "source": "/services", "destination": "/index.html" },
              { "source": "/about", "destination": "/index.html" },
              { "source": "/reviews", "destination": "/index.html" },
              { "source": "/booking", "destination": "/index.html" },
              { "source": "/**", "destination": "/index.html" }
            ]
          }, null, 2));
          console.log('Created serve.json file for SPA routing');
        } catch (err) {
          console.error('Error creating serve.json file:', err);
        }
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  publicDir: 'public'
})