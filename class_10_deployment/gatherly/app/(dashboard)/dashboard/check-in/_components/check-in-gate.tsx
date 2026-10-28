import { requireOrganizer } from '../../../../../lib/session';
import { CheckInForm } from './check-in-form';

export async function CheckInGate() {
  await requireOrganizer('/dashboard/check-in');
  return <CheckInForm />;
}
