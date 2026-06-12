import { _supabase } from "./supabase.js";
import { checkSession, logout } from "./auth.js";

let session = null;
let agendamentos = [];
let minhaLoja = null;
let lojas = [];

export async function initDono() {
    session = await checkSession();
    if (!session) return window.location.href = 'Login.html';
    
    await carregarDadosLoja();
    await carregarAgendamentos();
    await carregarTodasLojas();
    atualizarDashboard();
    filtrarAgenda('hoje');
}

async function carregarDadosLoja() {
    const { data: store, error } = await _supabase
        .from('lojas')
        .select('*')
        .eq('usuario_id', session.user.id)
        .single();

    if (error) {
        console.error("Erro ao carregar loja:", error);
        return;
    }

    minhaLoja = store;
    document.getElementById("header-loja-nome").innerText = store.nome_loja;
    document.getElementById("header-loja-logo").src = store.logo_url || 'https://via.placeholder.com/150';
    
    document.getElementById("loja-nome-edit").value = store.nome_loja;
    document.getElementById("loja-desc-edit").value = store.descricao;
    document.getElementById("loja-tel-edit").value = store.telefone || '';
    document.getElementById("loja-zap-edit").value = store.whatsapp || '';
    document.getElementById("loja-end-edit").value = store.endereco || '';
    document.getElementById("loja-logo-preview").src = store.logo_url || 'https://via.placeholder.com/150';
    
    if (document.getElementById("meta-dia-input")) {
        document.getElementById("meta-dia-input").value = store.faturamento || 1000;
    }
}

async function carregarAgendamentos() {
    if (!minhaLoja) return;
    const { data } = await _supabase
        .from('agendamentos')
        .select('*')
        .eq('lojaId', minhaLoja.usuario_id);
    agendamentos = data || [];
}

async function carregarTodasLojas() {
    const { data } = await _supabase.from('lojas').select('*');
    lojas = data || [];
}

function atualizarDashboard() {
    if (!minhaLoja) return;
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => a.lojaId === minhaLoja.usuario_id && a.data === hoje && a.status === "Confirmado");
    
    const fatHoje = agendamentosHoje.reduce((acc, curr) => acc + curr.valor, 0);
    const metaDia = minhaLoja.faturamento || 1000;
    const percMeta = Math.min((fatHoje / metaDia) * 100, 100);

    document.getElementById("dash-clientes").innerText = agendamentosHoje.length;
    document.getElementById("dash-faturamento").innerText = `R$ ${fatHoje.toFixed(2)}`;
    document.getElementById("dash-meta").innerText = `${percMeta.toFixed(1)}%`;
    document.getElementById("dash-meta-progress").style.width = `${percMeta}%`;
}

function filtrarAgenda(tipo) {
    const tbody = document.getElementById("tabelaAgendaDono");
    tbody.innerHTML = "";
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    let filtrados = agendamentos.filter(a => a.lojaId === minhaLoja.usuario_id);

    if(tipo === 'hoje') {
        const hojeStr = hoje.toISOString().split('T')[0];
        filtrados = filtrados.filter(a => a.data === hojeStr);
    } else {
        const limite = new Date();
        limite.setDate(hoje.getDate() + (tipo === '7dias' ? 7 : 30));
        filtrados = filtrados.filter(a => {
            const d = new Date(a.data);
            return d >= hoje && d <= limite;
        });
    }

    filtrados.sort((a,b) => new Date(a.data) - new Date(b.data)).forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>${a.clienteNome}</td>
                <td>${a.data.split('-').reverse().join('/')} ${a.horario}</td>
                <td>${a.servico}</td>
                <td>R$ ${a.valor.toFixed(2)}</td>
                <td><span class="status ${a.status.toLowerCase()}">${a.status}</span></td>
                <td>
                    ${a.status === 'Confirmado' ? `<button class="btn" style="padding:5px; background:#ef4444" onclick="cancelarAgtDono(${a.id})">Cancelar</button>` : '-'}
                </td>
            </tr>
        `;
    });
}

async function cancelarAgtDono(id) {
    if(confirm("Cancelar agendamento?")) {
        const { error } = await _supabase
            .from('agendamentos')
            .update({ status: 'Cancelado' })
            .eq('id', id);

        if (error) return alert("Erro ao cancelar agendamento.");

        const idx = agendamentos.findIndex(a => a.id === id);
        if (idx !== -1) agendamentos[idx].status = "Cancelado";
        
        filtrarAgenda('hoje');
        atualizarDashboard();
    }
}

function carregarHistorico() {
    const tbody = document.getElementById("tabelaHistorico");
    tbody.innerHTML = "";
    
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    const concluidos = agendamentos.filter(a => {
        const d = new Date(a.data);
        return a.lojaId === minhaLoja.usuario_id && a.status === "Confirmado" && d <= hoje && d >= trintaDiasAtras;
    });

    const total = concluidos.reduce((acc, curr) => acc + curr.valor, 0);
    const qtd = concluidos.length;
    const ticket = qtd > 0 ? total / qtd : 0;

    document.getElementById("hist-total").innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById("hist-qtd").innerText = qtd;
    document.getElementById("hist-ticket").innerText = `R$ ${ticket.toFixed(2)}`;

    concluidos.forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>${a.clienteNome}</td>
                <td>${a.servico}</td>
                <td>R$ ${a.valor.toFixed(2)}</td>
                <td>${a.data.split('-').reverse().join('/')} ${a.horario}</td>
            </tr>
        `;
    });
}

async function salvarDadosLoja() {
    const inputLogo = document.getElementById("loja-logo-input");
    let logo_url = minhaLoja.logo_url;

    if(inputLogo.files[0]) {
        logo_url = await converterParaBase64(inputLogo.files[0]);
    }
    
    const updates = {
        nome_loja: document.getElementById("loja-nome-edit").value,
        descricao: document.getElementById("loja-desc-edit").value,
        telefone: document.getElementById("loja-tel-edit").value,
        whatsapp: document.getElementById("loja-zap-edit").value,
        endereco: document.getElementById("loja-end-edit").value,
        logo_url: logo_url
    };

    const { error } = await _supabase
        .from('lojas')
        .update(updates)
        .eq('usuario_id', session.user.id);

    if (error) return alert("Erro ao salvar dados da loja.");

    alert("Dados da loja salvos!");
    location.reload();
}

async function salvarMetas() {
    const faturamento = parseFloat(document.getElementById("meta-dia-input").value);
    const { error } = await _supabase.from('lojas').update({ faturamento }).eq('usuario_id', session.user.id);
    if (error) alert("Erro ao salvar metas."); else alert("Metas atualizadas!");
}

function filtrarLojasDono() {
    const val = document.getElementById("inputBuscaDono").value;
    renderizarLojasDono(val);
}

function renderizarLojasDono(filtro = "") {
    const container = document.getElementById("listaLojasDono");
    if (!container) return;
    container.innerHTML = "";
    lojas
        .filter(l => l.usuario_id !== session.user.id && l.nome_loja.toLowerCase().includes(filtro.toLowerCase()))
        .forEach(loja => {
        container.innerHTML += `
            <div class="loja-card">
                <div class="loja-content">
                    <img src="${loja.logo}" class="loja-logo">
                    <h3>${loja.nome}</h3>
                    <p>${loja.descricao}</p>
                    <button class="btn" onclick="abrirAgndDono(${loja.id})">Agendar</button>
                </div>
            </div>
        `;
    });
}

function abrirAgndDono(id) {
    const loja = lojas.find(l => l.id === id);
    document.getElementById("agendar-titulo-dono").innerText = `Agendar em: ${loja.nome_loja}`;
    document.getElementById("agendar-loja-id-dono").value = loja.id;
    showSection('section-agendar-dono');
}

function confirmarAgendamentoDono() {
    const lojaId = parseInt(document.getElementById("agendar-loja-id-dono").value);
    const loja = lojas.find(l => l.id === lojaId);
    
    const novo = {
        id: Date.now(),
        clienteId: session.user.id,
        clienteNome: minhaLoja.nome_loja,
        lojaId,
        lojaNome: loja.nome_loja,
        lojaLogo: loja.logo_url,
        data: document.getElementById("agendar-data-dono").value,
        horario: document.getElementById("agendar-horario-dono").value,
        servico: document.getElementById("agendar-servico-dono").value,
        valor: parseFloat(document.getElementById("agendar-valor-dono").value),
        status: "Confirmado"
    };

    // Substituindo LocalStorage por Supabase
    const { data, error } = await _supabase
        .from('agendamentos')
        .insert([novo]);

    if (error) {
        console.error(error);
        return alert("Erro ao salvar agendamento.");
    }

    alert("Agendamento realizado com sucesso!");
    showSection('section-dash');
}

function converterParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Exposição de funções para o escopo global (window)
window.initDono = initDono;
window.logout = logout;
window.filtrarAgenda = filtrarAgenda;
window.cancelarAgtDono = cancelarAgtDono;
window.carregarHistorico = carregarHistorico;
window.salvarDadosLoja = salvarDadosLoja;
window.salvarMetas = salvarMetas;
window.filtrarLojasDono = filtrarLojasDono;
window.renderizarLojasDono = renderizarLojasDono;
window.abrirAgndDono = abrirAgndDono;
window.confirmarAgendamentoDono = confirmarAgendamentoDono;