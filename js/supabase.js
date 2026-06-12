// Configuração Central do Supabase
const SUPABASE_URL = "https://wvwkgkpyqxbwpadgdnmv.supabase.co";
const SUPABASE_KEY = "sb_publishable_FwAhVGYmYUKC53Y8QZEHiQ_D54Wvly"; // Certifique-se que esta chave é a Publishable (anon)

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export { _supabase };

console.log("Supabase Client inicializado.");