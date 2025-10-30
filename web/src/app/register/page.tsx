import RegistrationForm from '@/components/RegistrationForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">歡迎加入</h1>
          <p className="text-gray-300">使用電郵註冊並建立密碼</p>
        </div>
        
        <div className="border border-gray-600 bg-gray-800 rounded-lg p-6 shadow-md">
          <RegistrationForm />
        </div>
      </main>
    </div>
  );
}


