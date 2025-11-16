// Chave no localStorage
const STORAGE_KEY = "diario_cargas";

// Estado em memória
let cargas = [];
let cargaEmEdicaoId = null;

// Elementos do DOM
const form = document.getElementById("cargaForm");
const salvarBtn = document.getElementById("salvarBtn");
const cancelarEdicaoBtn = document.getElementById("cancelarEdicaoBtn");

const filtroDataInput = document.getElementById("filtroData");
const filtroBuscaInput = document.getElementById("filtroBusca");
const limparFiltrosBtn = document.getElementById("limparFiltrosBtn");

const tabelaCorpo = document.getElementById("tabelaCorpo");
const cardsContainer = document.getElementById("cardsContainer");
const totalCargasSpan = document.getElementById("totalCargas");
const totalPedidosSpan = document.getElementById("totalPedidos");
const totalVolumesSpan = document.getElementById("totalVolumes");
const listaVaziaMsg = document.getElementById("listaVaziaMsg");

// Campos do formulário
const campoData = document.getElementById("data");
const campoNumeroCarga = document.getElementById("numeroCarga");
const campoTransportadora = document.getElementById("transportadora");
const campoRota = document.getElementById("rota");
const campoQtdPedidos = document.getElementById("qtdPedidos");
const campoQtdVolumes = document.getElementById("qtdVolumes");
const campoHorario = document.getElementById("horario");
const campoQuemCarregou = document.getElementById("quemCarregou");
const campoProblema = document.getElementById("problema");
const campoObservacoes = document.getElementById("observacoes");

// Carregar dados na inicialização
document.addEventListener("DOMContentLoaded", () => {
  carregarDoStorage();
  renderizarTabela();

  // Pré-preencher data de hoje
  if (!campoData.value) {
    campoData.value = new Date().toISOString().split("T")[0];
  }
});

// Listener do formulário
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const novaCarga = obterDadosDoFormulario();
  if (!novaCarga) return; // Validação falhou

  if (cargaEmEdicaoId) {
    // Atualizar
    novaCarga.id = cargaEmEdicaoId;
    const idx = cargas.findIndex((c) => c.id === cargaEmEdicaoId);
    if (idx !== -1) {
      cargas[idx] = novaCarga;
    }
    cargaEmEdicaoId = null;
    salvarBtn.textContent = "Salvar carga";
    cancelarEdicaoBtn.classList.add("hidden");
  } else {
    // Criar
    novaCarga.id = gerarId();
    cargas.push(novaCarga);
  }

  salvarNoStorage();
  renderizarTabela();
  form.reset();

  // Voltar data de hoje
  campoData.value = new Date().toISOString().split("T")[0];
});

// Cancelar edição
cancelarEdicaoBtn.addEventListener("click", () => {
  cargaEmEdicaoId = null;
  form.reset();
  campoData.value = new Date().toISOString().split("T")[0];
  salvarBtn.textContent = "Salvar carga";
  cancelarEdicaoBtn.classList.add("hidden");
});

// Filtros
filtroDataInput.addEventListener("change", renderizarTabela);
filtroBuscaInput.addEventListener("input", renderizarTabela);

limparFiltrosBtn.addEventListener("click", () => {
  filtroDataInput.value = "";
  filtroBuscaInput.value = "";
  renderizarTabela();
});

// ----- FUNÇÕES -----

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function carregarDoStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cargas = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Erro ao carregar do storage:", err);
    cargas = [];
  }
}

function salvarNoStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cargas));
  } catch (err) {
    console.error("Erro ao salvar no storage:", err);
  }
}

function obterDadosDoFormulario() {
  const data = campoData.value;
  const numeroCarga = campoNumeroCarga.value.trim();
  const transportadora = campoTransportadora.value.trim();
  const rota = campoRota.value.trim();
  const qtdPedidos = campoQtdPedidos.value ? parseInt(campoQtdPedidos.value, 10) : 0;
  const qtdVolumes = campoQtdVolumes.value ? parseInt(campoQtdVolumes.value, 10) : 0;
  const horario = campoHorario.value;
  const quemCarregou = campoQuemCarregou.value.trim();
  const problema = campoProblema.value;
  const observacoes = campoObservacoes.value.trim();

  if (!data || !numeroCarga || !transportadora) {
    alert("Preencha pelo menos: Data, Nº da carga e Transportadora.");
    return null;
  }

  return {
    id: null, // preenchido depois
    data,
    numeroCarga,
    transportadora,
    rota,
    qtdPedidos: isNaN(qtdPedidos) ? 0 : qtdPedidos,
    qtdVolumes: isNaN(qtdVolumes) ? 0 : qtdVolumes,
    horario,
    quemCarregou,
    problema,
    observacoes,
  };
}

function aplicarFiltros(lista) {
  const dataFiltro = filtroDataInput.value;
  const termo = filtroBuscaInput.value.trim().toLowerCase();

  return lista.filter((carga) => {
    let ok = true;

    if (dataFiltro) {
      ok = ok && carga.data === dataFiltro;
    }

    if (termo) {
      const texto = [
        carga.numeroCarga,
        carga.transportadora,
        carga.rota,
        carga.quemCarregou,
        carga.observacoes,
      ]
        .join(" ")
        .toLowerCase();

      ok = ok && texto.includes(termo);
    }

    return ok;
  });
}

function formatarDataBr(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function renderizarTabela() {
  const listaFiltrada = aplicarFiltros(cargas);

  tabelaCorpo.innerHTML = "";
  cardsContainer.innerHTML = "";

  if (!listaFiltrada.length) {
    listaVaziaMsg.classList.remove("hidden");
  } else {
    listaVaziaMsg.classList.add("hidden");
  }

  let totalPedidos = 0;
  let totalVolumes = 0;

  listaFiltrada.forEach((carga) => {
    totalPedidos += carga.qtdPedidos || 0;
    totalVolumes += carga.qtdVolumes || 0;

    // ---- Linha da tabela (desktop) ----
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="small">${formatarDataBr(carga.data)}</td>
      <td class="small">${escapeHtml(carga.numeroCarga)}</td>
      <td>${escapeHtml(carga.transportadora)}</td>
      <td>${escapeHtml(carga.rota || "")}</td>
      <td class="small">${carga.qtdPedidos || 0}</td>
      <td class="small">${carga.qtdVolumes || 0}</td>
      <td class="small">${carga.horario || ""}</td>
      <td>${escapeHtml(carga.quemCarregou || "")}</td>
      <td class="small">${carga.problema === "sim" ? "Sim" : "Não"}</td>
      <td class="observacoes-cell">${escapeHtml(carga.observacoes || "")}</td>
      <td>
        <div class="acoes">
          <button type="button" class="small" data-acao="editar" data-id="${carga.id}">Editar</button>
          <button type="button" class="small danger" data-acao="excluir" data-id="${carga.id}">Excluir</button>
        </div>
      </td>
    `;

    tabelaCorpo.appendChild(tr);

    // ---- Card (mobile) ----
    const problemaLabel = carga.problema === "sim" ? "Problema" : "OK";
    const problemaClass =
      carga.problema === "sim" ? "badge badge-problema" : "badge badge-ok";

    const card = document.createElement("div");
    card.className = "card-item";
    card.innerHTML = `
      <div class="card-item-header">
        <div>
          <div class="card-title">Carga ${escapeHtml(carga.numeroCarga)}</div>
          <div class="card-subtitle">
            ${formatarDataBr(carga.data)} • ${escapeHtml(carga.transportadora)}
          </div>
        </div>
        <span class="${problemaClass}">${problemaLabel}</span>
      </div>
      <div class="card-item-body">
        <div class="card-row"><strong>Rota:</strong> ${escapeHtml(carga.rota || "-")}</div>
        <div class="card-row"><strong>Pedidos:</strong> ${carga.qtdPedidos || 0}</div>
        <div class="card-row"><strong>Volumes:</strong> ${carga.qtdVolumes || 0}</div>
        <div class="card-row"><strong>Horário:</strong> ${carga.horario || "-"}</div>
        <div class="card-row"><strong>Carregou:</strong> ${escapeHtml(carga.quemCarregou || "-")}</div>
        <div class="card-row full"><strong>Obs.:</strong> ${escapeHtml(carga.observacoes || "-")}</div>
      </div>
      <div class="acoes">
        <button type="button" class="small" data-acao="editar" data-id="${carga.id}">Editar</button>
        <button type="button" class="small danger" data-acao="excluir" data-id="${carga.id}">Excluir</button>
      </div>
    `;

    cardsContainer.appendChild(card);
  });

  totalCargasSpan.textContent = listaFiltrada.length;
  totalPedidosSpan.textContent = totalPedidos;
  totalVolumesSpan.textContent = totalVolumes;

  // Ações dos botões da tabela
  tabelaCorpo.querySelectorAll("button[data-acao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const acao = btn.getAttribute("data-acao");
      const id = btn.getAttribute("data-id");
      if (acao === "editar") {
        iniciarEdicao(id);
      } else if (acao === "excluir") {
        excluirCarga(id);
      }
    });
  });

  // Ações dos botões dos cards (mobile)
  cardsContainer.querySelectorAll("button[data-acao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const acao = btn.getAttribute("data-acao");
      const id = btn.getAttribute("data-id");
      if (acao === "editar") {
        iniciarEdicao(id);
      } else if (acao === "excluir") {
        excluirCarga(id);
      }
    });
  });
}

function iniciarEdicao(id) {
  const carga = cargas.find((c) => c.id === id);
  if (!carga) return;

  cargaEmEdicaoId = id;

  campoData.value = carga.data;
  campoNumeroCarga.value = carga.numeroCarga;
  campoTransportadora.value = carga.transportadora;
  campoRota.value = carga.rota || "";
  campoQtdPedidos.value = carga.qtdPedidos || "";
  campoQtdVolumes.value = carga.qtdVolumes || "";
  campoHorario.value = carga.horario || "";
  campoQuemCarregou.value = carga.quemCarregou || "";
  campoProblema.value = carga.problema || "nao";
  campoObservacoes.value = carga.observacoes || "";

  salvarBtn.textContent = "Atualizar carga";
  cancelarEdicaoBtn.classList.remove("hidden");

  // Scroll para o topo do formulário
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirCarga(id) {
  const carga = cargas.find((c) => c.id === id);
  const mensagem = carga
    ? `Tem certeza que deseja excluir a carga ${carga.numeroCarga} de ${formatarDataBr(
        carga.data
      )}?`
    : "Tem certeza que deseja excluir esta carga?";

  if (!confirm(mensagem)) return;

  cargas = cargas.filter((c) => c.id !== id);
  if (cargaEmEdicaoId === id) {
    cargaEmEdicaoId = null;
    form.reset();
    salvarBtn.textContent = "Salvar carga";
    cancelarEdicaoBtn.classList.add("hidden");
  }
  salvarNoStorage();
  renderizarTabela();
}

// Função simples para evitar HTML malicioso
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
