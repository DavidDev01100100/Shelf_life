document.getElementById('shelfForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const sku = document.getElementById('sku').value.trim();
  const dataVencimentoRaw = document.getElementById('dataVencimento').value;

  // Interpreta DD/MM/AA no horário LOCAL (evita o deslocamento de fuso do
  // formato ISO "AAAA-MM-DD", que é lido como UTC) e valida a data.
  // Retorna null se a data for incompleta ou não existir (ex.: 31/02/26).
  function parseDateBR(dataStr) {
    if (!/^\d{2}\/\d{2}\/\d{2}$/.test(dataStr)) return null;
    const [dd, mm, yy] = dataStr.split('/').map(Number);
    const fullYear = yy < 50 ? 2000 + yy : 1900 + yy;
    const data = new Date(fullYear, mm - 1, dd);
    const existe =
      data.getFullYear() === fullYear &&
      data.getMonth() === mm - 1 &&
      data.getDate() === dd;
    return existe ? data : null;
  }

  const dataVencimento = parseDateBR(dataVencimentoRaw);
  const produto = produtos.find(p => String(p.SKU) === sku);

  const resultadoDiv = document.getElementById('resultado');
  const body = document.getElementById('body');
  resultadoDiv.innerHTML = "";

  if (!dataVencimento) {
    resultadoDiv.innerHTML = "<p>Data inválida. Use o formato DD/MM/AA com uma data existente.</p>";
    body.className = "";
    return;
  }

  if (!produto) {
    resultadoDiv.innerHTML = "<p>Produto não encontrado.</p>";
    body.className = "";
    return;
  }

  const diasShelf = parseInt(produto.DiasVencer, 10);
  // "Hoje" à meia-noite local, para contar dias inteiros entre duas datas
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const diasRestantes = Math.round((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
  const porcentagem = Math.max(0, Math.min(100, Math.floor((diasRestantes / diasShelf) * 100)));

  let nivel = "";
  let bgClass = "";
  let dataCriticaMsg = "";

  if (porcentagem >= 80) {
    nivel = "Shelf Ótimo";
    bgClass = "otimo";
  } else if (porcentagem >= 61) {
    nivel = "Alerta Shelf";
    bgClass = "alerta";
  } else {
    nivel = "Shelf Crítico";
    bgClass = "critico";
    dataCriticaMsg = `<p class="data-critica">DATA CRÍTICA</p>`;
  }

  function formatDDMMYY(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  // Cálculo ajustado da data de fabricação com mesmo dia do mês
  const dataFabricacao = new Date(dataVencimento);
  const diaVencimento = dataVencimento.getDate();

  // Subtrai shelf life em dias
  dataFabricacao.setDate(dataFabricacao.getDate() - diasShelf);

  // Ajusta para manter o mesmo "dia" da data de vencimento, se possível
  const mesCorrigido = dataFabricacao.getMonth();
  dataFabricacao.setDate(Math.min(diaVencimento, new Date(dataFabricacao.getFullYear(), mesCorrigido + 1, 0).getDate()));

  body.className = bgClass;
  resultadoDiv.innerHTML = `
    <div class="shelf-box">
      <p><strong>SKU:</strong> ${produto.SKU}</p>
      <p><strong>Descrição:</strong> ${produto.Descricao}</p>
      <p><strong>Data de Fabricação (estimada):</strong> ${formatDDMMYY(dataFabricacao)}</p>
      <p><strong>Data de Vencimento:</strong> ${formatDDMMYY(dataVencimento)}</p>
      <p><strong>Dias Restantes:</strong> ${diasRestantes} dias</p>
      <p><strong>Classificação Shelf:</strong> ${nivel} (${porcentagem}%)</p>
      ${dataCriticaMsg}
    </div>
  `;
});

// Máscara de entrada para DD/MM/AA
document.getElementById('dataVencimento').addEventListener('input', function (e) {
  let input = e.target.value.replace(/\D/g, '').slice(0, 6);
  if (input.length >= 5) {
    input = input.replace(/(\d{2})(\d{2})(\d{0,2})/, '$1/$2/$3');
  } else if (input.length >= 3) {
    input = input.replace(/(\d{2})(\d{0,2})/, '$1/$2');
  }
  e.target.value = input;
});
