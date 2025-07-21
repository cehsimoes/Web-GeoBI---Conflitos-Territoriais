// Importa o componente Chart da biblioteca react-google-charts
import { Chart } from 'react-google-charts';

// Define a interface das props recebidas pelo componente
interface Props {
  analysisData: any[]; // Espera um array de objetos com dados a serem analisados
}

// Componente responsável por renderizar gráficos baseados em dados de análise
export default function ChartsComponent({ analysisData }: Props) {
  // Reduz os dados para gerar estatísticas agrupadas por sigla de estado (UF)
  const stats = analysisData.reduce((acc: any, item: any) => {
    const uf = item.properties.siglaUF;       // Extrai a sigla do estado (UF)
    const area = item.properties.area || 0;   // Obtém a área do item, ou 0 se não estiver definida

    // Se a UF ainda não foi registrada no acumulador, inicializa os valores
    if (!acc[uf]) acc[uf] = { count: 0, area: 0 };

    // Incrementa o contador e a área total para a UF correspondente
    acc[uf].count += 1;
    acc[uf].area += area;

    return acc; // Retorna o acumulador atualizado
  }, {}); // Inicialmente o acumulador é um objeto vazio

  // Prepara os dados no formato necessário para o gráfico de pizza (quantidade por UF)
  const pieData =
