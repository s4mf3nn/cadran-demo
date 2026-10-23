import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  core: { disableTelemetry: true },
  framework: '@storybook/react-vite',
  // Le faux endpoint IA du serveur de dev n'a rien à faire dans Storybook.
  viteFinal: (config) => ({
    ...config,
    plugins: (config.plugins ?? []).flat(Infinity as 1).filter((p) => !(p && 'name' in p && p.name === 'mock-llm')),
  }),
};

export default config;
