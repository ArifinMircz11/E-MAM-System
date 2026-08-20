import { useDevConsole } from '../components/DeveloperConsole/useDevConsole';
import { useDeveloperConsoleStore } from '../stores/developerConsoleStore';

export const useDeveloperConsole = () => {
  const consoleState = useDevConsole();
  const storeState = useDeveloperConsoleStore();

  return {
    ...consoleState,
    ...storeState,
  };
};
