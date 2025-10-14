import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-utils";

const Page =  async() => {
   await requireUnauth();
   return ( 
      <div className="flex flex-col items-center justify-center h-screen">
         <LoginForm />  
      </div>
   );
};

export default Page;