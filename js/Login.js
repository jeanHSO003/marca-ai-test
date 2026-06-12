import { login, getUserProfile } from "./auth.js";

// ==========================
// MARCAAI - LOGIN.JS
// ==========================

// Elementos
const formLogin = document.getElementById("formLogin");
const msgElement = document.getElementById("mensagem");

// Verificar se já existe usuário logado
verificarSessao();

// Evento de Login
formLogin.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const senha = document
        .getElementById("senha")
        .value
        .trim();

    if (!email || !senha) {

        exibirMensagem(
            "Preencha todos os campos.",
            "red"
        );

        return;
    }

    try {
        console.log("Iniciando login Supabase...");
        const authData = await login(email, senha);
        const perfil = await getUserProfile(authData.user.id);

        if (!perfil) throw new Error("Perfil não encontrado na tabela usuarios.");

        // Cache temporário para interface
        localStorage.setItem("usuarioLogado", JSON.stringify(perfil));

        exibirMensagem("Login realizado com sucesso!", "green");

        setTimeout(() => {
            if (perfil.tipo === "lojista") {
                window.location.href = "dashDono.html";
            } else {
                window.location.href = "cliente.html";
            }
        }, 1000);

    } catch (error) {
        console.error("Erro no login:", error);
        exibirMensagem(error.message || "E-mail ou senha inválidos.", "red");
    }

});

// ==========================
// VERIFICAR SESSÃO
// ==========================

function verificarSessao() {
    // No Supabase a verificação é assíncrona, fazemos no DOMContentLoaded das páginas protegidas
}

// ==========================
// LOGOUT GLOBAL
// ==========================

function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "Login.html";
}

// ==========================
// EXIBIR MENSAGEM
// ==========================

function exibirMensagem(texto, cor) {

    msgElement.innerText = texto;
    msgElement.style.color = cor;

}

// ==========================
// RECUPERAR DADOS USUÁRIO
// ==========================

function getUsuarioLogado() {

    return JSON.parse(
        localStorage.getItem("usuarioLogado")
    );

}

// ==========================
// VERIFICAR SE ESTÁ LOGADO
// ==========================

function estaLogado() {

    return localStorage.getItem(
        "usuarioLogado"
    ) !== null;

}

// ==========================
// PROTEGER PÁGINAS
// ==========================

function protegerPagina() {

    if (!estaLogado()) {

        window.location.href =
            "Login.html";

    }

}

// ==========================
// PEGAR TIPO DO USUÁRIO
// ==========================

function getTipoUsuario() {

    const usuario =
        getUsuarioLogado();

    if (!usuario) return null;

    return usuario.tipo;

}

// ==========================
// INICIALIZAÇÃO
// ==========================

console.log(
    "Login.js carregado com sucesso."
);

// Utilitário Global de Imagem
function converterParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Exposição de funções para o escopo global para compatibilidade com scripts HTML e eventos inline
window.verificarSessao = verificarSessao;
window.logout = logout;
window.exibirMensagem = exibirMensagem;
window.getUsuarioLogado = getUsuarioLogado;
window.estaLogado = estaLogado;
window.protegerPagina = protegerPagina;
window.getTipoUsuario = getTipoUsuario;
window.converterParaBase64 = converterParaBase64;