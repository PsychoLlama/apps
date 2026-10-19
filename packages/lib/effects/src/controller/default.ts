import { createManager } from '../manager';
import { createController, type Controller } from './controller';

/**
 * The controller app code shares. There is one per process; `EffectsRoot`
 * provides it unless given another.
 */
export const DEFAULT_CONTROLLER: Controller = createController(createManager());
