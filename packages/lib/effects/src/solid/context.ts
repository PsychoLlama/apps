import { createContext, useContext } from 'solid-js';
import { createController, type Controller } from '../controller';
import { createManager, type Manager } from '../manager';

/** The manager app code shares when nothing provides another. */
export const DEFAULT_MANAGER: Manager = createManager();

/**
 * Provide a manager to a subtree. Component tests wrap the tree in it with
 * a test controller's manager so nothing leaks into the default.
 */
export const ManagerContext = createContext<Manager>(DEFAULT_MANAGER);

/** The manager in scope: the provided one, else the default. */
export const useManager = (): Manager => useContext(ManagerContext);

/** The manager's operations, bound to the manager in scope. */
export const useController = (): Controller => createController(useManager());
