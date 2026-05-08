import { defineConfig } from 'vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { cpSync, existsSync } from 'node:fs';

function copySkillsPlugin() {
  return {
    name: 'copy-skills',
    closeBundle() {
      if (existsSync('skills')) cpSync('skills', 'dist/skills', { recursive: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [vueJsx(), copySkillsPlugin()],
});
