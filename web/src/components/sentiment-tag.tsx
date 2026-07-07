import { sentimentClass } from '@/lib/utils';

export function SentimentTag({ label }: { label: string }) {
  return <span className={sentimentClass(label)}>{label}</span>;
}
