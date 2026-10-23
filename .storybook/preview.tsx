import type { Preview } from '@storybook/react-vite';
import { TooltipProvider } from '@/components/ui/tooltip';
import '../src/index.css';

// Thème sombre uniquement, comme l'application (index.html porte class="dark").
document.documentElement.classList.add('dark');

const preview: Preview = {
  decorators: [(Story) => <TooltipProvider><Story /></TooltipProvider>],
  parameters: {
    layout: 'centered',
    backgrounds: { options: { app: { name: 'Cadran', value: '#000000' } } },
    controls: { matchers: { date: /Date$/ } },
    a11y: { test: 'todo' },
    viewport: {
      options: {
        mobile: { name: 'Mobile', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        desktop: { name: 'Bureau', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
      },
    },
  },
  initialGlobals: { backgrounds: { value: 'app' } },
  tags: ['autodocs'],
};

export default preview;
