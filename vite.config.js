import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// HAPUS tanda kurung kurawal { } di baris ini:
import ReactInspector from 'vite-plugin-react-inspector' 

export default defineConfig({
  plugins: [
    ReactInspector(), // Letakkan ini sebelum atau sesudah react() tetap aman
    react(), 
  ],
})
