document.getElementById('shelfForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const sku = document.getElementById('sku').value.trim();
  const dataFabricacaoRaw = document.getElementById('dataFabricacao').value;
  const dataFabricacao = new Date(dataFabricacaoRaw);
  const produto = produtos.find(p => String(p.SKU) === sku);

  const resultadoDiv = document.getElementById('resultado');
  const body = document.getElementById('body');
  resultadoDiv.innerHTML = "";

  if (!produto) {
    resultadoDiv.innerHTML = "<p>Produto não encontrado.</p>";
    body.className = "";
    return;
  }

  const diasShelf = parseInt(produto.DiasVencer, 10);
  const dataVencimento = new Date(dataFabricacao);
  dataVencimento.setDate(dataVencimento.getDate() + diasShelf);

  const hoje = new Date();
  const diasPassados = Math.floor((hoje - dataFabricacao) / (1000 * 60 * 60 * 24));
  const diasRestantes = diasShelf - diasPassados;
  const porcentagem = Math.max(0, Math.min(100, Math.floor((diasRestantes / diasShelf) * 100)));

  let nivel = "";
  let bgClass = "";

  if (porcentagem >= 80) {
    nivel = "Shelf Ótimo";
    bgClass = "otimo";
  } else if (porcentagem >= 61) {
    nivel = "Alerta Shelf";
    bgClass = "alerta";
  } else {
    nivel = "Shelf Crítico";
    bgClass = "critico";
  }

  function formatDDMMYY(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  body.className = bgClass;
  resultadoDiv.innerHTML = `
    <div class="shelf-box">
      <p><strong>SKU:</strong> ${produto.SKU}</p>
      <p><strong>Descrição:</strong> ${produto.Descricao}</p>
      <p><strong>Data de Fabricação:</strong> ${formatDDMMYY(dataFabricacao)}</p>
      <p><strong>Data de Vencimento (estimada):</strong> ${formatDDMMYY(dataVencimento)}</p>
      <p><strong>Dias Restantes:</strong> ${diasRestantes} dias</p>
      <p><strong>Classificação Shelf:</strong> ${nivel} (${porcentagem}%)</p>
      ${porcentagem <= 60 ? '<p style="color:red;"><strong>DATA CRÍTICA</strong></p>' : ''}
    </div>
  `;
});
