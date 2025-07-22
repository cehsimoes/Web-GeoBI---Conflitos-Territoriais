import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { Chart } from 'react-google-charts';

interface GeoJsonData {
  type: string;
  features: any[];
}

// List of Brazilian states (abbreviations)
const estadosBrasileiros = [
  'AM', 'PA', 'MG'];

// Component to auto-fit map view to GeoJSON data bounds
function FitBounds({ geojson }: { geojson: GeoJsonData | null }) {
  const map = useMap();

  useEffect(() => {
    if (geojson && geojson.features.length > 0) {
      // Compute bounding boxes for each feature to extract map extent
      const latLngs = [];

      geojson.features.forEach((feature) => {
        try {
          const bbox = turf.bbox(feature); // [minX, minY, maxX, maxY]
          latLngs.push([bbox[1], bbox[0]]); // bottom-left corner [lat, lng]
          latLngs.push([bbox[3], bbox[2]]); // top-right corner [lat, lng]
        } catch {
          // Skip feature if bbox fails
        }
      });

      // Fit map to bounds with padding
      if (latLngs.length > 0) {
        map.fitBounds(latLngs as any, { padding: [50, 50] });
      }
    }
  }, [geojson, map]);

  return null;
}

export default function App() {
  // States to hold loaded GeoJSON data
  const [imoveis, setImoveis] = useState<GeoJsonData | null>(null);
  const [terras, setTerras] = useState<GeoJsonData | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]); // User-selected states

  // Filters features by selected Brazilian states
  function filtrarPorEstado(geojson: GeoJsonData | null, estados: string[]) {
    if (!geojson) return null;
    if (estados.length === 0) return geojson; // No filter, return all features

    // Match by different possible property names for UF
    const filteredFeatures = geojson.features.filter((f) => {
      const uf = f.properties?.sigla_uf || f.properties?.UF || f.properties?.estado || '';
      return estados.includes(uf);
    });

    return {
      ...geojson,
      features: filteredFeatures,
    };
  }

  // Calculates the total area (in km²) of a GeoJSON
  function calcularAreaKm2(geojson: GeoJsonData | null) {
    if (!geojson || geojson.features.length === 0) return 0;
    try {
      const area_m2 = turf.area(geojson); // Returns area in square meters
      return area_m2 / 1_000_000; // Convert to km²
    } catch {
      return 0;
    }
  }

  // Computes the intersection between two GeoJSONs
  function calcularIntersecao(imoveisGeojson: GeoJsonData | null, terrasGeojson: GeoJsonData | null) {
    if (!imoveisGeojson || !terrasGeojson) return null;

    const intersecoes = [];

    // Compare each property with each indigenous land
    imoveisGeojson.features.forEach((imovel) => {
      terrasGeojson.features.forEach((terra) => {
        try {
          const intersect = turf.intersect(imovel, terra); // Returns intersection polygon
          if (intersect) {
            intersecoes.push(intersect); // Save valid intersection
          }
        } catch {
          // Ignore errors for invalid geometry
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features: intersecoes,
    };
  }

  // Apply filters and compute intersections
  const imoveisFiltrados = filtrarPorEstado(imoveis, selectedStates);
  const terrasFiltradas = filtrarPorEstado(terras, selectedStates);
  const intersecaoGeojson = calcularIntersecao(imoveisFiltrados, terrasFiltradas);

  // Area summaries
  const areaImoveisKm2 = calcularAreaKm2(imoveisFiltrados);
  const areaTerrasKm2 = calcularAreaKm2(terrasFiltradas);
  const areaIntersecaoKm2 = calcularAreaKm2(intersecaoGeojson);

  useEffect(() => {
    // Load real estate GeoJSON
    fetch('/data/imoveis_fake_100.geojson')
      .then((res) => res.json())
      .then(setImoveis)
      .catch(() => setImoveis(null));

    // Load indigenous lands GeoJSON
    fetch('/data/terras_indigenas_fake.geojson')
      .then((res) => res.json())
      .then(setTerras)
      .catch(() => setTerras(null));
  }, []);

  // Handles checkbox state change for each state
  function handleCheckboxChange(sigla: string) {
    setSelectedStates((prev) =>
      prev.includes(sigla)
        ? prev.filter((s) => s !== sigla)
        : [...prev, sigla]
    );
  }

  // Prepare data for bar chart (number of properties per state)
  const chartDataBar = [
    ['Estado', 'Número de Imóveis'],
    ...estadosBrasileiros.map((uf) => {
      const count = imoveisFiltrados?.features.filter((f) => {
        const ufProp = f.properties?.sigla_uf || f.properties?.UF || f.properties?.estado || '';
        return ufProp === uf;
      }).length || 0;
      return [uf, count];
    }),
  ];

  // Prepare data for pie chart (area breakdown)
  const chartDataPie = [
    ['Tipo', 'Área (km²)'],
    ['Imóveis', areaImoveisKm2],
    ['Terras Indígenas', areaTerrasKm2],
    ['Interseção', areaIntersecaoKm2],
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar with filters and charts */}
      <aside
        style={{
          width: '320px',
          overflowY: 'auto',
          borderRight: '1px solid #ccc',
          padding: '1rem',
          backgroundColor: '#f9f9f9',
        }}
      >
        {/* State selection checkboxes */}
        <h2>Filter by State</h2>
        <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 20 }}>
          {estadosBrasileiros.map((sigla) => (
            <label key={sigla} style={{ display: 'block', marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={selectedStates.includes(sigla)}
                onChange={() => handleCheckboxChange(sigla)}
              />
              {' '}{sigla}
            </label>
          ))}
        </div>

        {/* Area statistics */}
        <h3>Area Summary (km²)</h3>
        <p><strong>Properties:</strong> {areaImoveisKm2.toFixed(2)}</p>
        <p><strong>Indigenous Lands:</strong> {areaTerrasKm2.toFixed(2)}</p>
        <p><strong>Intersection:</strong> {areaIntersecaoKm2.toFixed(2)}</p>

        {/* Bar chart: number of properties per state */}
        <h3>Chart: Properties per State</h3>
        <Chart
          chartType="BarChart"
          width="100%"
          height="200px"
          data={chartDataBar}
          options={{
            legend: { position: 'none' },
            chartArea: { width: '80%' },
            hAxis: { title: 'Number of Properties' },
            vAxis: { title: 'State' },
          }}
        />

        {/* Pie chart: area distribution */}
        <h3>Chart: Area by Type</h3>
        <Chart
          chartType="PieChart"
          width="100%"
          height="200px"
          data={chartDataPie}
          options={{
            pieHole: 0.4,
            legend: { position: 'right' },
          }}
        />
      </aside>

      {/* Main content: interactive map */}
      <main style={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          center={[-15.8, -47.9]} // Brazil central coordinates
          zoom={4}
          scrollWheelZoom={true}
        >
          {/* Base map layer from OpenStreetMap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {/* Render filtered properties in blue */}
          {imoveisFiltrados && (
            <GeoJSON
              data={imoveisFiltrados}
              style={{ color: 'blue', weight: 1, fillOpacity: 0.3 }}
            />
          )}

          {/* Render filtered indigenous lands in green */}
          {terrasFiltradas && (
            <GeoJSON
              data={terrasFiltradas}
              style={{ color: 'green', weight: 1, fillOpacity: 0.3 }}
            />
          )}

          {/* Render intersection areas in red */}
          {intersecaoGeojson && intersecaoGeojson.features.length > 0 && (
            <GeoJSON
              data={intersecaoGeojson}
              style={{ color: 'red', weight: 2, fillOpacity: 0.4 }}
            />
          )}

          {/* Auto-zoom to filtered properties */}
          <FitBounds geojson={imoveisFiltrados} />
        </MapContainer>
      </main>
    </div>
  );
}
