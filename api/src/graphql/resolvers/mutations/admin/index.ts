import userMutations from './users';
import roleMutations from './roles';
import delegationMutations from './delegation';
import appSettingsMutations from './appSettings';

// Combine all admin mutations into a single export
export default {
  ...userMutations,
  ...roleMutations,
  ...delegationMutations,
  ...appSettingsMutations,
};
