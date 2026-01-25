function SessionTermSelector({ value, onChange }) {
  return (
    <div className="selector-box">
      <select
        value={value.session}
        onChange={e => onChange({ ...value, session: e.target.value })}
      >
        <option value="">Select Session</option>
        <option>2024/2025</option>
        <option>2025/2026</option>
        <option>2026/2027</option>
      </select>

      <select
        value={value.term}
        onChange={e => onChange({ ...value, term: e.target.value })}
      >
        <option value="">Select Term</option>
        <option>First Term</option>
        <option>Second Term</option>
        <option>Third Term</option>
      </select>
    </div>
  );
}

export default SessionTermSelector;
