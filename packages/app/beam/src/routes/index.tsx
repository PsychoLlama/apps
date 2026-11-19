import { BeamFrame } from '../components/beam-frame';
import { GroupList } from '../components/group-list';

/**
 * Beam home at `/`: the groups this device holds. A device with none is
 * given one and sent to it.
 */
const BeamHome = () => (
  <BeamFrame>
    <GroupList />
  </BeamFrame>
);

export default BeamHome;
