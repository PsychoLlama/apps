import type { Component, ParentProps } from 'solid-js';
import type { Controller } from '../controller/controller';
import { ControlledRoot } from '../solid/context';
import type { RenderContextOptions } from './controller';

/** A root component bound to the controller, for components under test. */
export const createRenderContext =
  (
    controller: Controller,
    options: RenderContextOptions = {},
  ): Component<ParentProps> =>
  (props) => (
    <ControlledRoot controller={controller} mounted={options.mounted}>
      {props.children}
    </ControlledRoot>
  );
