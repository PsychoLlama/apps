import { createManager } from '../manager';
import { createController, type Controller } from './controller';

/**
 * The controller app code shares. There is one per process; bindings fall
 * back to it when nothing provides another.
 */
export const DEFAULT_CONTROLLER: Controller = createController(createManager());
