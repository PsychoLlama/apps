import { createContext, useContext } from 'solid-js';
import { DEFAULT_CONTROLLER } from '../controller/default';
import type { Controller } from '../controller/controller';

/**
 * Provide a controller to a subtree. Component tests wrap the tree in it
 * with a test controller's so nothing leaks into the default.
 */
export const ControllerContext = createContext<Controller>(DEFAULT_CONTROLLER);

/** The controller in scope: the provided one, else the default. */
export const useController = (): Controller => useContext(ControllerContext);
