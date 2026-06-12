import { register } from "./auth.js";

const formCadastro = document.getElementById("formCadastro");
const tipoUsuario = document.getElementById("tipoUsuario");
const camposLoja = document.getElementById("camposLoja");
const mensagem = document.getElementById("mensagem");

// Mostrar/Ocultar campos da loja
tipoUsuario.addEventListener("change", () => {

    if (tipoUsuario.value === "lojista") {
        camposLoja.classList.remove("hidden");
    } else {
        camposLoja.classList.add("hidden");
    }

});

formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipoUsuario").value;
    const nomeLoja = document.getElementById("nomeLoja")?.value.trim() || "";
    const cnpj = document.getElementById("cnpj")?.value.trim() || "";

    if (!nome || !email || !senha) {
        exibirMensagem("Preencha todos os campos.", "red");
        return;
    }

    try {
        console.log("Iniciando registro Supabase...");
        await register(email, senha, {
            nome: nome,
            tipo: tipo,
            nomeLoja: nomeLoja,
            cnpj: cnpj
        });
        exibirMensagem("Cadastro realizado com sucesso!", "green");
        setTimeout(() => window.location.href = "Login.html", 1500);
    } catch (error) {
        console.error("Erro no cadastro:", error);
        exibirMensagem(error.message, "red");
    }
});

// Função mensagem
function exibirMensagem(texto, cor) {

    mensagem.innerText = texto;
    mensagem.style.color = cor;

}

// Máscara simples de CNPJ
const campoCnpj = document.getElementById("cnpj");

if (campoCnpj) {

    campoCnpj.addEventListener("input", (e) => {

        let valor = e.target.value.replace(/\D/g, "");

        valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
        valor = valor.replace(/(\d{4})(\d)/, "$1-$2");

        e.target.value = valor;

    });

}

// Inicialização
console.log("Cadastro.js carregado com sucesso.");