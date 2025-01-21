import Image from 'next/image';

export const ProPlanBenefits = () => {
  return (
    <div className="mt-8 bg-gradient-to-br from-purple-900 via-[#2A2D3A] to-[#1A1B1E] rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/30 transform hover:scale-[1.02] transition-all duration-300 overflow-hidden relative">
      <div className="absolute inset-0 bg-purple-500/5 backdrop-blur-3xl z-0"></div>
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Benefícios do Plano Pro</h3>
        <ul className="space-y-6">
          <li className="flex items-center text-base group">
            <div className="flex items-center space-x-4 transform transition-transform duration-300 group-hover:translate-x-2">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-gray-200">2 horas de crédito por dia + bônus de 30h grátis por mês</span>
            </div>
          </li>
          <li className="flex items-center text-base group">
            <div className="flex items-center space-x-4 transform transition-transform duration-300 group-hover:translate-x-2">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-gray-200">Acesso completo ao assistente + Curso</span>
            </div>
          </li>
          <li className="flex items-center text-base group">
            <div className="flex items-center space-x-4 transform transition-transform duration-300 group-hover:translate-x-2">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-gray-200">Suporte exclusivo prioritário</span>
            </div>
          </li>
          <li className="flex items-center text-base group">
            <div className="flex items-center space-x-4 transform transition-transform duration-300 group-hover:translate-x-2">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-gray-200 flex items-center">
                Participação premium no 
                <div className="ml-2 bg-white/10 rounded-lg p-1 backdrop-blur-sm">
                  <Image 
                    src="https://jamez.pro/wp-content/uploads/2025/01/Teleshow-da-reals-Logo-Editavel-Esqueleto-1536x768-1-1.png"
                    alt="Teleshow do Jean"
                    width={80}
                    height={40}
                    className="rounded-md"
                  />
                </div>
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

