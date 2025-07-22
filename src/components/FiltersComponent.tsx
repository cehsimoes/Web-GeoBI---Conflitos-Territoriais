// Define the Props interface expected by the FiltersComponent
interface Props {
  selectedStates: string[];             // Array containing the currently selected states
  onChange: (selected: string[]) => void; // Callback function to update the selected states
}

// List of Brazilian state abbreviations (UFs) used in the dropdown
const estadosBrasileiros = [
  "AM","MG","PA"];

// FiltersComponent: renders a multi-select dropdown to filter by Brazilian states
export default function FiltersComponent({ selectedStates, onChange }: Props) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Label for the dropdown */}
      <label>Filter by State:</label><br />
      
      {/* Multi-select dropdown input */}
      <select
        multiple                              // Allows multiple states to be selected
        value={selectedStates}               // Current selected states
        onChange={e => {
          // Convert selected options into an array of values
          const selected = Array.from(e.target.selectedOptions, opt => opt.value);
          onChange(selected);                // Trigger the callback with the new selection
        }}
        style={{ width: '100%', height: '150px' }} // Styling for better UX
      >
        {/* Populate the dropdown with state options */}
        {estadosBrasileiros.map(sigla => (
          <option key={sigla} value={sigla}>{sigla}</option>
        ))}
      </select>
    </div>
  );
}
