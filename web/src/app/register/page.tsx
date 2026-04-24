import RegistrationForm from '@/components/RegistrationForm';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className={`${pageTitleStyles()} mb-2`}>歡迎加入</h1>
          <p className={bodySubtextStyles()}>使用電郵註冊並建立密碼</p>
        </div>
        
        <div className={panelSurfaceStyles()}>
          <RegistrationForm />
        </div>
      </main>
    </div>
  );
}


