import { _supabase } from "./supabase.js";
import { checkSession, logout } from "./auth.js";

// ===========================
// MARCAAI - CLIENTE
// ===========================

let clienteLogado = null;
let lojas = [];
let agendamentos = [];

function salvarDados() {
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

async function carregarDados() {
    const session = await checkSession();
    if (!session) return window.location.href = 'Login.html';

    const { data: userProfile } = await _supabase.from('usuarios').select('*').eq('id', session.user.id).single();
    clienteLogado = userProfile;

    console.log("Buscando lojas do Supabase...");
    const { data: lojasDb } = await _supabase.from('lojas').select('*');
    lojas = lojasDb || [];

    console.log("Buscando agendamentos do Supabase...");
    const { data: agtsDb } = await _supabase.from('agendamentos').select('*').eq('clienteId', session.user.id);
    agendamentos = agtsDb || [];
    
    renderizarLojas();
    renderizarAgenda();
    atualizarHeader();
}

window.logout = logout;
window.showSection = showSection;
window.filtrarLojas = filtrarLojas;
window.abrirAgendamento = abrirAgendamento;
window.confirmarAgendamento = confirmarAgendamento;
window.cancelarAgendamento = cancelarAgendamento;

function atualizarHeader() {
    if(!clienteLogado) return;
    document.getElementById("header-user-name").innerText = clienteLogado.nome;
    document.getElementById("header-user-img").src = clienteLogado.foto || 'https://i.pravatar.cc/100';
    
    // Preencher Perfil
    document.getElementById("perfil-nome").value = clienteLogado.nome;
    document.getElementById("perfil-email").value = clienteLogado.email;
    document.getElementById("perfil-tipo").value = clienteLogado.tipo === 'lojista' ? 'Dono de Loja' : 'Cliente';
    document.getElementById("perfil-preview").src = clienteLogado.foto || 'https://i.pravatar.cc/100';
}

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.menu-item')).find(a => a.getAttribute('onclick').includes(id));
    if(activeBtn) activeBtn.classList.add('active');

    const titles = {
        'section-buscar': 'Buscar Lojas',
        'section-agenda': 'Meus Agendamentos',
        'section-perfil': 'Meu Perfil'
    };
    document.getElementById("page-title").innerText = titles[id] || "MarcaAI";
    
    if(id === 'section-agenda') renderizarAgenda();
}

function renderizarLojas(filtro = "") {
    const container = document.getElementById("listaLojas");
    container.innerHTML = "";

    const filtradas = lojas.filter(l => l.nome.toLowerCase().includes(filtro.toLowerCase()));

    filtradas.forEach(loja => {
        container.innerHTML += `
            <div class="loja-card">
                <div class="loja-banner"></div>
                <div class="loja-content">
                    <img src="${loja.logo}" class="loja-logo">
                    <h3>${loja.nome}</h3>
                    <p>${loja.descricao || 'Sem descrição.'}</p>
                    <button class="btn" onclick="abrirAgendamento(${loja.id})">Agendar</button>
                </div>
            </div>
        `;
    });
}

function filtrarLojas() {
    const val = document.getElementById("inputBusca").value;
    renderizarLojas(val);
}

function abrirAgendamento(id) {
    const loja = lojas.find(l => l.id === id);
    document.getElementById("agendar-titulo").innerText = `Agendar em: ${loja.nome}`;
    document.getElementById("agendar-loja-id").value = loja.id;
    showSection('section-novo-agendamento');
}

function confirmarAgendamento() {
    const lojaId = parseInt(document.getElementById("agendar-loja-id").value);
    const data = document.getElementById("agendar-data").value;
    const horario = document.getElementById("agendar-horario").value;
    const servico = document.getElementById("agendar-servico").value;
    const desc = document.getElementById("agendar-desc").value;

    if(!data || !servico) return alert("Preencha data e serviço.");

    const loja = lojas.find(l => l.id === lojaId);

    const novo = {
        id: Date.now(),
        clienteId: clienteLogado.id,
        clienteNome: clienteLogado.nome,
        lojaId,
        lojaNome: loja.nome,
        lojaLogo: loja.logo,
        data,
        horario,
        servico,
        descricao: desc,
        valor: 50, // Valor padrão para exemplo
        status: "Confirmado"
    };

    // Substituindo LocalStorage por Supabase
    const { data, error } = await _supabase
        .from('agendamentos')
        .insert([novo]);

    if (error) {
        console.error(error);
        return alert("Erro ao realizar agendamento no servidor.");
    }

    alert("Agendado com sucesso no MarcaAI!");
    showSection('section-agenda');
}

function renderizarAgenda() {
    const tbody = document.getElementById("tabelaAgendamentos");
    const msgVazia = document.getElementById("agenda-vazia");
    tbody.innerHTML = "";

    const meus = agendamentos.filter(a => a.clienteId === clienteLogado.id);

    if(meus.length === 0) {
        msgVazia.classList.remove("hidden");
        return;
    }
    msgVazia.classList.add("hidden");

    meus.sort((a,b) => new Date(a.data) - new Date(b.data)).forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px">
                        <img src="${a.lojaLogo}" style="width:30px; height:30px; border-radius:50%">
                        ${a.lojaNome}
                    </div>
                </td>
                <td>${a.data.split('-').reverse().join('/')} às ${a.horario}</td>
                <td>${a.servico}</td>
                <td><span class="status ${a.status.toLowerCase()}">${a.status}</span></td>
                <td>
                    ${a.status === 'Confirmado' ? `<button class="btn" style="padding:5px; background:#ef4444" onclick="cancelarAgendamento(${a.id})">Cancelar</button>` : '-'}
                </td>
            </tr>
        `;
    });
}

function cancelarAgendamento(id) {
    if(confirm("Deseja cancelar?")) {
        const index = agendamentos.findIndex(a => a.id === id);
        agendamentos[index].status = "Cancelado";
        salvarDados();
        renderizarAgenda();
    }
}

function previewImagem(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

async function salvarPerfil() {
    const nome = document.getElementById("perfil-nome").value;
    const fotoInput = document.getElementById("perfil-foto");
    
    if(fotoInput.files[0]) {
        clienteLogado.foto = await converterParaBase64(fotoInput.files[0]);
    }
    
    clienteLogado.nome = nome;
    
    // Atualizar no array global de usuários
    let usuarios = JSON.parse(localStorage.getItem("usuarios"));
    const idx = usuarios.findIndex(u => u.id === clienteLogado.id);
    usuarios[idx].nome = nome;
    usuarios[idx].foto = clienteLogado.foto;
    
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("usuarioLogado", JSON.stringify(clienteLogado));
    
    alert("Perfil atualizado!");
    atualizarHeader();
}

// Exposição de funções essenciais para o escopo global
window.carregarDados = carregarDados;
window.renderizarLojas = renderizarLojas;
window.atualizarHeader = atualizarHeader;