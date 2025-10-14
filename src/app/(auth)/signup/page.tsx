import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";


 const Page = async () => {   
   await requireUnauth();

   return (
      <div className="flex flex-col items-center justify-center h-screen">
         <RegisterForm />
      </div>
   );
};

export default Page;