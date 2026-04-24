import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export const getPropertyName = (
  key: TSESTree.Property['key'],
): string | null => {
  if (key.type === AST_NODE_TYPES.Identifier) return key.name;
  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string') {
    return key.value;
  }
  return null;
};
