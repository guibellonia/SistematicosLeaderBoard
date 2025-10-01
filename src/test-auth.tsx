import { supabase } from './utils/supabase/client';

// Script temporário para testar a autenticação do Supabase
export async function testSupabaseAuth() {
  try {
    console.log('🧪 Testando Supabase Auth...');
    
    // Verificar se há sessão ativa
    const { data: { session } } = await supabase.auth.getSession();
    console.log('📱 Sessão atual:', session ? 'ativa' : 'nenhuma');
    
    if (session) {
      console.log('👤 Usuário:', session.user.email);
      console.log('🔑 Token:', session.access_token.substring(0, 20) + '...');
    }
    
    return { success: true, session };
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error };
  }
}

// Execute o teste automaticamente quando este arquivo for importado
testSupabaseAuth().then(result => {
  console.log('🧪 Resultado do teste:', result);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
});