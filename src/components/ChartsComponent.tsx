// Import the Chart component from the react-google-charts library
import { Chart } from 'react-google-charts';

// Define the expected structure of the component's props
interface Props {
  analysisData: any[]; // An array of objects representing the analysis data
}

// Component responsible for rendering charts based on the provided analysis data
export default function ChartsComponent({ analysisData }: Props) {
  // Aggregate statistics grouped by state abbreviation (UF - "siglaUF")
  const stats = analysisData.reduce((acc: any, item: any) => {
    const uf = item.properties.siglaUF;         // Get the state abbreviation
    const area = item.properties.area || 0;     // Get the area value or default to 0 if missing

    // Initialize state entry in accumulator if it doesn't exist yet
    if (!acc[uf]) acc[uf] = { count: 0, area: 0 };

    // Increment the counter and area for the corresponding state
    acc[uf].count += 1;
    acc[uf].area += area;

    return acc; // Return the updated accumulator
  }, {}); // Start with an empty object for accumulation

  // Prepare the data for the pie chart: counts by state
  const pieData = [['State', 'Count']];

  // Prepare the data for the bar chart: total area by state
  const barData = [['State', 'Total Area']];

  // Populate both datasets using the aggregated stats
  Object.entries(stats).forEach(([uf, val]: any) => {
    pieData.push([uf, val.count]);  // Add count data to pie chart
    barData.push([uf, val.area]);   // Add area data to bar chart
  });

  // Render both charts (Pie and Bar) inside a scrollable container
  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      {/* Pie Chart: Shows the number of items per state */}
      <Chart chartType="PieChart" data={pieData} width="100%" height="300px" />

      {/* Bar Chart: Shows the total area of items per state */}
      <Chart chartType="BarChart" data={barData} width="100%" height="300px" />
    </div>
  );
}
