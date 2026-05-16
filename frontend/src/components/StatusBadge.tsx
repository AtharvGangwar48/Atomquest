const classMap: Record<string, string> = {
  DRAFT:     'badge badge-draft',
  SUBMITTED: 'badge badge-submitted',
  APPROVED:  'badge badge-approved',
  REWORK:    'badge badge-rework',
  PENDING:   'badge badge-pending',
  ON_TRACK:  'badge badge-on-track',
  COMPLETED: 'badge badge-completed',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={classMap[status] ?? 'badge badge-draft'}>
      {status.replace('_', ' ')}
    </span>
  );
}
