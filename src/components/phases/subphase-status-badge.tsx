import { Badge } from '../ui/badge';
import { SUBPHASE_STATUS_LABELS, SUBPHASE_STATUS_VARIANTS, type SubphaseStatus } from '../../types/phase.types';

interface Props {
  status: SubphaseStatus;
}

export function SubphaseStatusBadge({ status }: Props) {
  return <Badge variant={SUBPHASE_STATUS_VARIANTS[status]}>{SUBPHASE_STATUS_LABELS[status]}</Badge>;
}
