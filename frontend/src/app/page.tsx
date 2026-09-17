import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const session = await getServerSession();
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.05)] w-full max-w-[460px]">
        <h1 className="text-3xl font-semibold text-center mb-8">Login</h1>
        
        <LoginButton />

        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-gray-100"></div>
          <span className="px-4 text-xs text-gray-400">or sign up through email</span>
          <div className="flex-1 border-t border-gray-100"></div>
        </div>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email ID"
            className="w-full px-4 py-3 bg-[#f8f9f9] rounded-lg border border-transparent focus:bg-white focus:border-[#0FA44A] outline-none text-sm transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#f8f9f9] rounded-lg border border-transparent focus:bg-white focus:border-[#0FA44A] outline-none text-sm transition-colors"
          />
          <div className="pt-2">
            <button type="button" className="w-full py-3 bg-[#0FA44A] hover:bg-[#0d8f40] text-white rounded-lg font-medium transition-colors">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
