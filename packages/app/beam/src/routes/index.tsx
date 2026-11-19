import { Flex } from '@lib/ui';
import { BeamFrame } from '../components/beam-frame';
import { GroupList } from '../components/group-list';
import { NewGroupForm } from '../components/new-group-form';

/** Beam home at `/`: the groups this device holds, and a way to start one. */
const BeamHome = () => (
  <BeamFrame>
    <Flex as="div" direction="column" gap={5}>
      <GroupList />
      <NewGroupForm />
    </Flex>
  </BeamFrame>
);

export default BeamHome;
