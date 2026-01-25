import useHomeContent from '../hooks/useHomeContent';

export default function EventsPage() {
  const { homeContent } = useHomeContent();
  return homeContent.events.map(e => <div key={e.id}>{e.title}</div>);
}
