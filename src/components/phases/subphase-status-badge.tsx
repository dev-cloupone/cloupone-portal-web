import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge';
import { SUBPHASE_STATUS_LABELS, SUBPHASE_STATUS_VARIANTS, type SubphaseStatus } from '../../types/phase.types';

interface Props {
  status: SubphaseStatus;
}

export function SubphaseStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  return <Badge variant={SUBPHASE_STATUS_VARIANTS[status]}>{t(SUBPHASE_STATUS_LABELS[status])}</Badge>;
}
