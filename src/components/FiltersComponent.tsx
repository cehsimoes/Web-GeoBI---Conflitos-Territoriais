interface Props {
  selectedStates: string[];
  onChange: (selected: string[]) => void;
}

const estadosBrasileiros = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG",
  "MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR",
  "RS","SC","SE","SP","TO"
];

export default function FiltersComponent({ selectedStates, onChange }: Props) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label>Filtrar por Estado:</label><br />
      <select multiple value={selectedStates} onChange={e => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
        onChange(selected);
      }} style={{ width: '100%', height: '150px' }}>
        {estadosBrasileiros.map(sigla => (
          <option key={sigla} value={sigla}>{sigla}</option>
        ))}
      </select>
    </div>
  );
}
