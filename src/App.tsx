import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { Chart } from 'react-google-charts';

interface GeoJsonData {
  type: string;
  features: any[];
}

// Lista de estados brasileiros (siglas)
const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES',
  'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

// Componente para ajustar zoom automaticamente para dados no mapa
function FitBounds({ geojson }: { geojson: GeoJsonData | null }) {
  const map = useMap();

  useEffect(() => {
    if (geojson && geojson.features.length > 0) {
      const coords = geojson.features.flatMap((f) => turf.getCoords(f));
      const flatCoords = coords.flat(3);
      const latLngs = [];
      // coords podem ter profundidade variada, vamos garantir [lat,lng] extração correta
      // Simplificação: pegamos primeiro par (lng, lat) de cada polígono/ponto
      geojson.features.forEach((feature) => {
        try {
          const bbox = turf.bbox(feature);
          latLngs.push([bbox[1], bbox[0]]); // [lat, lng]
          latLngs.push([bbox[3], bbox[2]]);
        } catch {}
      });
      if (latLngs.length > 0) {
        map.fitBounds(latLngs as any, { padding: [50, 50] });
      }
    }
  }, [geojson, map]);

  return null;
}

export default function App() {
  const [imoveis, setImoveis] = useState<GeoJsonData | null>(null);
  const [terras, setTerras] = useState<GeoJsonData | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  // Filtrar imóveis e terras por estado (suposição: propriedade "sigla_uf" em properties)
  function filtrarPorEstado(geojson: GeoJsonData | null, estados: string[]) {
    if (!geojson) return null;
    if (estados.length === 0) return geojson; // sem filtro, retorna tudo

    const filteredFeatures = geojson.features.filter((f) => {
      const uf = f.properties?.sigla_uf || f.properties?.UF || f.properties?.estado || '';
      return estados.includes(uf);
    });

    return {
      ...geojson,
      features: filteredFeatures,
    };
  }

  // Cálculo área em km²
  function calcularAreaKm2(geojson: GeoJsonData | null) {
    if (!geojson || geojson.features.length === 0) return 0;
    try {
      const area_m2 = turf.area(geojson);
      return area_m2 / 1_000_000;
    } catch {
      return 0;
    }
  }

  // Calcular interseções entre imóveis e terras indígenas
  function calcularIntersecao(imoveisGeojson: GeoJsonData | null, terrasGeojson: GeoJsonData | null) {
    if (!imoveisGeojson || !terrasGeojson) return null;

    const intersecoes = [];

    imoveisGeojson.features.forEach((imovel) => {
      terrasGeojson.features.forEach((terra) => {
        try {
          const intersect = turf.intersect(imovel, terra);
          if (intersect) {
            intersecoes.push(intersect);
          }
        } catch {
          // ignorar erros
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features: intersecoes,
    };
  }

  // Estados filtrados
  const imoveisFiltrados = filtrarPorEstado(imoveis, selectedStates);
  const terrasFiltradas = filtrarPorEstado(terras, selectedStates);
  const intersecaoGeojson = calcularIntersecao(imoveisFiltrados, terrasFiltradas);

  // Áreas
  const areaImoveisKm2 = calcularAreaKm2(imoveisFiltrados);
  const areaTerrasKm2 = calcularAreaKm2(terrasFiltradas);
  const areaIntersecaoKm2 = calcularAreaKm2(intersecaoGeojson);

  useEffect(() => {
    // Carregar GeoJSON dos arquivos públicos
    fetch('/data/imoveis_fake_100.geojson')
      .then((res) => res.json())
      .then(setImoveis)
      .catch(() => setImoveis(null));

    fetch('/data/terras_indigenas_fake.geojson')
      .then((res) => res.json())
      .then(setTerras)
      .catch(() => setTerras(null));
  }, []);

  function handleCheckboxChange(sigla: string) {
    setSelectedStates((prev) =>
      prev.includes(sigla)
        ? prev.filter((s) => s !== sigla)
        : [...prev, sigla]
    );
  }

  // Dados para gráfico de barras exemplo (imóveis por estado)
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

  // Dados para gráfico de pizza exemplo (área por tipo)
  const chartDataPie = [
    ['Tipo', 'Área (km²)'],
    ['Imóveis', areaImoveisKm2],
    ['Terras Indígenas', areaTerrasKm2],
    ['Interseção', areaIntersecaoKm2],
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside
        style={{
          width: '320px',
          overflowY: 'auto',
          borderRight: '1px solid #ccc',
          padding: '1rem',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h2>Filtro por Estado</h2>
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

        <h3>Resumo de Áreas (km²)</h3>
        <p><strong>Imóveis:</strong> {areaImoveisKm2.toFixed(2)}</p>
        <p><strong>Terras Indígenas:</strong> {areaTerrasKm2.toFixed(2)}</p>
        <p><strong>Interseção:</strong> {areaIntersecaoKm2.toFixed(2)}</p>

        <h3>Gráfico: Número de Imóveis por Estado</h3>
        <Chart
          chartType="BarChart"
          width="100%"
          height="200px"
          data={chartDataBar}
          options={{
            legend: { position: 'none' },
            chartArea: { width: '80%' },
            hAxis: { title: 'Número de Imóveis' },
            vAxis: { title: 'Estado' },
          }}
        />

        <h3>Gráfico: Área por Tipo</h3>
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

      <main style={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          center={[-15.8, -47.9]}
          zoom={4}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {imoveisFiltrados && (
            <GeoJSON
              data={imoveisFiltrados}
              style={{ color: 'blue', weight: 1, fillOpacity: 0.3 }}
            />
          )}

          {terrasFiltradas && (
            <GeoJSON
              data={terrasFiltradas}
              style={{ color: 'green', weight: 1, fillOpacity: 0.3 }}
            />
          )}

          {intersecaoGeojson && intersecaoGeojson.features.length > 0 && (
            <GeoJSON
              data={intersecaoGeojson}
              style={{ color: 'red', weight: 2, fillOpacity: 0.4 }}
            />
          )}

          {/* Ajusta o zoom para imóveis */}
          <FitBounds geojson={imoveisFiltrados} />
        </MapContainer>
      </main>
    </div>
  );
}
