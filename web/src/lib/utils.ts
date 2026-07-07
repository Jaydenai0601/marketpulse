export function formatDate(dateStr: string) {
  const d = new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(d.getTime())) return dateStr;
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`;
}

export function scoreColor(score: number) {
  if (score > 0) return '#2ebd85';
  if (score < 0) return '#eb5757';
  return '#f2c94c';
}

export function sentimentClass(label: string) {
  if (label.includes('偏多')) return 'tag-bull';
  if (label.includes('偏空')) return 'tag-bear';
  return 'tag-neutral';
}

export function scoreClass(score: number) {
  if (score > 55) return 'score-bull';
  if (score < 45) return 'score-bear';
  return '';
}
