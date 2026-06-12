import { _supabase } from "./supabase.js";

export async function login(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function register(email, password, metadata) {
    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata
        }
    });
    if (error) throw error;
    
    console.log("Usuário criado no Auth, inserindo dados na tabela usuarios...");

    // 1. Inserir perfil na tabela 'usuarios'
    const { error: userTableError } = await _supabase
        .from('usuarios')
        .insert([{
            id: data.user.id,
            nome: metadata.nome,
            email: email,
            tipo: metadata.tipo
        }]);

    if (userTableError) {
        console.error("Erro na tabela usuarios:", userTableError);
        throw userTableError;
    }

    // 2. Se for lojista, criar entrada na tabela lojas
    if (metadata.tipo === 'lojista') {
        console.log("Criando registro da loja...");
        await createInitialStore(data.user.id, metadata.nomeLoja, metadata.cnpj);
    }
    
    return data;
}

async function createInitialStore(userId, nomeLoja, cnpj) {
    const { error } = await _supabase
        .from('lojas')
        .insert([
            {
                usuario_id: userId,
                nome_loja: nomeLoja,
                cnpj: cnpj,
                descricao: "Nova loja MarcaAI"
            }
        ]);

    if (error) {
        console.error("Erro ao criar loja:", error);
        throw error;
    }
}

export async function logout() {
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem("usuarioLogado");
    window.location.href = "Login.html";
}

export async function checkSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
}

export async function getUserProfile(userId) {
    const { data, error } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
    return data;
}